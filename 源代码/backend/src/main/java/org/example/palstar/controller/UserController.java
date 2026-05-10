package org.example.palstar.controller;

import javax.servlet.http.HttpServletRequest;
import org.example.palstar.common.ApiResponse;
import org.example.palstar.dto.UserFollowResponse;
import org.example.palstar.dto.UserProfileUpdateRequest;
import org.example.palstar.dto.UserPublicProfileResponse;
import org.example.palstar.entity.User;
import org.example.palstar.service.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/user")
public class UserController {

    @Autowired
    private IUserService userService;

    @GetMapping("/profile")
    public ApiResponse<User> getUserProfile(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            User user = userService.getById(userId);
            return ApiResponse.success(user);
        } catch (Exception e) {
            return ApiResponse.error(500, "获取用户信息失败: " + e.getMessage());
        }
    }

    @PutMapping("/profile")
    public ApiResponse<User> updateUserProfile(@RequestBody UserProfileUpdateRequest payload, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            User updatedUser = userService.updateUserProfile(userId, payload);
            return ApiResponse.success("信息更新成功", updatedUser);
        } catch (Exception e) {
            return ApiResponse.error(500, "信息更新失败: " + e.getMessage());
        }
    }

    @GetMapping("/{userId}/profile")
    public ApiResponse<UserPublicProfileResponse> getUserPublicProfile(@PathVariable Long userId,
                                                                        HttpServletRequest request) {
        try {
            Long viewerId = (Long) request.getAttribute("userId");
            UserPublicProfileResponse response = userService.getUserPublicProfile(viewerId, userId);
            return ApiResponse.success("查询成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "查询失败: " + e.getMessage());
        }
    }

    @PostMapping("/cancellation/apply")
    public ApiResponse<Void> applyForCancellation(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            userService.applyForCancellation(userId);
            return ApiResponse.successMessage("注销申请成功，账号已进入15天冷静期");
        } catch (Exception e) {
            return ApiResponse.error(500, "申请注销失败: " + e.getMessage());
        }
    }

    @PostMapping("/cancellation/revoke")
    public ApiResponse<Void> revokeCancellation(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            userService.revokeCancellation(userId);
            return ApiResponse.successMessage("已成功撤销注销申请");
        } catch (Exception e) {
            return ApiResponse.error(500, "撤销注销失败: " + e.getMessage());
        }
    }

    @PostMapping("/{userId}/follow")
    public ApiResponse<UserFollowResponse> followUser(@PathVariable Long userId, HttpServletRequest request) {
        try {
            Long followerId = (Long) request.getAttribute("userId");
            UserFollowResponse response = userService.followUser(followerId, userId);
            return ApiResponse.success("关注成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "关注失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/{userId}/follow")
    public ApiResponse<Void> unfollowUser(@PathVariable Long userId, HttpServletRequest request) {
        try {
            Long followerId = (Long) request.getAttribute("userId");
            userService.unfollowUser(followerId, userId);
            return ApiResponse.successMessage("已取消关注");
        } catch (Exception e) {
            return ApiResponse.error(500, "取消关注失败: " + e.getMessage());
        }
    }
}
