// src/main/java/com/mibazarvirtual/backend/chat/dto/ConversationDTO.java
package com.mibazarvirtual.backend.chat.dto;

import java.time.LocalDateTime;

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
        LocalDateTime lastMessageTime,
        int unreadCount,
        String otherParticipantUsername,
        String otherParticipantProfileImage
) {
}
