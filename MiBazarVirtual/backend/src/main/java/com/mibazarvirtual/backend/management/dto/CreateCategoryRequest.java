// src/main/java/com/mibazarvirtual/backend/management/dto/CreateCategoryRequest.java
package com.mibazarvirtual.backend.management.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank @Size(max = 80) String name,
        String description,
        @Size(max = 500) String icon
) {
}
