package org.example.palstar.controller;

import java.util.List;
import javax.servlet.http.HttpServletRequest;
import org.example.palstar.common.ApiResponse;
import org.example.palstar.dto.MomentCommentRequest;
import org.example.palstar.dto.MomentCommentResponse;
import org.example.palstar.dto.MomentCreateRequest;
import org.example.palstar.dto.MomentFavoriteResponse;
import org.example.palstar.dto.MomentLikeResponse;
import org.example.palstar.dto.MomentResponse;
import org.example.palstar.dto.MomentUpdateRequest;
import org.example.palstar.service.IMomentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/moment")
public class MomentController {

    @Autowired
    private IMomentService momentService;

    @PostMapping
    public ApiResponse<MomentResponse> createMoment(@RequestBody MomentCreateRequest payload,
                                                    HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            MomentResponse response = momentService.createMoment(userId, payload);
            return ApiResponse.success("发布成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "发布失败: " + e.getMessage());
        }
    }

    @GetMapping
    public ApiResponse<List<MomentResponse>> listMoments(@RequestParam(required = false) Long authorId,
                                                         @RequestParam(required = false) String sort,
                                                         @RequestParam(required = false) String keyword,
                                                         @RequestParam(required = false) String tag,
                                                         HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return ApiResponse.success("查询成功", momentService.listMoments(userId, authorId, sort, keyword, tag));
        } catch (Exception e) {
            return ApiResponse.error(500, "查询失败: " + e.getMessage());
        }
    }

    @GetMapping("/{momentId}")
    public ApiResponse<MomentResponse> getMoment(@PathVariable Long momentId, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            return ApiResponse.success("查询成功", momentService.getMoment(userId, momentId));
        } catch (Exception e) {
            return ApiResponse.error(500, "查询失败: " + e.getMessage());
        }
    }

    @PutMapping("/{momentId}")
    public ApiResponse<MomentResponse> updateMoment(@PathVariable Long momentId,
                                                    @RequestBody MomentUpdateRequest payload,
                                                    HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            MomentResponse response = momentService.updateMoment(userId, momentId, payload);
            return ApiResponse.success("更新成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "更新失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/{momentId}")
    public ApiResponse<Void> deleteMoment(@PathVariable Long momentId, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            momentService.deleteMoment(userId, momentId);
            return ApiResponse.successMessage("删除成功");
        } catch (Exception e) {
            return ApiResponse.error(500, "删除失败: " + e.getMessage());
        }
    }

    @PostMapping("/{momentId}/like")
    public ApiResponse<MomentLikeResponse> likeMoment(@PathVariable Long momentId, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            MomentLikeResponse response = momentService.likeMoment(userId, momentId);
            return ApiResponse.success("点赞成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "点赞失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/{momentId}/like")
    public ApiResponse<Void> unlikeMoment(@PathVariable Long momentId, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            momentService.unlikeMoment(userId, momentId);
            return ApiResponse.successMessage("已取消点赞");
        } catch (Exception e) {
            return ApiResponse.error(500, "取消点赞失败: " + e.getMessage());
        }
    }

    @PostMapping("/{momentId}/favorite")
    public ApiResponse<MomentFavoriteResponse> favoriteMoment(@PathVariable Long momentId, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            MomentFavoriteResponse response = momentService.favoriteMoment(userId, momentId);
            return ApiResponse.success("收藏成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "收藏失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/{momentId}/favorite")
    public ApiResponse<Void> unfavoriteMoment(@PathVariable Long momentId, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            momentService.unfavoriteMoment(userId, momentId);
            return ApiResponse.successMessage("已取消收藏");
        } catch (Exception e) {
            return ApiResponse.error(500, "取消收藏失败: " + e.getMessage());
        }
    }

    @PostMapping("/{momentId}/comment")
    public ApiResponse<MomentCommentResponse> addComment(@PathVariable Long momentId,
                                                         @RequestBody MomentCommentRequest payload,
                                                         HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            MomentCommentResponse response = momentService.addComment(userId, momentId, payload);
            return ApiResponse.success("评论成功", response);
        } catch (Exception e) {
            return ApiResponse.error(500, "评论失败: " + e.getMessage());
        }
    }

    @GetMapping("/{momentId}/comment")
    public ApiResponse<List<MomentCommentResponse>> listComments(@PathVariable Long momentId) {
        try {
            return ApiResponse.success("查询成功", momentService.listComments(momentId));
        } catch (Exception e) {
            return ApiResponse.error(500, "查询失败: " + e.getMessage());
        }
    }

    @DeleteMapping("/comment/{commentId}")
    public ApiResponse<Void> deleteComment(@PathVariable Long commentId, HttpServletRequest request) {
        try {
            Long userId = (Long) request.getAttribute("userId");
            momentService.deleteComment(userId, commentId);
            return ApiResponse.successMessage("删除成功");
        } catch (Exception e) {
            return ApiResponse.error(500, "删除失败: " + e.getMessage());
        }
    }
}
