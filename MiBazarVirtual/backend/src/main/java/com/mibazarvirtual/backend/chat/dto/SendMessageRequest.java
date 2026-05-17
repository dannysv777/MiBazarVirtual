// src/main/java/com/mibazarvirtual/backend/chat/dto/SendMessageRequest.java
package com.mibazarvirtual.backend.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

// Payload que llega desde STOMP cuando el usuario presiona enviar en el chat.
public record SendMessageRequest(
        @NotNull Long conversationId,
        @NotBlank String content
) {
}
