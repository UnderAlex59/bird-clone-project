package com.ziminpro.ums.auth;

import java.util.List;

public record AuthUserSummary(String id, String name, String email, List<String> roles) {}
