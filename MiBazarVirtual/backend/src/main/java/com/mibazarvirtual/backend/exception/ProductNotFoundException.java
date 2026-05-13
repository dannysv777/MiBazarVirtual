// src/main/java/com/mibazarvirtual/backend/exception/ProductNotFoundException.java
package com.mibazarvirtual.backend.exception;

public class ProductNotFoundException extends RuntimeException {
    public ProductNotFoundException(Long id) {
        super("Product not found: " + id);
    }
}
