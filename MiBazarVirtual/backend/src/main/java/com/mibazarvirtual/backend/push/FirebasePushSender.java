package com.mibazarvirtual.backend.push;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.AndroidNotification;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class FirebasePushSender {

    @Value("${firebase.push.service-account-json:${FIREBASE_SERVICE_ACCOUNT_JSON:}}")
    private String serviceAccountJson;

    @Value("${firebase.push.service-account-base64:${FIREBASE_SERVICE_ACCOUNT_BASE64:}}")
    private String serviceAccountBase64;

    private volatile FirebaseMessaging messaging;
    private volatile boolean configurationChecked;

    public boolean isConfigured() {
        return getMessaging() != null;
    }

    public boolean send(PushToken token, String title, String body, Map<String, Object> data) {
        FirebaseMessaging firebaseMessaging = getMessaging();
        if (firebaseMessaging == null) {
            return false;
        }

        try {
            Message message = Message.builder()
                    .setToken(token.getToken())
                    .setNotification(com.google.firebase.messaging.Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .setAndroidConfig(AndroidConfig.builder()
                            .setPriority(AndroidConfig.Priority.HIGH)
                            .setNotification(AndroidNotification.builder()
                                    .setChannelId("default")
                                    .setSound("default")
                                    .build())
                            .build())
                    .putAllData(stringify(data))
                    .build();
            String messageId = firebaseMessaging.send(message);
            log.info("Firebase push sent to token {} as {}", token.getId(), messageId);
            return true;
        } catch (FirebaseMessagingException exception) {
            log.warn("Firebase push failed for token {}: {}", token.getId(), exception.getMessage());
            return false;
        }
    }

    private FirebaseMessaging getMessaging() {
        if (configurationChecked) {
            return messaging;
        }

        synchronized (this) {
            if (configurationChecked) {
                return messaging;
            }

            try {
                String credentialsJson = readCredentials();
                if (credentialsJson == null) {
                    log.info("Firebase push disabled: FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_BASE64 is missing");
                    return null;
                }

                GoogleCredentials credentials = GoogleCredentials.fromStream(
                        new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8))
                );
                FirebaseApp app = FirebaseApp.getApps().stream()
                        .filter(existing -> "mibazar-push".equals(existing.getName()))
                        .findFirst()
                        .orElseGet(() -> initialize(credentials));
                messaging = FirebaseMessaging.getInstance(app);
                log.info("Firebase Admin push sender initialized");
                return messaging;
            } catch (IOException | IllegalArgumentException exception) {
                log.warn("Firebase push credentials could not be initialized: {}", exception.getMessage());
                return null;
            } finally {
                configurationChecked = true;
            }
        }
    }

    private FirebaseApp initialize(GoogleCredentials credentials) {
        FirebaseOptions options = FirebaseOptions.builder()
                .setCredentials(credentials)
                .build();
        return FirebaseApp.initializeApp(options, "mibazar-push");
    }

    private String readCredentials() {
        if (serviceAccountJson != null && !serviceAccountJson.isBlank()) {
            return serviceAccountJson.trim();
        }

        if (serviceAccountBase64 == null || serviceAccountBase64.isBlank()) {
            return null;
        }

        return new String(Base64.getDecoder().decode(serviceAccountBase64.trim()), StandardCharsets.UTF_8);
    }

    private Map<String, String> stringify(Map<String, Object> data) {
        if (data == null || data.isEmpty()) {
            return Map.of();
        }

        return data.entrySet().stream()
                .filter(entry -> entry.getKey() != null && entry.getValue() != null)
                .collect(Collectors.toMap(Map.Entry::getKey, entry -> Objects.toString(entry.getValue())));
    }
}
