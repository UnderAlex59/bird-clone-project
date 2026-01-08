package com.ziminpro.ums.auth;

import java.util.List;

public record AuthRegisterRequest(String name, String email, String password, List<String> roles) {}
