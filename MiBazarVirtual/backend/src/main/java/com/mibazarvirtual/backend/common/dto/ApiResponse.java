// src/main/java/com/mibazarvirtual/backend/common/dto/ApiResponse.java
package com.mibazarvirtual.backend.common.dto;

public record ApiResponse<T>(
        boolean success,
        T data,
        String message
) {
    public static <T> ApiResponse<T> ok(T data, String message) {
        return new ApiResponse<>(true, data, message);
    }
}
