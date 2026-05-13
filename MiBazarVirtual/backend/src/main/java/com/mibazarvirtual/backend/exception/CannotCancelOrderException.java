// src/main/java/com/mibazarvirtual/backend/exception/CannotCancelOrderException.java
package com.mibazarvirtual.backend.exception;

public class CannotCancelOrderException extends RuntimeException {

    public CannotCancelOrderException() {
        super("Only PENDING orders can be cancelled");
    }
}
