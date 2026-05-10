package org.example.palstar.controller;

import javax.servlet.http.HttpServletRequest;
import org.example.palstar.common.ApiResponse;
import org.example.palstar.dto.StudentVerificationRequest;
import org.example.palstar.dto.VerificationStatusResponse;
import org.example.palstar.entity.StudentVerification;
import org.example.palstar.service.IStudentVerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/verification")
public class VerificationController {

    @Autowired
    private IStudentVerificationService verificationService;

    @PostMapping("/student/apply")
    public ApiResponse<StudentVerification> applyForStudentVerification(@RequestBody StudentVerificationRequest payload,
                                                                        HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            StudentVerification verification = verificationService.apply(
                    userId,
                    payload.getRealName(),
                    payload.getStudentNo(),
                    payload.getSchool(),
                    payload.getProofImageUrl()
            );
            return ApiResponse.success("认证申请已提交，请等待审核", verification);
        } catch (Exception e) {
            return ApiResponse.error(500, "申请失败: " + e.getMessage());
        }
    }


    @GetMapping("/student/status")
    public ApiResponse<VerificationStatusResponse> getStudentVerificationStatus(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            VerificationStatusResponse status = verificationService.getStatus(userId);
            return ApiResponse.success("查询成功", status);
        } catch (Exception e) {
            return ApiResponse.error(500, "查询失败: " + e.getMessage());
        }
    }

    //TODO 添加管理员审核接口
}
