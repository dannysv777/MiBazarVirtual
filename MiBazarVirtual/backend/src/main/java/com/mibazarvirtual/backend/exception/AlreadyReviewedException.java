// src/main/java/com/mibazarvirtual/backend/exception/AlreadyReviewedException.java
package com.mibazarvirtual.backend.exception;

public class AlreadyReviewedException extends RuntimeException {

    public AlreadyReviewedException() {
        super("Este pedido ya fue calificado");
    }
}
