package com.automax.mall.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

public class JwtUtils {
    private static final String SECRET = "AutoMaxSuperSecretKeyForSpringBoot2026!";
    private static final long EXPIRE = 24 * 60 * 60 * 1000; // 24小时
    private static final Key KEY = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    public static String createToken(Long userId, String username, String role) {
        return Jwts.builder()
                .claim("userId", userId)
                .claim("username", username)
                .claim("role", role) // 🌟 存入角色
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRE))
                .signWith(KEY)
                .compact();
    }

    public static Claims parseToken(String token) {
        return Jwts.parserBuilder().setSigningKey(KEY).build().parseClaimsJws(token).getBody();
    }
}