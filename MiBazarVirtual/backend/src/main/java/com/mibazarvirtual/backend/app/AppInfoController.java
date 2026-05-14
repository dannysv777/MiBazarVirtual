// src/main/java/com/mibazarvirtual/backend/app/AppInfoController.java
package com.mibazarvirtual.backend.app;

import com.mibazarvirtual.backend.app.dto.AppInfoResponse;
import com.mibazarvirtual.backend.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/app")
@RequiredArgsConstructor
public class AppInfoController {

    private final AppInfoService appInfoService;

    @Operation(summary = "Get app info", description = "Returns public app metadata and catalog counters for the frontend.")
    @GetMapping("/info")
    public ResponseEntity<ApiResponse<AppInfoResponse>> info() {
        return ResponseEntity.ok(ApiResponse.ok(appInfoService.getInfo(), "App info"));
    }
}
