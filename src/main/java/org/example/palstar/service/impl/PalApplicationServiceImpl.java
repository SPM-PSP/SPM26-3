package org.example.palstar.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.example.palstar.dto.PalPostApplicationCreateRequest;
import org.example.palstar.dto.PalPostApplicationResponse;
import org.example.palstar.dto.PalPostApplicationReviewRequest;
import org.example.palstar.entity.PalApplication;
import org.example.palstar.entity.PalPost;
import org.example.palstar.mapper.PalApplicationMapper;
import org.example.palstar.mapper.PalPostMapper;
import org.example.palstar.service.IPalApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PalApplicationServiceImpl extends ServiceImpl<PalApplicationMapper, PalApplication> implements IPalApplicationService {

    @Autowired
    private PalPostMapper postMapper;

    @Override
    @Transactional
    public PalPostApplicationResponse apply(Long userId, Long postId, PalPostApplicationCreateRequest request) {
        PalPost post = postMapper.selectById(postId);
        if (post == null || post.getDeletedAt() != null) {
            throw new RuntimeException("Post not found");
        }

        PalApplication existing = getOne(new QueryWrapper<PalApplication>()
            .eq("post_id", postId)
            .eq("applicant_id", userId)
            .in("status", 0, 1)
            .last("LIMIT 1"));
        if (existing != null) {
            throw new RuntimeException("Already applied");
        }

        PalApplication reusable = getOne(new QueryWrapper<PalApplication>()
            .eq("post_id", postId)
            .eq("applicant_id", userId)
            .in("status", 2, 3)
            .orderByDesc("updated_at")
            .last("LIMIT 1"));
        if (reusable != null) {
            reusable.setMessage(request.getMessage());
            reusable.setStatus(0);
            reusable.setRejectReason(null);
            reusable.setReviewedBy(null);
            reusable.setReviewedAt(null);
            reusable.setUpdatedAt(LocalDateTime.now());
            updateById(reusable);
            return toResponse(reusable);
        }

        PalApplication application = new PalApplication();
        application.setPostId(postId);
        application.setApplicantId(userId);
        application.setMessage(request.getMessage());
        application.setStatus(0);
        application.setCreatedAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());
        save(application);

        return toResponse(application);
    }

    @Override
    public List<PalPostApplicationResponse> listApplications(Long userId, Long postId) {
        PalPost post = postMapper.selectById(postId);
        if (post == null || post.getDeletedAt() != null) {
            throw new RuntimeException("Post not found");
        }
        if (!post.getAuthorId().equals(userId)) {
            throw new RuntimeException("No permission to view applications");
        }

        List<PalApplication> applications = list(new QueryWrapper<PalApplication>()
            .eq("post_id", postId)
            .in("status", 0, 1, 2)
            .orderByDesc("created_at"));
        return applications.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PalPostApplicationResponse review(Long userId, Long postId, Long applicationId, PalPostApplicationReviewRequest request) {
        PalPost post = postMapper.selectById(postId);
        if (post == null || post.getDeletedAt() != null) {
            throw new RuntimeException("Post not found");
        }
        if (!post.getAuthorId().equals(userId)) {
            throw new RuntimeException("No permission to review applications");
        }

        PalApplication application = getOne(new QueryWrapper<PalApplication>()
                .eq("id", applicationId)
                .eq("post_id", postId)
                .last("LIMIT 1"));
        if (application == null) {
            throw new RuntimeException("Application not found");
        }
        if (request.getStatus() == null || (request.getStatus() != 1 && request.getStatus() != 2)) {
            throw new RuntimeException("Invalid review status");
        }

        if (application.getStatus() != null && application.getStatus() != 0) {
            throw new RuntimeException("Application already reviewed");
        }

        application.setStatus(request.getStatus());
        application.setRejectReason(request.getRejectReason());
        application.setReviewedBy(String.valueOf(userId));
        application.setReviewedAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());
        updateById(application);

        if (request.getStatus() == 1) {
            int nextCount = post.getCurrentCount() != null ? post.getCurrentCount() + 1 : 1;
            post.setCurrentCount(nextCount);
            if (post.getExpectedCount() != null && nextCount >= post.getExpectedCount()) {
                post.setStatus(1);
            }
            post.setUpdatedAt(LocalDateTime.now());
            postMapper.updateById(post);
        }

        return toResponse(application);
    }

    @Override
    @Transactional
    public PalPostApplicationResponse cancel(Long userId, Long postId, Long applicationId) {
        PalApplication application = getOne(new QueryWrapper<PalApplication>()
                .eq("id", applicationId)
                .eq("post_id", postId)
                .eq("applicant_id", userId)
                .last("LIMIT 1"));
        if (application == null) {
            throw new RuntimeException("Application not found");
        }
        if (application.getStatus() == null || application.getStatus() != 0) {
            throw new RuntimeException("Cannot cancel this application");
        }
        application.setStatus(3);
        application.setUpdatedAt(LocalDateTime.now());
        updateById(application);
        return toResponse(application);
    }

    private PalPostApplicationResponse toResponse(PalApplication application) {
        PalPostApplicationResponse response = new PalPostApplicationResponse();
        response.setId(application.getId());
        response.setPostId(application.getPostId());
        response.setApplicantId(application.getApplicantId());
        response.setMessage(application.getMessage());
        response.setStatus(application.getStatus());
        response.setReviewedBy(application.getReviewedBy());
        response.setRejectReason(application.getRejectReason());
        response.setReviewedAt(application.getReviewedAt());
        response.setCreatedAt(application.getCreatedAt());
        response.setUpdatedAt(application.getUpdatedAt());
        return response;
    }
}
