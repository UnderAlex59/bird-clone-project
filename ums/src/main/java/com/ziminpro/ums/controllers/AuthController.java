package com.ziminpro.ums.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.ziminpro.ums.auth.AuthLoginRequest;
import com.ziminpro.ums.auth.AuthRegisterRequest;
import com.ziminpro.ums.auth.AuthResponse;
import com.ziminpro.ums.auth.AuthService;
import com.ziminpro.ums.auth.IntrospectRequest;
import com.ziminpro.ums.auth.IntrospectResponse;
import com.ziminpro.ums.dtos.Constants;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public Mono<ResponseEntity<Map<String, Object>>> register(@RequestBody AuthRegisterRequest request) {
        return authService.register(request)
                .map(response -> buildResponse("201", "User registered", response))
                .onErrorResume(ex -> Mono.just(buildResponse("400", ex.getMessage(), false)));
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<Map<String, Object>>> login(@RequestBody AuthLoginRequest request) {
        return authService.login(request)
                .map(response -> buildResponse("200", "Login successful", response))
                .onErrorResume(ex -> Mono.just(buildResponse("401", ex.getMessage(), false)));
    }

    @PostMapping("/rotate-secret")
    public Mono<ResponseEntity<Map<String, Object>>> rotateSecret(@AuthenticationPrincipal Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            return Mono.just(buildResponse("401", "Unauthorized", false));
        }
        UUID userId = UUID.fromString(jwt.getSubject());
        return authService.rotateSecret(userId)
                .map(response -> buildResponse("200", "Secret rotated", response))
                .onErrorResume(ex -> Mono.just(buildResponse("400", ex.getMessage(), false)));
    }

    @PostMapping("/rotate-secret/{user-id}")
    public Mono<ResponseEntity<Map<String, Object>>> rotateSecretForUser(
            @PathVariable(value = "user-id") String userId,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null || jwt.getSubject() == null) {
            return Mono.just(buildResponse("401", "Unauthorized", false));
        }
        if (!hasRole(jwt, "ADMIN")) {
            return Mono.just(buildResponse("403", "Admin role required", false));
        }

        UUID targetId;
        try {
            targetId = UUID.fromString(userId);
        } catch (IllegalArgumentException ex) {
            return Mono.just(buildResponse("400", "Invalid user id", false));
        }

        return authService.rotateSecretForUser(targetId)
                .map(result -> buildResponse("200", "Secret rotated", result.toString()))
                .onErrorResume(ex -> {
                    String message = ex.getMessage() == null ? "Failed to rotate secret" : ex.getMessage();
                    String code = "400";
                    if ("User not found".equals(message)) {
                        code = "404";
                    }
                    return Mono.just(buildResponse(code, message, false));
                });
    }

    @PostMapping("/introspect")
    public Mono<IntrospectResponse> introspect(@RequestBody IntrospectRequest request) {
        if (request == null || request.token() == null) {
            return Mono.just(new IntrospectResponse(false, null, java.util.List.of()));
        }
        return authService.introspect(request.token());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(String code, String message, Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put(Constants.CODE, code);
        response.put(Constants.MESSAGE, message);
        response.put(Constants.DATA, data);
        return ResponseEntity.ok()
                .header(Constants.CONTENT_TYPE, Constants.APPLICATION_JSON)
                .header(Constants.ACCEPT, Constants.APPLICATION_JSON)
                .body(response);
    }

    private boolean hasRole(Jwt jwt, String role) {
        if (jwt == null || role == null || role.isBlank()) {
            return false;
        }
        List<String> roles = jwt.getClaimAsStringList("roles");
        if (roles == null || roles.isEmpty()) {
            return false;
        }
        for (String entry : roles) {
            if (entry != null && role.equalsIgnoreCase(entry.trim())) {
                return true;
            }
        }
        return false;
    }
}
