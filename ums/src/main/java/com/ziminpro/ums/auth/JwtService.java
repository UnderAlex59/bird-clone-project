package com.ziminpro.ums.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final String issuer;
    private final long ttlSeconds;

    public JwtService(@Value("${app.jwt.issuer}") String issuer,
                      @Value("${app.jwt.ttl-seconds}") long ttlSeconds) {
        this.issuer = issuer;
        this.ttlSeconds = ttlSeconds;
    }

    public AuthResponse buildAuthResponse(AuthUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plusSeconds(ttlSeconds);

        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(expiresAt))
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("roles", user.getRoles())
                .build();

        String token = signToken(user, claims);
        AuthUserSummary summary = new AuthUserSummary(
                user.getId().toString(),
                user.getName(),
                user.getEmail(),
                user.getRoles());
        return new AuthResponse(token, expiresAt.getEpochSecond(), summary);
    }

    private String signToken(AuthUser user, JWTClaimsSet claims) {
        if (user.getSecretKey() == null || user.getSecretKey().isBlank()) {
            throw new IllegalStateException("User secret is missing");
        }
        try {
            SignedJWT signed = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            signed.sign(new MACSigner(user.getSecretKey().getBytes(StandardCharsets.UTF_8)));
            return signed.serialize();
        } catch (JOSEException e) {
            throw new IllegalStateException("Token signing failed", e);
        }
    }
}
