// src/main/java/com/mibazarvirtual/backend/chat/dto/MessageDTO.java
package com.mibazarvirtual.backend.chat.dto;

import java.time.LocalDateTime;

public record MessageDTO(
        Long conversationId,
        Long senderId,
        String senderUsername,
        String content,
        LocalDateTime createdAt,
        boolean isRead
) {
}
