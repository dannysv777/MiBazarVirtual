package com.mibazarvirtual.backend.push;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mibazarvirtual.backend.entity.User;
import com.mibazarvirtual.backend.push.dto.PushTokenResponse;
import com.mibazarvirtual.backend.push.dto.RegisterPushTokenRequest;
import com.mibazarvirtual.backend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PushNotificationService {

    private static final URI EXPO_PUSH_URI = URI.create("https://exp.host/--/api/v2/push/send");

    private final PushTokenRepository pushTokenRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final FirebasePushSender firebasePushSender;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    @Transactional
    public PushTokenResponse registerToken(Long userId, RegisterPushTokenRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        PushToken token = pushTokenRepository.findByToken(request.token())
                .orElseGet(PushToken::new);

        token.setUser(user);
        token.setToken(request.token().trim());
        token.setTokenType(resolveTokenType(request.tokenType(), request.token()));
        token.setPlatform(normalize(request.platform()));
        token.setDeviceId(normalize(request.deviceId()));
        token.setActive(true);

        return PushTokenResponse.from(pushTokenRepository.save(token));
    }

    @Transactional
    public void deactivateToken(Long userId, String tokenValue) {
        if (tokenValue == null || tokenValue.isBlank()) {
            return;
        }

        pushTokenRepository.findByToken(tokenValue.trim()).ifPresent(token -> {
            if (token.getUser().getId().equals(userId)) {
                token.setActive(false);
            }
        });
    }

    @Transactional(readOnly = true)
    public long countActiveTokens(Long userId) {
        return pushTokenRepository.countByUserIdAndActiveTrue(userId);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDeliveryStatus(Long userId) {
        return Map.of(
                "activePushTokens", countActiveTokens(userId),
                "expoTokens", pushTokenRepository.countByUserIdAndActiveTrueAndTokenType(userId, PushToken.TokenType.EXPO),
                "nativeTokens", pushTokenRepository.countByUserIdAndActiveTrueAndTokenType(userId, PushToken.TokenType.NATIVE),
                "firebaseConfigured", firebasePushSender.isConfigured()
        );
    }

    @Transactional(readOnly = true)
    public void sendToUser(Long userId, String title, String body, Map<String, Object> data) {
        sendToUsers(List.of(userId), title, body, data);
    }

    @Transactional(readOnly = true)
    public void sendToUsers(List<Long> userIds, String title, String body, Map<String, Object> data) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        List<PushToken> tokens = pushTokenRepository.findByUserIdInAndActiveTrue(userIds);
        for (PushToken token : tokens) {
            if (token.getTokenType() == PushToken.TokenType.EXPO) {
                sendExpoPush(token, title, body, data);
            } else if ("android".equalsIgnoreCase(token.getPlatform())) {
                firebasePushSender.send(token, title, body, data);
            } else {
                log.info("Skipping native {} push token {} until APNs direct delivery is configured", token.getPlatform(), token.getId());
            }
        }
    }

    private void sendExpoPush(PushToken token, String title, String body, Map<String, Object> data) {
        try {
            Map<String, Object> payload = Map.of(
                    "to", token.getToken(),
                    "sound", "default",
                    "title", title,
                    "body", body,
                    "data", data == null ? Map.of() : data
            );
            HttpRequest request = HttpRequest.newBuilder(EXPO_PUSH_URI)
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                log.warn("Expo push failed for token {} with status {}: {}", token.getId(), response.statusCode(), response.body());
            }
        } catch (IOException exception) {
            log.warn("Could not serialize/send Expo push for token {}", token.getId(), exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("Expo push interrupted for token {}", token.getId(), exception);
        }
    }

    private PushToken.TokenType resolveTokenType(String requestedType, String token) {
        if (requestedType != null && requestedType.equalsIgnoreCase("NATIVE")) {
            return PushToken.TokenType.NATIVE;
        }
        return token != null && token.startsWith("ExponentPushToken") ? PushToken.TokenType.EXPO : PushToken.TokenType.NATIVE;
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
