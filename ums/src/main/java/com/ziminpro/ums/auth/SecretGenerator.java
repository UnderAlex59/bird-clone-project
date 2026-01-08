package com.ziminpro.ums.auth;

import java.security.SecureRandom;
import java.util.HexFormat;

public final class SecretGenerator {
    private static final SecureRandom RANDOM = new SecureRandom();

    private SecretGenerator() {}

    public static String newSecret() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return HexFormat.of().formatHex(bytes);
    }
}
