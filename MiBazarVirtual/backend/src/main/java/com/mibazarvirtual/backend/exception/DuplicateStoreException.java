// src/main/java/com/mibazarvirtual/backend/exception/DuplicateStoreException.java
package com.mibazarvirtual.backend.exception;

public class DuplicateStoreException extends RuntimeException {
    public DuplicateStoreException(Long sellerId) {
        super("Seller already has a store: " + sellerId);
    }
}
