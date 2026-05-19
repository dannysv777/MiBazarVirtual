package com.mibazarvirtual.backend.wallet;

import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.wallet.dto.AddCardRequest;
import com.mibazarvirtual.backend.wallet.dto.BankAccountDTO;
import com.mibazarvirtual.backend.wallet.dto.BankAccountRequest;
import com.mibazarvirtual.backend.wallet.dto.SavedCardDTO;
import com.mibazarvirtual.backend.security.AuthenticatedUserResolver;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final AuthenticatedUserResolver authenticatedUserResolver;

    @GetMapping("/cards")
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<ApiResponse<List<SavedCardDTO>>> cards(Authentication authentication) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(walletService.getCards(userId), "Saved cards"));
    }

    @PostMapping("/cards")
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<ApiResponse<SavedCardDTO>> addCard(
            @Valid @RequestBody AddCardRequest request,
            Authentication authentication
    ) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(walletService.addCard(userId, request), "Card saved"));
    }

    @DeleteMapping("/cards/{id}")
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<ApiResponse<Void>> removeCard(@PathVariable Long id, Authentication authentication) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        walletService.removeCard(userId, id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Card removed"));
    }

    @PatchMapping("/cards/{id}/default")
    @PreAuthorize("hasRole('BUYER')")
    public ResponseEntity<ApiResponse<SavedCardDTO>> setDefaultCard(@PathVariable Long id, Authentication authentication) {
        Long userId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(walletService.setDefaultCard(userId, id), "Default card updated"));
    }

    @GetMapping("/bank-account")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<BankAccountDTO>> bankAccount(Authentication authentication) {
        Long sellerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(walletService.getBankAccount(sellerId), "Bank account"));
    }

    @PostMapping("/bank-account")
    @PreAuthorize("hasRole('SELLER')")
    public ResponseEntity<ApiResponse<BankAccountDTO>> saveBankAccount(
            @Valid @RequestBody BankAccountRequest request,
            Authentication authentication
    ) {
        Long sellerId = authenticatedUserResolver.currentUserId(authentication);
        return ResponseEntity.ok(ApiResponse.ok(walletService.saveBankAccount(sellerId, request), "Bank account saved"));
    }
}
