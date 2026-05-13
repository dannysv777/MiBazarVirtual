// src/main/java/com/mibazarvirtual/backend/exception/UnauthorizedOwnerException.java
package com.mibazarvirtual.backend.exception;

public class UnauthorizedOwnerException extends RuntimeException {
    public UnauthorizedOwnerException(String message) {
        super(message);
    }
}
