// src/main/java/com/mibazarvirtual/backend/chat/dto/MessageDTO.java
package com.mibazarvirtual.backend.chat.dto;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

// Forma segura y simple de exponer un mensaje al frontend, sin devolver la entidad completa.
public record MessageDTO(
        Long id,
        Long conversationId,
        Long senderId,
        String senderUsername,
        String content,
        OffsetDateTime createdAt,
        boolean isRead
) {
    public MessageDTO(
            Long id,
            Long conversationId,
            Long senderId,
            String senderUsername,
            String content,
            LocalDateTime createdAt,
            boolean isRead
    ) {
        this(
                id,
                conversationId,
                senderId,
                senderUsername,
                content,
                createdAt == null ? null : createdAt.atOffset(ZoneOffset.UTC),
                isRead
        );
    }
}
