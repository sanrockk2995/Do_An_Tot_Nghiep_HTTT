package com.routine.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * Cho phép frontend React (Vite) gọi API.
 * - app.cors.allowed-origins: whitelist origin cụ thể (localhost dev...).
 * - app.cors.allow-lan: true → chấp nhận thêm mọi origin http(s)://<IP>[:port]
 *   (truy cập trang quản trị từ máy khác trong mạng nội bộ/LAN).
 * Kiểm soát chặt hơn ở tầng IP whitelist khi đăng nhập nội bộ (IpWhitelistService).
 */
@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    /** Chấp nhận origin từ IP mạng nội bộ (mặc định bật để truy cập quản trị qua LAN). */
    @Value("${app.cors.allow-lan:true}")
    private boolean allowLan;

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = new ArrayList<>(Arrays.asList(allowedOrigins.split(",")));
        if (allowLan) {
            // Mẫu khớp mọi host dạng IP IPv4: http://192.168.x.x:5173, http://10.0.0.5 ...
            origins.add("http://*:*");
            origins.add("https://*:*");
            // Mẫu KHÔNG port — bắt buộc cho origin qua reverse proxy/tunnel
            // (vd https://ten-mien.tunnel chỉ gửi Origin "https://ten-mien.tunnel", không kèm :443)
            origins.add("http://*");
            origins.add("https://*");
            // Mẫu khớp host dạng IPv6 (vd http://[::1]:5173, http://[2402:...]:5173 ...)
            origins.add("http://[*]:*");
            origins.add("https://[*]:*");
            origins.add("http://[*]");
            origins.add("https://[*]");
            origins.add("http://[::1]:*");
            origins.add("https://[::1]:*");
            origins.add("http://[::1]");
            origins.add("https://[::1]");
        }
        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}
