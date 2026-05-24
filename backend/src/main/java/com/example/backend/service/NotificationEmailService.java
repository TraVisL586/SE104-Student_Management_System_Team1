package com.example.backend.service;

import com.example.backend.constant.AcademicRequestStatus;
import com.example.backend.entity.AcademicRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEmailService {
    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:no-reply@eduportal.local}")
    private String fromAddress;

    public void sendAcademicRequestDecision(AcademicRequest request) {
        if (!mailEnabled) {
            log.info("Mail is disabled. Skipping academic request decision email for request {}", request.getId());
            return;
        }

        String recipient = request.getStudent().getEmail();
        if (recipient == null || recipient.isBlank()) {
            log.warn("Cannot send academic request decision email for request {} because student email is blank", request.getId());
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(recipient);
            message.setSubject("Kết quả xử lý yêu cầu học vụ - " + request.getTitle());
            message.setText(buildAcademicRequestDecisionBody(request));
            mailSender.send(message);
        } catch (Exception ex) {
            log.warn("Failed to send academic request decision email for request {}", request.getId(), ex);
        }
    }

    private String buildAcademicRequestDecisionBody(AcademicRequest request) {
        String statusLabel = request.getStatus() == AcademicRequestStatus.APPROVED
                ? "Đã duyệt"
                : "Từ chối";

        StringBuilder body = new StringBuilder();
        body.append("Xin chào ").append(request.getStudent().getFullName()).append(",\n\n");
        body.append("Yêu cầu học vụ của bạn đã được xử lý.\n\n");
        body.append("Tiêu đề: ").append(request.getTitle()).append("\n");
        body.append("Loại yêu cầu: ").append(request.getType()).append("\n");
        body.append("Kết quả: ").append(statusLabel).append("\n");

        if (request.getAdvisorNote() != null && !request.getAdvisorNote().isBlank()) {
            body.append("Ghi chú của cố vấn: ").append(request.getAdvisorNote()).append("\n");
        }

        body.append("\nVui lòng đăng nhập hệ thống để xem chi tiết.\n");
        body.append("\nEduPortal");
        return body.toString();
    }
}
