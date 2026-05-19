package com.mibazarvirtual.backend.wallet;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SellerBankAccountRepository extends JpaRepository<SellerBankAccount, Long> {

    Optional<SellerBankAccount> findBySellerId(Long sellerId);
}
