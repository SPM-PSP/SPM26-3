package org.example.palstar.controller;

import java.util.List;
import javax.servlet.http.HttpServletRequest;
import org.example.palstar.common.ApiResponse;
import org.example.palstar.dto.PalPostCreateRequest;
import org.example.palstar.dto.PalPostPinRequest;
import org.example.palstar.dto.PalPostResponse;
import org.example.palstar.dto.PalPostUpdateRequest;
import org.example.palstar.service.IPalPostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/post")
public class PalPostController {

    @Autowired
    private IPalPostService postService;

    @PostMapping
    public ApiResponse<PalPostResponse> createPost(@RequestBody PalPostCreateRequest payload, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            PalPostResponse response = postService.createPost(userId, payload);
            return ApiResponse.success("发布成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "发布失败: " + e.getMessage());
        }
    }

    @GetMapping
    public ApiResponse<List<PalPostResponse>> listPosts(@RequestParam(required = false) Long authorId,
                                                         @RequestParam(required = false) String keyword,
                                                         @RequestParam(required = false) String interest) {
        try {
            return ApiResponse.success("查询成功", postService.listPosts(authorId, keyword, interest));
        } catch (Exception e) {
            return ApiResponse.error(500, "查询失败: " + e.getMessage());
        }
    }

    @GetMapping("/{postId}")
    public ApiResponse<PalPostResponse> getPost(@PathVariable Long postId) {
        try {
            return ApiResponse.success("查询成功", postService.getPost(postId));
        } catch (Exception e) {
            return ApiResponse.error(500, "查询失败: " + e.getMessage());
        }
    }

    @PutMapping("/{postId}")
    public ApiResponse<PalPostResponse> updatePost(@PathVariable Long postId,
                                                   @RequestBody PalPostUpdateRequest payload,
                                                   HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            PalPostResponse response = postService.updatePost(userId, postId, payload);
            return ApiResponse.success("更新成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "更新失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/{postId}")
    public ApiResponse<Void> deletePost(@PathVariable Long postId, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            postService.deletePost(userId, postId);
            return ApiResponse.successMessage("删除成功");
        } catch (Exception e) {
            return ApiResponse.error(500, "删除失败: " + e.getMessage());
        }
    }

    @PostMapping("/{postId}/pin")
    public ApiResponse<PalPostResponse> pinPost(@PathVariable Long postId,
                                                @RequestBody PalPostPinRequest payload,
                                                HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            PalPostResponse response = postService.pinPost(userId, postId, payload.getIsPinned());
            return ApiResponse.success("置顶成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "置顶失败: " + e.getMessage());
        }
    }

    @PostMapping("/{postId}/finish")
    public ApiResponse<PalPostResponse> finishPost(@PathVariable Long postId, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            PalPostResponse response = postService.finishPost(userId, postId);
            return ApiResponse.success("已结束", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "结束失败: " + e.getMessage());
        }
    }
}
