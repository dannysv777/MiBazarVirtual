// src/main/java/com/mibazarvirtual/backend/exception/CategoryNotFoundException.java
package com.mibazarvirtual.backend.exception;

public class CategoryNotFoundException extends RuntimeException {
    public CategoryNotFoundException(Long id) {
        super("Category not found: " + id);
    }
}
