package com.mibazarvirtual.backend.wallet.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddCardRequest(
        @NotBlank @Size(max = 50) String alias,
        @NotBlank @Pattern(regexp = "\\d{4}", message = "lastFour must be exactly 4 digits") String lastFour,
        @NotBlank @Size(max = 20) String brand,
        @NotNull @Min(1) @Max(12) Integer expiryMonth,
        @NotNull @Min(2026) Integer expiryYear
) {
}
