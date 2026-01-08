package com.ziminpro.ums.auth;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import com.ziminpro.ums.dao.AuthRepository;
import com.ziminpro.ums.dao.UmsRepository;
import com.ziminpro.ums.dtos.Roles;
import com.ziminpro.ums.dtos.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.stereotype.Service;

import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Service
public class AuthService {
    private final AuthRepository authRepository;
    private final UmsRepository umsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final ReactiveJwtDecoder jwtDecoder;

    public AuthService(AuthRepository authRepository,
                       UmsRepository umsRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       ReactiveJwtDecoder jwtDecoder) {
        this.authRepository = authRepository;
        this.umsRepository = umsRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.jwtDecoder = jwtDecoder;
    }

    public Mono<AuthResponse> register(AuthRegisterRequest request) {
        return Mono.fromCallable(() -> {
            validateRegisterRequest(request);

            AuthUser existing = authRepository.findAuthUserByEmail(request.email().trim());
            if (existing.getId() != null) {
                throw new IllegalArgumentException("Email already registered");
            }

            User user = toUser(request);
            UUID userId = umsRepository.createUser(user);
            if (userId == null) {
                throw new IllegalStateException("User registration failed");
            }

            AuthUser created = authRepository.findAuthUserById(userId);
            if (created.getId() == null) {
                throw new IllegalStateException("User registration failed");
            }
            ensureSecret(created);
            return jwtService.buildAuthResponse(created);
        }).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<AuthResponse> login(AuthLoginRequest request) {
        return Mono.fromCallable(() -> {
            if (request == null || isBlank(request.email()) || isBlank(request.password())) {
                throw new IllegalArgumentException("Email and password are required");
            }

            AuthUser user = authRepository.findAuthUserByEmail(request.email().trim());
            if (user.getId() == null) {
                throw new IllegalArgumentException("Invalid credentials");
            }

            String storedPassword = user.getPasswordHash();
            if (storedPassword == null) {
                throw new IllegalArgumentException("Invalid credentials");
            }

            boolean matches = false;
            if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$")) {
                matches = passwordEncoder.matches(request.password(), storedPassword);
            } else {
                matches = storedPassword.equals(request.password());
                if (matches) {
                    String upgraded = passwordEncoder.encode(request.password());
                    authRepository.updateUserPassword(user.getId(), upgraded);
                    user.setPasswordHash(upgraded);
                }
            }

            if (!matches) {
                throw new IllegalArgumentException("Invalid credentials");
            }

            ensureSecret(user);
            return jwtService.buildAuthResponse(user);
        }).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<AuthResponse> rotateSecret(UUID userId) {
        return Mono.fromCallable(() -> {
            AuthUser user = authRepository.findAuthUserById(userId);
            if (user.getId() == null) {
                throw new IllegalArgumentException("User not found");
            }

            String newSecret = SecretGenerator.newSecret();
            authRepository.updateUserSecret(userId, newSecret);
            user.setSecretKey(newSecret);
            return jwtService.buildAuthResponse(user);
        }).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<IntrospectResponse> introspect(String token) {
        if (isBlank(token)) {
            return Mono.just(new IntrospectResponse(false, null, List.of()));
        }
        return jwtDecoder.decode(token)
                .map(jwt -> {
                    List<String> roles = jwt.getClaimAsStringList("roles");
                    return new IntrospectResponse(true, jwt.getSubject(), roles == null ? List.of() : roles);
                })
                .onErrorReturn(new IntrospectResponse(false, null, List.of()));
    }

    public Mono<AuthResponse> handleGithubLogin(OAuth2User oauthUser) {
        return Mono.fromCallable(() -> {
            String providerUserId = resolveGithubId(oauthUser);
            if (providerUserId == null) {
                throw new IllegalStateException("GitHub user id not found");
            }

            UUID linkedUserId = authRepository.findUserIdByIdentity("github", providerUserId);
            if (linkedUserId != null) {
                AuthUser linked = authRepository.findAuthUserById(linkedUserId);
                ensureSecret(linked);
                return jwtService.buildAuthResponse(linked);
            }

            String email = resolveGithubEmail(oauthUser);
            AuthUser existing = authRepository.findAuthUserByEmail(email);
            UUID userId;

            if (existing.getId() != null) {
                userId = existing.getId();
            } else {
                User user = new User();
                user.setName(resolveGithubName(oauthUser));
                user.setEmail(email);
                user.setPassword(passwordEncoder.encode(SecretGenerator.newSecret()));
                user.setRoles(defaultRoles());
                userId = umsRepository.createUser(user);
                if (userId == null) {
                    throw new IllegalStateException("GitHub user registration failed");
                }
            }

            authRepository.createUserIdentity(userId, "github", providerUserId, email);
            AuthUser created = authRepository.findAuthUserById(userId);
            ensureSecret(created);
            return jwtService.buildAuthResponse(created);
        }).subscribeOn(Schedulers.boundedElastic());
    }

    public Mono<UUID> createUser(User user) {
        return Mono.fromCallable(() -> {
            if (user == null || isBlank(user.getName()) || isBlank(user.getEmail()) || isBlank(user.getPassword())) {
                throw new IllegalArgumentException("Name, email, and password are required");
            }
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            if (user.getRoles() == null || user.getRoles().isEmpty()) {
                user.setRoles(defaultRoles());
            }
            return umsRepository.createUser(user);
        }).subscribeOn(Schedulers.boundedElastic());
    }

    private User toUser(AuthRegisterRequest request) {
        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRoles(mapRoles(request.roles()));
        return user;
    }

    private List<Roles> mapRoles(List<String> roles) {
        if (roles == null || roles.isEmpty()) {
            return defaultRoles();
        }
        List<Roles> mapped = new ArrayList<>();
        for (String role : roles) {
            if (isBlank(role)) {
                continue;
            }
            mapped.add(new Roles(null, role.trim().toUpperCase(Locale.ROOT), null));
        }
        return mapped.isEmpty() ? defaultRoles() : mapped;
    }

    private List<Roles> defaultRoles() {
        List<Roles> roles = new ArrayList<>();
        roles.add(new Roles(null, "SUBSCRIBER", null));
        return roles;
    }

    private void validateRegisterRequest(AuthRegisterRequest request) {
        if (request == null
                || isBlank(request.name())
                || isBlank(request.email())
                || isBlank(request.password())) {
            throw new IllegalArgumentException("Name, email, and password are required");
        }
    }

    private String resolveGithubId(OAuth2User oauthUser) {
        Object id = oauthUser.getAttributes().get("id");
        if (id == null) {
            return null;
        }
        return String.valueOf(id);
    }

    private String resolveGithubEmail(OAuth2User oauthUser) {
        Object emailAttr = oauthUser.getAttributes().get("email");
        if (emailAttr != null && !String.valueOf(emailAttr).isBlank()) {
            return String.valueOf(emailAttr).toLowerCase(Locale.ROOT);
        }

        Object loginAttr = oauthUser.getAttributes().get("login");
        if (loginAttr != null && !String.valueOf(loginAttr).isBlank()) {
            return String.format("%s@users.noreply.github.com", String.valueOf(loginAttr)).toLowerCase(Locale.ROOT);
        }

        return UUID.randomUUID().toString() + "@users.noreply.github.com";
    }

    private String resolveGithubName(OAuth2User oauthUser) {
        Object nameAttr = oauthUser.getAttributes().get("name");
        if (nameAttr != null && !String.valueOf(nameAttr).isBlank()) {
            return String.valueOf(nameAttr);
        }
        Object loginAttr = oauthUser.getAttributes().get("login");
        if (loginAttr != null && !String.valueOf(loginAttr).isBlank()) {
            return String.valueOf(loginAttr);
        }
        return "GitHub User";
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private void ensureSecret(AuthUser user) {
        if (user == null || user.getId() == null) {
            return;
        }
        if (user.getSecretKey() != null && !user.getSecretKey().isBlank()) {
            return;
        }
        String newSecret = SecretGenerator.newSecret();
        authRepository.updateUserSecret(user.getId(), newSecret);
        user.setSecretKey(newSecret);
    }
}
