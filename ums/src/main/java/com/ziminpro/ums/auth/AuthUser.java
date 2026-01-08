package com.ziminpro.ums.auth;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import lombok.Data;

@Data
public class AuthUser {
    private UUID id;
    private String name;
    private String email;
    private String passwordHash;
    private String secretKey;
    private List<String> roles = new ArrayList<>();

    public void addRole(String role) {
        this.roles.add(role);
    }
}
