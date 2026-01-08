package com.ziminpro.twitter.config;

import com.ziminpro.twitter.auth.RemoteIntrospectionJwtDecoder;
import com.ziminpro.twitter.auth.UmsIntrospectionClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

@Configuration
public class JwtConfig {

    @Bean
    @Primary
    public ReactiveJwtDecoder jwtDecoder(UmsIntrospectionClient introspectionClient,
                                         @Value("${app.jwt.issuer}") String issuer) {
        return new RemoteIntrospectionJwtDecoder(introspectionClient, issuer);
    }
}
