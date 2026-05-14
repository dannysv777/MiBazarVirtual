// src/main/java/com/mibazarvirtual/backend/app/dto/AppInfoResponse.java
package com.mibazarvirtual.backend.app.dto;

public record AppInfoResponse(
        String appName,
        String version,
        long totalProducts,
        long totalStores,
        long totalCategories
) {
}
