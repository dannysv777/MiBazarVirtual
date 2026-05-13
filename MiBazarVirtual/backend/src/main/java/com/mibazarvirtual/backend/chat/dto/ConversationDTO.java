// src/main/java/com/mibazarvirtual/backend/chat/dto/ConversationDTO.java
package com.mibazarvirtual.backend.chat.dto;

import java.time.LocalDateTime;

public record ConversationDTO(
        Long id,
        Long buyerId,
        Long sellerId,
        Long productId,
        String productName,
        String lastMessage,
        LocalDateTime lastMessageTime,
        int unreadCount,
        String otherParticipantUsername
) {
}
