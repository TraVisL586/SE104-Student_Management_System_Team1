package com.example.backend.controller;

import com.example.backend.constant.GradeUnlockRequestStatus;
import com.example.backend.dto.request.GradeRequest;
import com.example.backend.dto.request.GradeUnlockDecisionRequest;
import com.example.backend.dto.request.GradeUnlockReasonRequest;
import com.example.backend.dto.response.GradeResponse;
import com.example.backend.dto.response.GradeUnlockRequestResponse;
import com.example.backend.service.GradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class GradeController {
    private final GradeService gradeService;

    @GetMapping("/api/lecturer/course-sections/{sectionId:\\d+}/grades")
    public ResponseEntity<List<GradeResponse>> getSectionGrades(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer sectionId) {
        return ResponseEntity.ok(gradeService.getSectionGradesForLecturer(userDetails.getUsername(), sectionId));
    }

    @PutMapping("/api/lecturer/enrollments/{enrollmentId:\\d+}/grade")
    public ResponseEntity<GradeResponse> updateGrade(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer enrollmentId,
            @Valid @RequestBody GradeRequest request) {
        return ResponseEntity.ok(gradeService.updateGradeForLecturer(userDetails.getUsername(), enrollmentId, request));
    }

    @PatchMapping("/api/lecturer/enrollments/{enrollmentId:\\d+}/grade/publish")
    public ResponseEntity<GradeResponse> publishGrade(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer enrollmentId) {
        return ResponseEntity.ok(gradeService.publishGradeForLecturer(userDetails.getUsername(), enrollmentId));
    }

    @PostMapping("/api/lecturer/enrollments/{enrollmentId:\\d+}/grade/unlock-requests")
    public ResponseEntity<GradeUnlockRequestResponse> requestUnlock(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer enrollmentId,
            @Valid @RequestBody GradeUnlockReasonRequest request) {
        return ResponseEntity.ok(gradeService.requestUnlock(userDetails.getUsername(), enrollmentId, request));
    }

    @GetMapping("/api/student/grades")
    public ResponseEntity<List<GradeResponse>> getMyGrades(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(gradeService.getMyPublishedGrades(userDetails.getUsername()));
    }

    @GetMapping("/api/student/grades/{enrollmentId:\\d+}")
    public ResponseEntity<GradeResponse> getMyGrade(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer enrollmentId) {
        return ResponseEntity.ok(gradeService.getMyPublishedGrade(userDetails.getUsername(), enrollmentId));
    }

    @GetMapping("/api/admin/grade-unlock-requests")
    public ResponseEntity<List<GradeUnlockRequestResponse>> getUnlockRequests(
            @RequestParam(required = false) GradeUnlockRequestStatus status) {
        return ResponseEntity.ok(gradeService.getUnlockRequests(status));
    }

    @PatchMapping("/api/admin/grade-unlock-requests/{requestId:\\d+}/decision")
    public ResponseEntity<GradeUnlockRequestResponse> decideUnlockRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer requestId,
            @Valid @RequestBody GradeUnlockDecisionRequest request) {
        return ResponseEntity.ok(gradeService.decideUnlockRequest(userDetails.getUsername(), requestId, request));
    }

}
