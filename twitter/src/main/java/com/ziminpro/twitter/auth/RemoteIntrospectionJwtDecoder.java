package com.ziminpro.twitter.auth;

import java.text.ParseException;
import java.util.HashMap;
import java.util.Map;

import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

public class RemoteIntrospectionJwtDecoder implements ReactiveJwtDecoder {
    private final UmsIntrospectionClient introspectionClient;
    private final String issuer;

    public RemoteIntrospectionJwtDecoder(UmsIntrospectionClient introspectionClient, String issuer) {
        this.introspectionClient = introspectionClient;
        this.issuer = issuer;
    }

    @Override
    public Mono<Jwt> decode(String token) {
        return Mono.fromCallable(() -> SignedJWT.parse(token))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(signed -> introspectionClient.introspect(token)
                        .flatMap(response -> {
                            if (!response.active()) {
                                return Mono.error(new BadJwtException("Token revoked"));
                            }
                            return Mono.fromCallable(() -> buildJwt(token, signed, response))
                                    .subscribeOn(Schedulers.boundedElastic());
                        }))
                .onErrorMap(ex -> ex instanceof BadJwtException ? ex : new BadJwtException("Invalid token", ex));
    }

    private Jwt buildJwt(String token, SignedJWT signed, IntrospectResponse response) throws ParseException {
        JWTClaimsSet claimsSet = signed.getJWTClaimsSet();
        if (claimsSet.getIssuer() == null || !claimsSet.getIssuer().equals(issuer)) {
            throw new BadJwtException("Invalid issuer");
        }
        if (response.sub() != null && claimsSet.getSubject() != null
                && !response.sub().equals(claimsSet.getSubject())) {
            throw new BadJwtException("Subject mismatch");
        }

        Map<String, Object> headers = new HashMap<>(signed.getHeader().toJSONObject());
        Map<String, Object> claims = new HashMap<>(claimsSet.getClaims());
        if (response.roles() != null) {
            claims.put("roles", response.roles());
        }

        Jwt.Builder builder = Jwt.withTokenValue(token)
                .headers(headerMap -> headerMap.putAll(headers))
                .claims(claimMap -> claimMap.putAll(claims));
        if (claimsSet.getIssueTime() != null) {
            builder.issuedAt(claimsSet.getIssueTime().toInstant());
        }
        if (claimsSet.getExpirationTime() != null) {
            builder.expiresAt(claimsSet.getExpirationTime().toInstant());
        }
        return builder.build();
    }
}
