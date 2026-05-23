package com.example.backend.controller;

import com.example.backend.dto.response.AuditLogResponse;
import com.example.backend.entity.AuditLog;
import com.example.backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {
    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAuditLogs() {
        List<AuditLogResponse> logs = auditLogRepository
                .findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(this::mapToResponse)
                .toList();

        return ResponseEntity.ok(logs);
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        AuditLogResponse response = new AuditLogResponse();
        response.setId(log.getId());
        response.setActorUsername(log.getActorUsername());
        response.setAction(log.getAction());
        response.setTargetType(log.getTargetType());
        response.setTargetId(log.getTargetId());
        response.setDetails(log.getDetails());
        response.setCreatedAt(log.getCreatedAt());
        return response;
    }
}
