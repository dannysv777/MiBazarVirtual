// src/main/java/com/mibazarvirtual/backend/exception/StoreNotFoundException.java
package com.mibazarvirtual.backend.exception;

public class StoreNotFoundException extends RuntimeException {
    public StoreNotFoundException(Long id) {
        super("Store not found: " + id);
    }
}
