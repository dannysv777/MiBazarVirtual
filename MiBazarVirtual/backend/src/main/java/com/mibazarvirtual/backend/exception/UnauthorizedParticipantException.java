// src/main/java/com/mibazarvirtual/backend/exception/UnauthorizedParticipantException.java
package com.mibazarvirtual.backend.exception;

public class UnauthorizedParticipantException extends RuntimeException {
    public UnauthorizedParticipantException(Long conversationId, Long userId) {
        super("User " + userId + " is not a participant of conversation " + conversationId);
    }

    public UnauthorizedParticipantException(String message) {
        super(message);
    }
}
