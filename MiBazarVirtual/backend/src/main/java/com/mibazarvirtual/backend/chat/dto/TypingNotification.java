// src/main/java/com/mibazarvirtual/backend/chat/dto/TypingNotification.java
package com.mibazarvirtual.backend.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TypingNotification(
        @NotNull Long conversationId,
        @NotBlank String username
) {
}
