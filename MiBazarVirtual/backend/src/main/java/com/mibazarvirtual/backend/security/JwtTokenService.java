// src/main/java/com/mibazarvirtual/backend/security/JwtTokenService.java
package com.mibazarvirtual.backend.security;

import com.mibazarvirtual.backend.entity.User;
import com.mibazarvirtual.backend.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
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

        Long userId = claims.get("userId", Long.class);
        if (userId == null) {
            userId = claims.get("id", Long.class);
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
}
