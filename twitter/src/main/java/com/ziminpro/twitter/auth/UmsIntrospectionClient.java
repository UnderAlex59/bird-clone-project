package com.ziminpro.twitter.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import reactor.core.publisher.Mono;

@Service
public class UmsIntrospectionClient {
    private final WebClient client;
    private final String introspectPath;

    public UmsIntrospectionClient(@Value("${ums.host}") String host,
                                  @Value("${ums.port}") String port,
                                  @Value("${ums.paths.introspect}") String introspectPath) {
        this.client = WebClient.builder()
                .baseUrl(host + ":" + port)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
        this.introspectPath = introspectPath;
    }

    public Mono<IntrospectResponse> introspect(String token) {
        return client.post()
                .uri(introspectPath)
                .bodyValue(new IntrospectRequest(token))
                .retrieve()
                .bodyToMono(IntrospectResponse.class);
    }
}
