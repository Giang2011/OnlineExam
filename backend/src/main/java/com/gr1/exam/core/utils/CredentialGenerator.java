package com.gr1.exam.core.utils;

import java.security.SecureRandom;

/**
 * Sinh random username & password cho Student.
 */
public class CredentialGenerator {

    private static final String ALPHA_NUM = "abcdefghijklmnopqrstuvwxyz0123456789";
    private static final String PASSWORD_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Random username dạng: "stu_xxxxxxxx" (8 ký tự alpha-numeric)
     */
    public static String randomUsername() {
        StringBuilder sb = new StringBuilder("stu_");
        for (int i = 0; i < 8; i++) {
            sb.append(ALPHA_NUM.charAt(RANDOM.nextInt(ALPHA_NUM.length())));
        }
        return sb.toString();
    }

    /**
     * Random password 10 ký tự (chữ hoa, chữ thường, số)
     */
    public static String randomPassword() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 10; i++) {
            sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return sb.toString();
    }
}
