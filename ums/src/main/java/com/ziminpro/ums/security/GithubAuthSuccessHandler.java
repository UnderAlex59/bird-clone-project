package com.ziminpro.ums.security;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ziminpro.ums.auth.AuthResponse;
import com.ziminpro.ums.auth.AuthService;
import com.ziminpro.ums.dtos.Constants;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.server.WebFilterExchange;
import org.springframework.security.web.server.authentication.ServerAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.util.UriComponentsBuilder;

import reactor.core.publisher.Mono;

@Component
public class GithubAuthSuccessHandler implements ServerAuthenticationSuccessHandler {
    private final AuthService authService;
    private final ObjectMapper objectMapper;

    public GithubAuthSuccessHandler(AuthService authService, ObjectMapper objectMapper) {
        this.authService = authService;
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> onAuthenticationSuccess(WebFilterExchange webFilterExchange, Authentication authentication) {
        if (!(authentication instanceof OAuth2AuthenticationToken token)) {
            return writeError(webFilterExchange.getExchange(), "Unsupported authentication");
        }

        return authService.handleGithubLogin(token.getPrincipal())
                .flatMap(response -> redirectWithSession(webFilterExchange.getExchange(), response))
                .onErrorResume(ex -> writeError(webFilterExchange.getExchange(), ex.getMessage()));
    }

    private Mono<Void> redirectWithSession(ServerWebExchange exchange, AuthResponse authResponse) {
        try {
            byte[] payload = objectMapper.writeValueAsBytes(authResponse);
            String encoded = Base64.getUrlEncoder().withoutPadding().encodeToString(payload);
            var location = UriComponentsBuilder.fromPath("/login")
                    .queryParam("auth", encoded)
                    .build()
                    .toUri();
            ServerHttpResponse response = exchange.getResponse();
            response.setStatusCode(HttpStatus.FOUND);
            response.getHeaders().setLocation(location);
            return response.setComplete();
        } catch (Exception e) {
            return writeError(exchange, "Auth redirect failed");
        }
    }

    private Mono<Void> writeError(ServerWebExchange exchange, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put(Constants.CODE, "401");
        body.put(Constants.MESSAGE, message == null ? "GitHub login failed" : message);
        body.put(Constants.DATA, false);
        return writeJson(exchange, HttpStatus.UNAUTHORIZED, body);
    }

    private Mono<Void> writeJson(ServerWebExchange exchange, HttpStatus status, Map<String, Object> body) {
        try {
            byte[] payload = objectMapper.writeValueAsBytes(body);
            exchange.getResponse().setStatusCode(status);
            exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
            exchange.getResponse().getHeaders().setContentLength(payload.length);
            return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory()
                    .wrap(payload)));
        } catch (Exception e) {
            exchange.getResponse().setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR);
            exchange.getResponse().getHeaders().setContentType(MediaType.TEXT_PLAIN);
            byte[] payload = "Auth response error".getBytes(StandardCharsets.UTF_8);
            return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory()
                    .wrap(payload)));
        }
    }
}
