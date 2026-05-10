package org.example.palstar.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.palstar.dto.VerificationStatusResponse;
import org.example.palstar.entity.StudentVerification;
import org.example.palstar.entity.User;
import org.example.palstar.mapper.StudentVerificationMapper;
import org.example.palstar.service.IStudentVerificationService;
import org.example.palstar.service.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class StudentVerificationServiceImpl extends ServiceImpl<StudentVerificationMapper, StudentVerification> implements IStudentVerificationService {

    @Autowired
    private IUserService userService;

    @Override
    @Transactional
    public StudentVerification apply(Long userId, String realName, String studentNo, String school, String proofImageUrl) {
        StudentVerification verification = new StudentVerification();
        verification.setUserId(userId);
        verification.setRealName(realName);
        verification.setStudentNo(studentNo);
        verification.setSchool(school);
        verification.setProofImageUrl(proofImageUrl);
        verification.setStatus(0); // 0-待审核
        verification.setCreatedAt(LocalDateTime.now());
        verification.setUpdatedAt(LocalDateTime.now());
        save(verification);

        User user = userService.getById(userId);
        user.setVerifyStatus(1); // 1-审核中
        userService.updateById(user);

        return verification;
    }

    @Override
    public VerificationStatusResponse getStatus(Long userId) {
        User user = userService.getById(userId);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        StudentVerification application = findLatestByUserId(userId);

        VerificationStatusResponse response = new VerificationStatusResponse();
        response.setStatus(user.getVerifyStatus());
        response.setApplication(application);
        return response;
    }

    @Override
    public StudentVerification findLatestByUserId(Long userId) {
        return getOne(new QueryWrapper<StudentVerification>()
                .eq("user_id", userId)
                .orderByDesc("created_at")
                .last("LIMIT 1"));
    }
}
