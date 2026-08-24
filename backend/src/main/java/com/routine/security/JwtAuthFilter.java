package com.routine.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter đọc Bearer token từ header, xác thực và nạp SecurityContext.
 * Hỗ trợ cả nhân viên (STAFF) lẫn khách hàng (CUSTOMER).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        Claims claims = tokenProvider.parse(token);
        if (claims != null && tokenProvider.isValidAccessToken(claims)
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            Long userId = tokenProvider.getUserId(claims);
            String email = tokenProvider.getEmail(claims);
            String role = tokenProvider.getRole(claims);
            String accountType = tokenProvider.getAccountType(claims);

            if (JwtTokenProvider.ACCOUNT_CUSTOMER.equals(accountType)) {
                CustomerPrincipal principal = new CustomerPrincipal(userId, email, role);
                var auth = new UsernamePasswordAuthenticationToken(
                        principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } else {
                UserPrincipal principal = new UserPrincipal(userId, email, "", "", role, true);
                var auth = new UsernamePasswordAuthenticationToken(
                        principal, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}
