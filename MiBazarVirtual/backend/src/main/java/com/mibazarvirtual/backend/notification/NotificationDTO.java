package com.mibazarvirtual.backend.notification;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.Map;

public record NotificationDTO(
        Long id,
        String type,
        String title,
        String body,
        Map<String, Object> data,
        Boolean isRead,
        Instant createdAt,
        String timeAgo
) {
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {
    };

    public static NotificationDTO from(Notification notification, ObjectMapper objectMapper) {
        return new NotificationDTO(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getBody(),
                parseData(notification.getData(), objectMapper),
                notification.getIsRead(),
                notification.getCreatedAt(),
                formatTimeAgo(notification.getCreatedAt())
        );
    }

    private static Map<String, Object> parseData(String data, ObjectMapper objectMapper) {
        if (data == null || data.isBlank()) {
            return Collections.emptyMap();
        }

        try {
            return objectMapper.readValue(data, MAP_TYPE);
        } catch (Exception ignored) {
            return Collections.emptyMap();
        }
    }

    private static String formatTimeAgo(Instant createdAt) {
        if (createdAt == null) {
            return "";
        }

        Duration duration = Duration.between(createdAt, Instant.now());
        long minutes = duration.toMinutes();
        if (minutes < 1) {
            return "ahora";
        }
        if (minutes < 60) {
            return "hace " + minutes + " min";
        }

        long hours = duration.toHours();
        if (hours < 24) {
            return "hace " + hours + " h";
        }
        if (hours < 48) {
            return "ayer";
        }

        long days = duration.toDays();
        return "hace " + days + " dias";
    }
}
