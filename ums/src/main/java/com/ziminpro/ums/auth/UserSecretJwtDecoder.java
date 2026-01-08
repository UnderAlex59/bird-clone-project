package com.ziminpro.ums.auth;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.ziminpro.ums.dao.AuthRepository;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

public class UserSecretJwtDecoder implements ReactiveJwtDecoder {
    private final AuthRepository authRepository;
    private final OAuth2TokenValidator<Jwt> validator;

    public UserSecretJwtDecoder(AuthRepository authRepository, String issuer) {
        this.authRepository = authRepository;
        this.validator = JwtValidators.createDefaultWithIssuer(issuer);
    }

    @Override
    public Mono<Jwt> decode(String token) {
        return Mono.fromCallable(() -> SignedJWT.parse(token))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(signed -> Mono.fromCallable(() -> decodeSigned(token, signed))
                        .subscribeOn(Schedulers.boundedElastic()))
                .onErrorMap(ex -> ex instanceof BadJwtException ? ex : new BadJwtException("Invalid token", ex));
    }

    private Jwt decodeSigned(String token, SignedJWT signed) throws ParseException, JOSEException {
        JWTClaimsSet claimsSet = signed.getJWTClaimsSet();
        String subject = claimsSet.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new BadJwtException("Missing subject");
        }

        AuthUser user = authRepository.findAuthUserById(UUID.fromString(subject));
        if (user.getId() == null) {
            throw new BadJwtException("Unknown user");
        }
        if (user.getSecretKey() == null || user.getSecretKey().isBlank()) {
            throw new BadJwtException("User secret missing");
        }

        boolean verified = signed.verify(new MACVerifier(user.getSecretKey().getBytes(StandardCharsets.UTF_8)));
        if (!verified) {
            throw new BadJwtException("Invalid signature");
        }

        Jwt jwt = buildJwt(token, signed, claimsSet);
        OAuth2TokenValidatorResult result = validator.validate(jwt);
        if (result.hasErrors()) {
            throw new BadJwtException(result.getErrors().iterator().next().getDescription());
        }
        return jwt;
    }

    private Jwt buildJwt(String token, SignedJWT signed, JWTClaimsSet claimsSet) {
        Map<String, Object> headers = new HashMap<>(signed.getHeader().toJSONObject());
        Map<String, Object> claims = new HashMap<>(claimsSet.getClaims());
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
