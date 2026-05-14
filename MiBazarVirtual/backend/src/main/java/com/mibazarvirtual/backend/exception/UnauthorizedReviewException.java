// src/main/java/com/mibazarvirtual/backend/exception/UnauthorizedReviewException.java
package com.mibazarvirtual.backend.exception;

public class UnauthorizedReviewException extends RuntimeException {

    public UnauthorizedReviewException() {
        super("No puedes calificar un pedido que no es tuyo");
    }
}
