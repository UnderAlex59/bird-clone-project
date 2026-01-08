package com.ziminpro.ums.dao;

import java.util.UUID;

import com.ziminpro.ums.auth.AuthUser;

public interface AuthRepository {

    AuthUser findAuthUserByEmail(String email);

    AuthUser findAuthUserById(UUID userId);

    UUID findUserIdByIdentity(String provider, String providerUserId);

    int createUserIdentity(UUID userId, String provider, String providerUserId, String email);

    int updateUserSecret(UUID userId, String newSecret);

    int updateUserPassword(UUID userId, String passwordHash);
}
