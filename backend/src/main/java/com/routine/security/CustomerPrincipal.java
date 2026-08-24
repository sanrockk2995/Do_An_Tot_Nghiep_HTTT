package com.routine.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Khách hàng đăng nhập đưa vào SecurityContext.
 */
@Getter
@AllArgsConstructor
public class CustomerPrincipal {

    private final Long id;
    private final String email;
    private final String role; // luôn là CUSTOMER
}
