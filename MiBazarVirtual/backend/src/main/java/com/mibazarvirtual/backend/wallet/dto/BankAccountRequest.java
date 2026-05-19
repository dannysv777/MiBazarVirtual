package com.mibazarvirtual.backend.wallet.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BankAccountRequest(
        @NotBlank @Size(max = 100) String bankName,
        @NotBlank @Size(max = 50) String accountNumber,
        @NotBlank @Size(max = 150) String accountHolder,
        @NotBlank @Pattern(regexp = "MONETARIA|AHORRO", message = "accountType must be MONETARIA or AHORRO") String accountType
) {
}
