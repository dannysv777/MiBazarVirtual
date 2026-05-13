// src/main/java/com/mibazarvirtual/backend/exception/OrderNotFoundException.java
package com.mibazarvirtual.backend.exception;

public class OrderNotFoundException extends RuntimeException {

    public OrderNotFoundException(Long orderId) {
        super("Order not found: " + orderId);
    }
}
