// src/main/java/com/mibazarvirtual/backend/exception/ConversationNotFoundException.java
package com.mibazarvirtual.backend.exception;

public class ConversationNotFoundException extends RuntimeException {
    public ConversationNotFoundException(Long conversationId) {
        super("Conversation not found: " + conversationId);
    }
}
