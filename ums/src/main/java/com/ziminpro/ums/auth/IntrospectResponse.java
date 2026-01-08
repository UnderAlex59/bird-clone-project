package com.ziminpro.ums.auth;

import java.util.List;

public record IntrospectResponse(boolean active, String sub, List<String> roles) {}
