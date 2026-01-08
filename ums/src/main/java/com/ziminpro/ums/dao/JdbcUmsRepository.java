package com.ziminpro.ums.dao;

import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.UUID;

import com.ziminpro.ums.auth.AuthUser;
import com.ziminpro.ums.auth.SecretGenerator;
import com.ziminpro.ums.dtos.Constants;
import com.ziminpro.ums.dtos.LastSession;
import com.ziminpro.ums.dtos.Roles;
import com.ziminpro.ums.dtos.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcUmsRepository implements UmsRepository, AuthRepository {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public Map<UUID, User> findAllUsers() {
        Map<UUID, User> users = new HashMap<>();

        List<Object> oUsers = jdbcTemplate.query(Constants.GET_ALL_USERS,
                (rs, rowNum) -> new User(DaoHelper.bytesArrayToUuid(rs.getBytes("users.id")), rs.getString("users.name"),
                        rs.getString("users.email"), rs.getString("users.password"), rs.getInt("users.created"),
                        Arrays.asList(new Roles(DaoHelper.bytesArrayToUuid(rs.getBytes("roles.id")),
                                rs.getString("roles.name"), rs.getString("roles.description"))),
                        new LastSession(rs.getInt("last_visit.in"), rs.getInt("last_visit.out"))));

        for (Object oUser : oUsers) {
            if (!users.containsKey(((User) oUser).getId())) {
                User user = new User();
                user.setId(((User) oUser).getId());
                user.setName(((User) oUser).getName());
                user.setEmail(((User) oUser).getEmail());
                user.setPassword(((User) oUser).getPassword());
                user.setCreated(((User) oUser).getCreated());
                user.setLastSession(((User) oUser).getLastSession());
                users.put(((User) oUser).getId(), user);
            }
            users.get(((User) oUser).getId()).addRole(((User) oUser).getRoles().get(0));
        }
        return users;
    }

    @Override
    public User findUserByID(UUID userId) {
        User user = new User();
        List<Object> users = jdbcTemplate.query(Constants.GET_USER_BY_ID_FULL,
                (rs, rowNum) -> new User(DaoHelper.bytesArrayToUuid(rs.getBytes("users.id")), rs.getString("users.name"),
                        rs.getString("users.email"), rs.getString("users.password"), rs.getInt("users.created"),
                        Arrays.asList(new Roles(DaoHelper.bytesArrayToUuid(rs.getBytes("roles.id")),
                                rs.getString("roles.name"), rs.getString("roles.description"))),
                        new LastSession(rs.getInt("last_visit.in"), rs.getInt("last_visit.out"))),
                userId.toString());
        for (Object oUser : users) {
            if (user.getId() == null) {
                user.setId(((User) oUser).getId());
                user.setName(((User) oUser).getName());
                user.setEmail(((User) oUser).getEmail());
                user.setPassword(((User) oUser).getPassword());
                user.setCreated(((User) oUser).getCreated());
                user.setLastSession(((User) oUser).getLastSession());
            }
            user.addRole(((User) oUser).getRoles().get(0));
        }
        return user;
    }

    @Override
    public UUID createUser(User user) {
        long timestamp = Instant.now().getEpochSecond();
        Map<String, Roles> roles = this.findAllRoles();
        UUID userId = UUID.randomUUID();
        String secretKey = SecretGenerator.newSecret();

        try {
            jdbcTemplate.update(Constants.CREATE_USER, userId.toString(), user.getName(), user.getEmail(),
                    user.getPassword(), timestamp, null, secretKey);
            for (Roles role : user.getRoles()) {
                jdbcTemplate.update(Constants.ASSIGN_ROLE, userId.toString(),
                        roles.get(role.getRole()).getRoleId().toString());
            }
        } catch (Exception e) {
            return null;
        }

        return userId;
    }

    @Override
    public int updateUserRoles(UUID userId, List<String> rolesList) {
        if (userId == null) {
            throw new IllegalArgumentException("User id is required");
        }
        if (rolesList == null || rolesList.isEmpty()) {
            throw new IllegalArgumentException("Roles are required");
        }

        Map<String, Roles> roles = this.findAllRoles();
        List<String> normalized = new java.util.ArrayList<>();
        for (String role : rolesList) {
            if (role == null || role.isBlank()) {
                continue;
            }
            String name = role.trim().toUpperCase(Locale.ROOT);
            if (!normalized.contains(name)) {
                normalized.add(name);
            }
        }
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Roles are required");
        }

        for (String role : normalized) {
            if (!roles.containsKey(role)) {
                throw new IllegalArgumentException("Unknown role: " + role);
            }
        }

        jdbcTemplate.update(Constants.DELETE_USER_ROLES, userId.toString());
        for (String role : normalized) {
            jdbcTemplate.update(Constants.ASSIGN_ROLE, userId.toString(),
                    roles.get(role).getRoleId().toString());
        }
        return normalized.size();
    }

    @Override
    public int deleteUser(UUID userId) {
        return jdbcTemplate.update(Constants.DELETE_USER, userId.toString());
    }

    @Override
    public Map<String, Roles> findAllRoles() {
        Map<String, Roles> roles = new HashMap<>();
        jdbcTemplate.query(Constants.GET_ALL_ROLES, rs -> {
            Roles role = new Roles(DaoHelper.bytesArrayToUuid(rs.getBytes("roles.id")), rs.getString("roles.name"),
                    rs.getString("roles.description"));
            roles.put(rs.getString("roles.name"), role);
        });
        return roles;
    }

    @Override
    public AuthUser findAuthUserByEmail(String email) {
        AuthUser user = new AuthUser();
        List<Object> users = jdbcTemplate.query(Constants.GET_USER_BY_EMAIL_FULL,
                (rs, rowNum) -> {
                    AuthUser authUser = new AuthUser();
                    authUser.setId(DaoHelper.bytesArrayToUuid(rs.getBytes("users.id")));
                    authUser.setName(rs.getString("users.name"));
                    authUser.setEmail(rs.getString("users.email"));
                    authUser.setPasswordHash(rs.getString("users.password"));
                    authUser.setSecretKey(rs.getString("users.secret_key"));
                    authUser.addRole(rs.getString("roles.name"));
                    return authUser;
                },
                email);
        for (Object oUser : users) {
            AuthUser authUser = (AuthUser) oUser;
            if (user.getId() == null) {
                user.setId(authUser.getId());
                user.setName(authUser.getName());
                user.setEmail(authUser.getEmail());
                user.setPasswordHash(authUser.getPasswordHash());
                user.setSecretKey(authUser.getSecretKey());
            }
            user.addRole(authUser.getRoles().get(0));
        }
        return user;
    }

    @Override
    public AuthUser findAuthUserById(UUID userId) {
        AuthUser user = new AuthUser();
        List<Object> users = jdbcTemplate.query(Constants.GET_USER_BY_ID_FULL,
                (rs, rowNum) -> {
                    AuthUser authUser = new AuthUser();
                    authUser.setId(DaoHelper.bytesArrayToUuid(rs.getBytes("users.id")));
                    authUser.setName(rs.getString("users.name"));
                    authUser.setEmail(rs.getString("users.email"));
                    authUser.setPasswordHash(rs.getString("users.password"));
                    authUser.setSecretKey(rs.getString("users.secret_key"));
                    authUser.addRole(rs.getString("roles.name"));
                    return authUser;
                },
                userId.toString());
        for (Object oUser : users) {
            AuthUser authUser = (AuthUser) oUser;
            if (user.getId() == null) {
                user.setId(authUser.getId());
                user.setName(authUser.getName());
                user.setEmail(authUser.getEmail());
                user.setPasswordHash(authUser.getPasswordHash());
                user.setSecretKey(authUser.getSecretKey());
            }
            user.addRole(authUser.getRoles().get(0));
        }
        return user;
    }

    @Override
    public UUID findUserIdByIdentity(String provider, String providerUserId) {
        List<UUID> ids = jdbcTemplate.query(Constants.GET_USER_IDENTITY,
                (rs, rowNum) -> DaoHelper.bytesArrayToUuid(rs.getBytes("user_id")),
                provider,
                providerUserId);
        if (ids.isEmpty()) {
            return null;
        }
        return ids.get(0);
    }

    @Override
    public int createUserIdentity(UUID userId, String provider, String providerUserId, String email) {
        UUID identityId = UUID.randomUUID();
        long timestamp = Instant.now().getEpochSecond();
        return jdbcTemplate.update(Constants.CREATE_USER_IDENTITY, identityId.toString(), userId.toString(), provider,
                providerUserId, email, timestamp);
    }

    @Override
    public int updateUserSecret(UUID userId, String newSecret) {
        return jdbcTemplate.update(Constants.UPDATE_USER_SECRET, newSecret, userId.toString());
    }

    @Override
    public int updateUserPassword(UUID userId, String passwordHash) {
        return jdbcTemplate.update(Constants.UPDATE_USER_PASSWORD, passwordHash, userId.toString());
    }
}
