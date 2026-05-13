// src/main/java/com/mibazarvirtual/backend/security/JwtTokenService.java
package com.mibazarvirtual.backend.security;

import com.mibazarvirtual.backend.entity.User;
import com.mibazarvirtual.backend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class JwtTokenService {

    private final UserRepository userRepository;

    @Value("${jwt.secret}")
    private String jwtSecret;

    public String generateAccessToken(User user, long expirationMs) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("userId", user.getId())
                .claim("username", user.getUsername())
                .claim("role", user.getRole().name())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(signingKey())
                .compact();
    }

    public UserPrincipal authenticate(String rawToken) {
        String token = normalizeToken(rawToken);
        if (token == null) {
            throw new MessageDeliveryException("Unauthorized");
        }

        Claims claims = Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        Date expiration = claims.getExpiration();
        if (expiration != null && expiration.before(new Date())) {
            throw new MessageDeliveryException("Unauthorized");
        }

        Long userId = claimAsLong(claims, "userId");
        if (userId == null) {
            userId = claimAsLong(claims, "id");
        }

        User user = userId != null
                ? userRepository.findById(userId).orElseThrow(() -> new MessageDeliveryException("Unauthorized"))
                : userRepository.findByEmail(claims.getSubject())
                        .or(() -> userRepository.findByUsername(claims.getSubject()))
                        .orElseThrow(() -> new MessageDeliveryException("Unauthorized"));

        return new UserPrincipal(user.getId(), user.getUsername());
    }

    private String normalizeToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return null;
        }
        String token = rawToken.trim();
        return token.regionMatches(true, 0, "Bearer ", 0, 7) ? token.substring(7).trim() : token;
    }

    private SecretKey signingKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    private Long claimAsLong(Claims claims, String key) {
        Object value = claims.get(key);
        if (value instanceof Long longValue) {
            return longValue;
        }
        if (value instanceof Integer integerValue) {
            return integerValue.longValue();
        }
        if (value instanceof Number numberValue) {
            return numberValue.longValue();
        }
        if (value instanceof String stringValue && !stringValue.isBlank()) {
            return Long.parseLong(stringValue);
        }
        return null;
    }
}
