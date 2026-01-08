package com.ziminpro.ums.dtos;

public class Constants {
    private Constants() {
        throw new IllegalStateException("Constants only class");
    }

    // HTTP Section
    public static final String CODE = "code";
    public static final String MESSAGE = "message";
    public static final String DATA = "data";

    // HEADERS Section
    public static final String APPLICATION_JSON = "application/json";
    public static final String CONTENT_TYPE = "Content-Type";
    public static final String ACCEPT = "Accept";

    // Database Section
    public static final String DB = "`ums`";
    public static final String TABLE_USERS = "`users`";
    public static final String TABLE_ROLES = "`roles`";
    public static final String TABLE_LAST_VISIT = "`last_visit`";
    public static final String TABLE_USERS_ROLES = "`users_has_roles`";
    public static final String GET_ALL_USERS = "SELECT * FROM " + TABLE_USERS + " LEFT JOIN " + TABLE_USERS_ROLES
            + " ON " + TABLE_USERS_ROLES + ".`users_id` = " + TABLE_USERS + ".`id` LEFT JOIN " + TABLE_ROLES + " ON "
            + TABLE_USERS_ROLES + ".`roles_id` = " + TABLE_ROLES + ".`id` LEFT JOIN " + TABLE_LAST_VISIT + " ON "
            + TABLE_USERS + ".`last_visit_id` = " + TABLE_LAST_VISIT + ".`id`;";
    public static final String GET_USER_BY_ID_FULL = "SELECT * FROM " + TABLE_USERS + " LEFT JOIN " + TABLE_USERS_ROLES
            + " ON " + TABLE_USERS_ROLES + ".`users_id` = " + TABLE_USERS + ".`id` LEFT JOIN " + TABLE_ROLES + " ON "
            + TABLE_USERS_ROLES + ".`roles_id` = " + TABLE_ROLES + ".`id` LEFT JOIN " + TABLE_LAST_VISIT + " ON "
            + TABLE_USERS + ".`last_visit_id` = " + TABLE_LAST_VISIT + ".`id` WHERE " + TABLE_USERS
            + ".`id`=UUID_TO_BIN(?);";
    public static final String GET_USER_BY_EMAIL_FULL = "SELECT * FROM " + TABLE_USERS + " LEFT JOIN "
            + TABLE_USERS_ROLES + " ON " + TABLE_USERS_ROLES + ".`users_id` = " + TABLE_USERS + ".`id` LEFT JOIN "
            + TABLE_ROLES + " ON " + TABLE_USERS_ROLES + ".`roles_id` = " + TABLE_ROLES + ".`id` LEFT JOIN "
            + TABLE_LAST_VISIT + " ON " + TABLE_USERS + ".`last_visit_id` = " + TABLE_LAST_VISIT + ".`id` WHERE "
            + TABLE_USERS + ".`email`=?;";
    public static final String CREATE_USER = "INSERT INTO " + TABLE_USERS
            + " (`id`, `name`, `email`, `password`, `created`, `last_visit_id`, `secret_key`) VALUES "
            + "(UUID_TO_BIN(?), ?, ?, ?, ?, UUID_TO_BIN(?), ?);";
    public static final String ASSIGN_ROLE = "INSERT INTO " + TABLE_USERS_ROLES
            + " (`users_id`, `roles_id`) VALUES (UUID_TO_BIN(?), UUID_TO_BIN(?));";
    public static final String DELETE_USER_ROLES = "DELETE FROM " + TABLE_USERS_ROLES
            + " WHERE `users_id` = UUID_TO_BIN(?);";
    public static final String CREATE_LOGIN = "INSERT INTO " + TABLE_LAST_VISIT + " VALUES " + "(UUID_TO_BIN(?),?,?);";
    public static final String GET_ALL_ROLES = "SELECT * FROM " + TABLE_ROLES;
    public static final String DELETE_USER = "DELETE FROM " + TABLE_USERS + " WHERE `id` = (UUID_TO_BIN(?));";
    public static final String DELETE_LAST_VISIT = "DELETE FROM " + TABLE_LAST_VISIT + " WHERE `id` = (UUID_TO_BIN(?));";
    public static final String UPDATE_USER_SECRET = "UPDATE " + TABLE_USERS + " SET `secret_key`=? WHERE `id`=UUID_TO_BIN(?);";
    public static final String UPDATE_USER_PASSWORD = "UPDATE " + TABLE_USERS + " SET `password`=? WHERE `id`=UUID_TO_BIN(?);";
    public static final String GET_USER_IDENTITY = "SELECT `user_id` FROM `user_identities` WHERE `provider`=? AND `provider_user_id`=?;";
    public static final String CREATE_USER_IDENTITY = "INSERT INTO `user_identities` "
            + "(`id`, `user_id`, `provider`, `provider_user_id`, `email`, `created`) VALUES "
            + "(UUID_TO_BIN(?), UUID_TO_BIN(?), ?, ?, ?, ?);";
}
