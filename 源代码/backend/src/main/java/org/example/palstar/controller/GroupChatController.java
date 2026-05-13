package org.example.palstar.controller;

import java.util.List;
import javax.servlet.http.HttpServletRequest;
import org.example.palstar.common.ApiResponse;
import org.example.palstar.dto.GroupChatResponse;
import org.example.palstar.dto.GroupMessageResponse;
import org.example.palstar.dto.GroupMessageSendRequest;
import org.example.palstar.service.IGroupChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class GroupChatController {

    @Autowired
    private IGroupChatService groupChatService;

    @PostMapping("/groups/{groupId}/messages")
    public ApiResponse<GroupMessageResponse> sendMessage(
            @PathVariable Long groupId,
            @RequestBody GroupMessageSendRequest payload,
            HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            GroupMessageResponse response = groupChatService.sendMessage(groupId, userId, payload);
            return ApiResponse.success("发送成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "发送失败: " + e.getMessage());
        }
    }

    @GetMapping("/users/me/groups")
    public ApiResponse<List<GroupChatResponse>> listMyGroups(HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return ApiResponse.success("查询成功", groupChatService.listMyGroups(userId));
        } catch (Exception e) {
            return ApiResponse.error(500, "查询失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/groups/{groupId}/members/me")
    public ApiResponse<Void> leaveOrDissolve(
            @PathVariable Long groupId,
            HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            groupChatService.leaveOrDissolve(groupId, userId);
            return ApiResponse.successMessage("操作成功");
        } catch (Exception e) {
            return ApiResponse.error(500, "操作失败: " + e.getMessage());
        }
    }

    @GetMapping("/groups/{groupId}/messages")
    public ApiResponse<List<GroupMessageResponse>> listMessages(
            @PathVariable Long groupId,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            return ApiResponse.success("查询成功",
                    groupChatService.listMessages(groupId, page, size));
        } catch (Exception e) {
            return ApiResponse.error(500, "查询失败: " + e.getMessage());
        }
    }
}
