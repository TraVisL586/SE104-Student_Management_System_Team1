package com.example.backend.controller;

import com.example.backend.constant.AcademicRequestStatus;
import com.example.backend.dto.request.AcademicRequestCreateRequest;
import com.example.backend.dto.request.AcademicRequestDecisionRequest;
import com.example.backend.dto.request.AdvisorAssignmentRequest;
import com.example.backend.dto.response.AcademicRequestResponse;
import com.example.backend.dto.response.AdvisorStudentResponse;
import com.example.backend.dto.response.StudentAdvisingProfileResponse;
import com.example.backend.service.AcademicAdvisingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AcademicAdvisingController {
    private final AcademicAdvisingService academicAdvisingService;

    @PostMapping("/api/admin/advisor-students")
    public ResponseEntity<AdvisorStudentResponse> assignAdvisor(
            @Valid @RequestBody AdvisorAssignmentRequest request) {
        return ResponseEntity.ok(academicAdvisingService.assignAdvisor(request));
    }

    @GetMapping("/api/admin/advisor-students")
    public ResponseEntity<List<AdvisorStudentResponse>> getAdvisorAssignments() {
        return ResponseEntity.ok(academicAdvisingService.getAdvisorAssignments());
    }

    @DeleteMapping("/api/admin/advisors/{advisorId:\\d+}/students/{studentId:\\d+}")
    public ResponseEntity<Void> unassignAdvisor(
            @PathVariable Integer advisorId,
            @PathVariable Integer studentId) {
        academicAdvisingService.unassignAdvisor(advisorId, studentId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/advisor/students")
    public ResponseEntity<List<AdvisorStudentResponse>> getMyStudents(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(academicAdvisingService.getMyStudents(userDetails.getUsername()));
    }

    @GetMapping("/api/advisor/students/{studentId:\\d+}/profile")
    public ResponseEntity<StudentAdvisingProfileResponse> getStudentProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer studentId) {
        return ResponseEntity.ok(
                academicAdvisingService.getStudentProfileForAdvisor(userDetails.getUsername(), studentId)
        );
    }

    @PostMapping("/api/student/academic-requests")
    public ResponseEntity<AcademicRequestResponse> createAcademicRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AcademicRequestCreateRequest request) {
        return ResponseEntity.ok(
                academicAdvisingService.createAcademicRequest(userDetails.getUsername(), request)
        );
    }

    @GetMapping("/api/student/academic-requests")
    public ResponseEntity<List<AcademicRequestResponse>> getMyAcademicRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(academicAdvisingService.getMyRequests(userDetails.getUsername()));
    }

    @GetMapping("/api/advisor/academic-requests")
    public ResponseEntity<List<AcademicRequestResponse>> getAdvisorRequests(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) AcademicRequestStatus status) {
        return ResponseEntity.ok(
                academicAdvisingService.getAdvisorRequests(userDetails.getUsername(), status)
        );
    }

    @PatchMapping("/api/advisor/academic-requests/{requestId:\\d+}/decision")
    public ResponseEntity<AcademicRequestResponse> decideAcademicRequest(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Integer requestId,
            @Valid @RequestBody AcademicRequestDecisionRequest request) {
        return ResponseEntity.ok(
                academicAdvisingService.decideAcademicRequest(userDetails.getUsername(), requestId, request)
        );
    }
}
