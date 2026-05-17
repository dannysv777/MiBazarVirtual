// src/main/java/com/mibazarvirtual/backend/chat/dto/TypingNotification.java
package com.mibazarvirtual.backend.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// Evento temporal de escritura; se transmite por WebSocket y no se almacena.
public record TypingNotification(
        @NotNull Long conversationId,
        @NotBlank String username
) {
}
