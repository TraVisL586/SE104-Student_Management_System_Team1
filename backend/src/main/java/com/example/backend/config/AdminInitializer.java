package com.example.backend.config;

import com.example.backend.constant.RoleName;
import com.example.backend.entity.Role;
import com.example.backend.entity.User;
import com.example.backend.repository.RoleRepository;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:}")
    private String adminUsername;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.full-name:Admin}")
    private String adminFullName;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(adminUsername)
                || !StringUtils.hasText(adminEmail)
                || !StringUtils.hasText(adminPassword)) {
            return;
        }

        Role adminRole = roleRepository.findByName(RoleName.ADMIN)
                .orElseThrow(() -> new RuntimeException("Role ADMIN does not exist"));

        userRepository.findByUsername(adminUsername).ifPresentOrElse(existingAdmin -> {
            existingAdmin.setEmail(adminEmail);
            existingAdmin.setFullName(adminFullName);
            existingAdmin.setPassword(passwordEncoder.encode(adminPassword));
            existingAdmin.setIsActive(true);
            existingAdmin.getRoles().clear();
            existingAdmin.getRoles().add(adminRole);
            userRepository.save(existingAdmin);
        }, () -> {
            if (userRepository.existsByEmail(adminEmail)) {
                throw new RuntimeException("Admin email already exists");
            }

            User admin = new User();
            admin.setUsername(adminUsername);
            admin.setEmail(adminEmail);
            admin.setFullName(adminFullName);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setIsActive(true);
            admin.getRoles().add(adminRole);

            userRepository.save(admin);
        });
    }
}
