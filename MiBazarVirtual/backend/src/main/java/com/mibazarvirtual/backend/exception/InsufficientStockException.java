// src/main/java/com/mibazarvirtual/backend/exception/InsufficientStockException.java
package com.mibazarvirtual.backend.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(String productName, int stock) {
        super("Product '" + productName + "' only has " + stock + " units available");
    }
}
