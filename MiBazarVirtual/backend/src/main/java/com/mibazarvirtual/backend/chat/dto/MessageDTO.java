// src/main/java/com/mibazarvirtual/backend/chat/dto/MessageDTO.java
package com.mibazarvirtual.backend.chat.dto;

import java.time.LocalDateTime;

// Forma segura y simple de exponer un mensaje al frontend, sin devolver la entidad completa.
public record MessageDTO(
        Long id,
        Long conversationId,
        Long senderId,
        String senderUsername,
        String content,
        LocalDateTime createdAt,
        boolean isRead
) {
}
