package org.example.palstar.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.example.palstar.dto.VerificationStatusResponse;
import org.example.palstar.entity.StudentVerification;

public interface IStudentVerificationService extends IService<StudentVerification> {
    StudentVerification apply(Long userId, String realName, String studentNo, String school, String proofImageUrl);

    VerificationStatusResponse getStatus(Long userId);

    StudentVerification findLatestByUserId(Long userId);
}
