package com.mibazarvirtual.backend.wallet.dto;

import com.mibazarvirtual.backend.wallet.SellerBankAccount;

public record BankAccountDTO(
        Long id,
        String bankName,
        String accountNumber,
        String maskedAccountNumber,
        String accountHolder,
        String accountType
) {
    public static BankAccountDTO from(SellerBankAccount account) {
        String number = account.getAccountNumber();
        String lastFour = number.length() <= 4 ? number : number.substring(number.length() - 4);
        return new BankAccountDTO(
                account.getId(),
                account.getBankName(),
                account.getAccountNumber(),
                "****" + lastFour,
                account.getAccountHolder(),
                account.getAccountType()
        );
    }
}
