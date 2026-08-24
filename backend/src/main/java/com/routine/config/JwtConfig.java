package com.routine.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Cấu hình JWT đọc từ application.yml (app.jwt.*).
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtConfig {

    private String secret;
    private long accessTokenTtlMinutes = 30;
    private long refreshTokenTtlDays = 7;
    private String refreshCookieName = "routine_refresh_token";
}
