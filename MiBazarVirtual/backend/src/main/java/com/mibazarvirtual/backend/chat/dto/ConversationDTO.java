// src/main/java/com/mibazarvirtual/backend/chat/dto/ConversationDTO.java
package com.mibazarvirtual.backend.chat.dto;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;

// Resumen que usa el frontend para pintar cada fila de la bandeja de conversaciones.
public record ConversationDTO(
        Long id,
        Long buyerId,
        Long sellerId,
        Long productId,
        String productName,
        String conversationType,
        Long orderId,
        String lastMessage,
        OffsetDateTime lastMessageTime,
        int unreadCount,
        String otherParticipantUsername,
        String otherParticipantProfileImage
) {
    private static final ZoneId APP_ZONE = ZoneId.of("America/Guatemala");

    public ConversationDTO(
            Long id,
            Long buyerId,
            Long sellerId,
            Long productId,
            String productName,
            String conversationType,
            Long orderId,
            String lastMessage,
            LocalDateTime lastMessageTime,
            int unreadCount,
            String otherParticipantUsername,
            String otherParticipantProfileImage
    ) {
        this(
                id,
                buyerId,
                sellerId,
                productId,
                productName,
                conversationType,
                orderId,
                lastMessage,
                lastMessageTime == null ? null : lastMessageTime.atZone(APP_ZONE).toOffsetDateTime(),
                unreadCount,
                otherParticipantUsername,
                otherParticipantProfileImage
        );
    }
}
