// src/main/java/com/mibazarvirtual/backend/exception/OrderNotDeliveredException.java
package com.mibazarvirtual.backend.exception;

public class OrderNotDeliveredException extends RuntimeException {

    public OrderNotDeliveredException() {
        super("El pedido debe estar entregado para calificarlo");
    }
}
