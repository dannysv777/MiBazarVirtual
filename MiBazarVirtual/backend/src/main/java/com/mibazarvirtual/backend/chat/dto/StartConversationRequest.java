// src/main/java/com/mibazarvirtual/backend/chat/dto/StartConversationRequest.java
package com.mibazarvirtual.backend.chat.dto;

import jakarta.validation.constraints.NotNull;

// Payload REST para abrir un chat desde la pantalla de detalle del producto.
public record StartConversationRequest(
        @NotNull Long productId,
        @NotNull Long sellerId
) {
}
