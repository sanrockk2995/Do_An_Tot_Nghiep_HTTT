package com.routine.security;

import com.routine.exception.ForbiddenException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;

/**
 * Danh sách địa chỉ IP được phép đăng nhập hệ thống nội bộ (nhân viên).
 *
 * Cấu hình qua application.yml:
 *   app:
 *     security:
 *       staff-ip-whitelist: 127.0.0.1,::1,192.168.1.0/24
 *       staff-ip-whitelist-enabled: true
 *
 * Hỗ trợ:
 *  - IP đơn:            192.168.1.10
 *  - Dải CIDR:          192.168.1.0/24
 *  - Dải gạch ngang:    192.168.1.10-192.168.1.50
 *  - Wildcard "*":      cho phép mọi IP (mặc định cho môi trường demo)
 *  - IPv6 loopback ::1 và IPv4-mapped (::ffff:192.168.1.10) được chuẩn hoá.
 */
@Slf4j
@Service
public class IpWhitelistService {

    private final List<String> whitelist;
    private final boolean enabled;
    private final boolean allowAll;

    public IpWhitelistService(
            @Value("${app.security.staff-ip-whitelist:*}") String configured,
            @Value("${app.security.staff-ip-whitelist-enabled:true}") boolean enabled) {
        this.enabled = enabled;
        this.whitelist = Arrays.stream(configured.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
        this.allowAll = this.whitelist.contains("*");
        if (!enabled) {
            log.info("IP whitelist đăng nhập nội bộ đang TẮT - mọi IP đều được phép");
        } else if (allowAll) {
            log.info("IP whitelist đăng nhập nội bộ: cho phép mọi IP (*)");
        } else {
            log.info("IP whitelist đăng nhập nội bộ: {}", this.whitelist);
        }
    }

    /** Ném ForbiddenException nếu IP của request không nằm trong danh sách cho phép. */
    public void checkStaffLoginAllowed(HttpServletRequest request) {
        if (!enabled || allowAll) {
            return;
        }
        String ip = extractClientIp(request);
        if (!isAllowed(ip)) {
            log.warn("Từ chối đăng nhập nội bộ từ IP không được phép: {} ({})",
                    ip, request.getHeader("X-Forwarded-For"));
            throw new ForbiddenException(
                    "Địa chỉ IP " + ip + " không nằm trong danh sách được phép đăng nhập hệ thống nội bộ. "
                            + "Vui lòng liên hệ quản trị viên.");
        }
    }

    /** Lấy IP thật của client (ưu tiên X-Forwarded-For khi đứng sau reverse proxy). */
    public String extractClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwarded)) {
            // "client, proxy1, proxy2" → client là phần đầu
            return normalize(forwarded.split(",")[0].trim());
        }
        String realIp = request.getHeader("X-Real-IP");
        if (StringUtils.hasText(realIp)) {
            return normalize(realIp.trim());
        }
        return normalize(request.getRemoteAddr());
    }

    /** Chuẩn hoá: bỏ prefix IPv6-mapped (::ffff:) và rút gọn IPv6 loopback dạng đầy đủ. */
    private String normalize(String ip) {
        if (ip == null) return "";
        String result = ip.trim();
        // IPv4-mapped IPv6 (::ffff:192.168.1.10) → giữ phần IPv4
        if (result.startsWith("::ffff:")) {
            result = result.substring(7);
        }
        // Java trả IPv6 loopback dạng "0:0:0:0:0:0:0:1" thay vì "::1"
        if ("0:0:0:0:0:0:0:1".equals(result)) {
            result = "::1";
        }
        return result;
    }

    /** Kiểm tra IP có khớp một mục trong whitelist hay không. */
    private boolean isAllowed(String ip) {
        if (!StringUtils.hasText(ip)) {
            return false;
        }
        for (String entry : whitelist) {
            if (entry.equals(ip)) return true;                 // khớp chính xác
            if (entry.contains("/")) {
                if (matchesCidr(ip, entry)) return true;       // dải CIDR
            } else if (entry.contains("-")) {
                if (matchesRange(ip, entry)) return true;      // khoảng a-b
            } else if (entry.endsWith(".*")) {
                if (matchesWildcardPrefix(ip, entry)) return true; // 192.168.1.*
            }
        }
        return false;
    }

    /** Khớp wildcard dạng "192.168.*" hoặc "192.168.1.*". */
    private boolean matchesWildcardPrefix(String ip, String pattern) {
        String prefix = pattern.substring(0, pattern.length() - 2); // bỏ ".*"
        String[] prefixParts = prefix.split("\\.");
        String[] parts = ip.split("\\.");
        if (parts.length < prefixParts.length) return false;
        for (int i = 0; i < prefixParts.length; i++) {
            if (!prefixParts[i].equals(parts[i])) return false;
        }
        return true;
    }

    /** Khớp dải CIDR IPv4: 192.168.1.0/24 */
    private boolean matchesCidr(String ip, String cidr) {
        try {
            String[] segs = cidr.split("/");
            byte[] netBytes = toBytes(segs[0]);
            if (netBytes == null || netBytes.length != 4) return false;
            int prefixLen = Integer.parseInt(segs[1]);
            byte[] ipBytes = toBytes(ip);
            if (ipBytes == null || ipBytes.length != 4) return false;
            int mask = prefixLen == 0 ? 0 : (0xFFFFFFFF << (32 - prefixLen));
            int netInt = toInt(netBytes) & mask;
            int ipInt = toInt(ipBytes) & mask;
            return netInt == ipInt;
        } catch (Exception e) {
            log.warn("Mục whitelist CIDR không hợp lệ: {}", cidr);
            return false;
        }
    }

    /** Khớp khoảng "192.168.1.10-192.168.1.50". */
    private boolean matchesRange(String ip, String range) {
        try {
            String[] ends = range.split("-");
            Long from = toUnsignedLong(toBytes(ends[0].trim()));
            Long to = toUnsignedLong(toBytes(ends[1].trim()));
            Long current = toUnsignedLong(toBytes(ip));
            return from != null && to != null && current != null
                    && current >= from && current <= to;
        } catch (Exception e) {
            log.warn("Mục whitelist khoảng IP không hợp lệ: {}", range);
            return false;
        }
    }

    private byte[] toBytes(String ip) {
        if (ip == null || !ip.matches("\\d{1,3}(\\.\\d{1,3}){3}")) return null;
        String[] parts = ip.split("\\.");
        byte[] bytes = new byte[4];
        for (int i = 0; i < 4; i++) {
            int v = Integer.parseInt(parts[i]);
            if (v > 255) return null;
            bytes[i] = (byte) v;
        }
        return bytes;
    }

    private int toInt(byte[] b) {
        return ((b[0] & 0xFF) << 24) | ((b[1] & 0xFF) << 16) | ((b[2] & 0xFF) << 8) | (b[3] & 0xFF);
    }

    private Long toUnsignedLong(byte[] b) {
        if (b == null) return null;
        return ((long) (b[0] & 0xFF) << 24) | ((long) (b[1] & 0xFF) << 16)
                | ((long) (b[2] & 0xFF) << 8) | (b[3] & 0xFF);
    }
}
