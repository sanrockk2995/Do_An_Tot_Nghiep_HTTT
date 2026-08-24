package com.routine.security;

import com.routine.exception.BadRequestException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Tiện ích lấy thông tin người dùng hiện tại từ SecurityContext.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    /** ID của nhân viên nội bộ đang thao tác. */
    public static Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal p) {
            return p.getId();
        }
        throw new BadRequestException("Yêu cầu đăng nhập tài khoản nhân viên");
    }

    /** ID của khách hàng đang thao tác. */
    public static Long currentCustomerId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomerPrincipal p) {
            return p.getId();
        }
        throw new BadRequestException("Yêu cầu đăng nhập tài khoản khách hàng");
    }

    public static boolean isCustomer() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof CustomerPrincipal;
    }
}
