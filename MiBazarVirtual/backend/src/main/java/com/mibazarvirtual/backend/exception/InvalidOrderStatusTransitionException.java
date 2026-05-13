// src/main/java/com/mibazarvirtual/backend/exception/InvalidOrderStatusTransitionException.java
package com.mibazarvirtual.backend.exception;

import com.mibazarvirtual.backend.entity.Order;

public class InvalidOrderStatusTransitionException extends RuntimeException {

    public InvalidOrderStatusTransitionException(Order.Status currentStatus, Order.Status nextStatus) {
        super("Cannot transition order from " + currentStatus + " to " + nextStatus);
    }
}
