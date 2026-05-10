package org.example.palstar.controller;

import java.util.List;
import javax.servlet.http.HttpServletRequest;
import org.example.palstar.common.ApiResponse;
import org.example.palstar.dto.PalPostApplicationCreateRequest;
import org.example.palstar.dto.PalPostApplicationResponse;
import org.example.palstar.dto.PalPostApplicationReviewRequest;
import org.example.palstar.service.IPalApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/post")
public class PalApplicationController {

    @Autowired
    private IPalApplicationService applicationService;

    @PostMapping("/{postId}/apply")
    public ApiResponse<PalPostApplicationResponse> apply(@PathVariable Long postId,
                                                         @RequestBody PalPostApplicationCreateRequest payload,
                                                         HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            PalPostApplicationResponse response = applicationService.apply(userId, postId, payload);
            return ApiResponse.success("申请已提交", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "申请失败: " + e.getMessage());
        }
    }

    @GetMapping("/{postId}/applications")
    public ApiResponse<List<PalPostApplicationResponse>> listApplications(@PathVariable Long postId,
                                                                          HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            List<PalPostApplicationResponse> response = applicationService.listApplications(userId, postId);
            return ApiResponse.success("查询成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "查询失败: " + e.getMessage());
        }
    }

    @PostMapping("/{postId}/applications/{applicationId}/review")
    public ApiResponse<PalPostApplicationResponse> review(@PathVariable Long postId,
                                                          @PathVariable Long applicationId,
                                                          @RequestBody PalPostApplicationReviewRequest payload,
                                                          HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            PalPostApplicationResponse response = applicationService.review(userId, postId, applicationId, payload);
            return ApiResponse.success("审核成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "审核失败: " + e.getMessage());
        }
    }

    @PostMapping("/{postId}/applications/{applicationId}/cancel")
    public ApiResponse<PalPostApplicationResponse> cancel(@PathVariable Long postId,
                                                          @PathVariable Long applicationId,
                                                          HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            PalPostApplicationResponse response = applicationService.cancel(userId, postId, applicationId);
            return ApiResponse.success("已取消申请", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "取消失败: " + e.getMessage());
        }
    }
}
