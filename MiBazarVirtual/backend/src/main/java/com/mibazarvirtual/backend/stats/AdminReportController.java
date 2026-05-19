package com.mibazarvirtual.backend.stats;

import com.mibazarvirtual.backend.common.dto.ApiResponse;
import com.mibazarvirtual.backend.stats.dto.AdminOverviewResponse;
import com.mibazarvirtual.backend.stats.dto.AdminStoreReportResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportController {

    private final AdminReportService adminReportService;

    @GetMapping("/overview")
    public ResponseEntity<ApiResponse<AdminOverviewResponse>> overview() {
        return ResponseEntity.ok(ApiResponse.ok(adminReportService.getOverview(), "Admin overview"));
    }

    @GetMapping("/stores")
    public ResponseEntity<ApiResponse<List<AdminStoreReportResponse>>> stores() {
        return ResponseEntity.ok(ApiResponse.ok(adminReportService.getStoreReports(), "Store reports"));
    }
}
