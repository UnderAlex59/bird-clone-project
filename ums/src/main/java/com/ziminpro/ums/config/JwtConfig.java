package com.ziminpro.ums.config;

import com.ziminpro.ums.auth.UserSecretJwtDecoder;
import com.ziminpro.ums.dao.AuthRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

@Configuration
public class JwtConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @Primary
    public ReactiveJwtDecoder jwtDecoder(@Value("${app.jwt.issuer}") String issuer,
                                         AuthRepository authRepository) {
        return new UserSecretJwtDecoder(authRepository, issuer);
    }
}
