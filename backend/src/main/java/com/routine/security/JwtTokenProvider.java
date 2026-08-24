package com.routine.security;

import com.routine.config.JwtConfig;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Sinh và xác thực access token / refresh token (HS256).
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_TYPE = "type";
    private static final String CLAIM_ACCOUNT_TYPE = "accountType";
    private static final String CLAIM_EMAIL = "email";

    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    /** Loại tài khoản: STAFF (bảng users) hoặc CUSTOMER (bảng customers). */
    public static final String ACCOUNT_STAFF = "STAFF";
    public static final String ACCOUNT_CUSTOMER = "CUSTOMER";

    private final JwtConfig jwtConfig;
    private final SecretKey key;

    public JwtTokenProvider(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
        this.key = Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    /** Sinh access token cho nhân viên nội bộ. */
    public String generateAccessToken(Long userId, String email, String role) {
        return generateToken(userId, email, role, ACCOUNT_STAFF, TYPE_ACCESS,
                jwtConfig.getAccessTokenTtlMinutes() * 60_000L);
    }

    /** Sinh refresh token cho nhân viên nội bộ. */
    public String generateRefreshToken(Long userId, String email, String role) {
        return generateToken(userId, email, role, ACCOUNT_STAFF, TYPE_REFRESH,
                jwtConfig.getRefreshTokenTtlDays() * 86_400_000L);
    }

    /** Sinh access token cho khách hàng. */
    public String generateCustomerAccessToken(Long customerId, String email) {
        return generateToken(customerId, email, "CUSTOMER", ACCOUNT_CUSTOMER, TYPE_ACCESS,
                jwtConfig.getAccessTokenTtlMinutes() * 60_000L);
    }

    /** Sinh refresh token cho khách hàng. */
    public String generateCustomerRefreshToken(Long customerId, String email) {
        return generateToken(customerId, email, "CUSTOMER", ACCOUNT_CUSTOMER, TYPE_REFRESH,
                jwtConfig.getRefreshTokenTtlDays() * 86_400_000L);
    }

    private String generateToken(Long id, String email, String role, String accountType,
                                 String type, long ttlMillis) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(id))
                .claim(CLAIM_EMAIL, email)
                .claim(CLAIM_ROLE, role)
                .claim(CLAIM_TYPE, type)
                .claim(CLAIM_ACCOUNT_TYPE, accountType)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + ttlMillis))
                .signWith(key)
                .compact();
    }

    /** Trả về Claims nếu token hợp lệ, ngược lại null. */
    public Claims parse(String token) {
        try {
            return Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload();
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("JWT không hợp lệ: {}", e.getMessage());
            return null;
        }
    }

    public boolean isValidAccessToken(Claims claims) {
        return claims != null && TYPE_ACCESS.equals(claims.get(CLAIM_TYPE, String.class));
    }

    public boolean isValidRefreshToken(Claims claims) {
        return claims != null && TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class));
    }

    public Long getUserId(Claims claims) {
        return Long.valueOf(claims.getSubject());
    }

    public String getEmail(Claims claims) {
        return claims.get(CLAIM_EMAIL, String.class);
    }

    public String getRole(Claims claims) {
        return claims.get(CLAIM_ROLE, String.class);
    }

    public String getAccountType(Claims claims) {
        return claims.get(CLAIM_ACCOUNT_TYPE, String.class);
    }
}
