package com.ziminpro.ums.auth;

public record AuthResponse(String token, long expiresAt, AuthUserSummary user) {}
