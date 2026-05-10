package org.example.palstar.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.example.palstar.dto.PalPostCreateRequest;
import org.example.palstar.dto.PalPostResponse;
import org.example.palstar.dto.PalPostUpdateRequest;
import org.example.palstar.entity.PalPost;
import org.example.palstar.entity.PalPostImage;
import org.example.palstar.mapper.PalPostImageMapper;
import org.example.palstar.mapper.PalPostMapper;
import org.example.palstar.service.IPalPostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PalPostServiceImpl extends ServiceImpl<PalPostMapper, PalPost> implements IPalPostService {

    @Autowired
    private PalPostImageMapper postImageMapper;

    @Override
    @Transactional
    public PalPostResponse createPost(Long userId, PalPostCreateRequest request) {
        PalPost post = new PalPost();
        post.setAuthorId(userId);
        post.setScene(request.getScene());
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setLocation(request.getLocation());
        post.setStartTime(request.getStartTime());
        post.setExpectedCount(request.getExpectedCount() != null ? request.getExpectedCount() : 1);
        post.setCurrentCount(1);
        post.setGenderRequirement(request.getGenderRequirement() != null ? request.getGenderRequirement() : 0);
        post.setGradeRequirement(request.getGradeRequirement());
        post.setInterestRequirements(request.getInterestRequirements());
        post.setStatus(0);
        post.setIsPinned(0);
        post.setReviewStatus(0);
        post.setCoverImage(request.getCoverImage());
        post.setCreatedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        save(post);

        saveImages(post.getId(), request.getImageUrls());

        return toResponse(post, getImages(post.getId()));
    }

    @Override
    public List<PalPostResponse> listPosts(Long authorId, String keyword, String interest) {
        QueryWrapper<PalPost> query = new QueryWrapper<PalPost>()
                .isNull("deleted_at")
                .orderByDesc("is_pinned")
                .orderByDesc("created_at");
        if (authorId != null) {
            query.eq("author_id", authorId);
        }
        if (keyword != null && !keyword.isEmpty()) {
            query.like("title", keyword);
        }
        if (interest != null && !interest.isEmpty()) {
            query.apply("JSON_CONTAINS(interest_requirements, '\"" + interest + "\"')");
        }
        List<PalPost> posts = list(query);
        if (posts.isEmpty()) {
            return Collections.emptyList();
        }
        List<PalPostResponse> responses = new ArrayList<>();
        for (PalPost post : posts) {
            responses.add(toResponse(post, getImages(post.getId())));
        }
        return responses;
    }

    @Override
    public PalPostResponse getPost(Long postId) {
        PalPost post = getById(postId);
        if (post == null || post.getDeletedAt() != null) {
            throw new RuntimeException("Post not found");
        }
        return toResponse(post, getImages(postId));
    }

    @Override
    @Transactional
    public PalPostResponse updatePost(Long userId, Long postId, PalPostUpdateRequest request) {
        PalPost post = getById(postId);
        if (post == null || post.getDeletedAt() != null) {
            throw new RuntimeException("Post not found");
        }
        if (!post.getAuthorId().equals(userId)) {
            throw new RuntimeException("No permission to update this post");
        }
        if (request.getScene() != null) {
            post.setScene(request.getScene());
        }
        if (request.getTitle() != null) {
            post.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            post.setContent(request.getContent());
        }
        if (request.getLocation() != null) {
            post.setLocation(request.getLocation());
        }
        if (request.getStartTime() != null) {
            post.setStartTime(request.getStartTime());
        }
        if (request.getExpectedCount() != null) {
            post.setExpectedCount(request.getExpectedCount());
        }
        if (request.getGenderRequirement() != null) {
            post.setGenderRequirement(request.getGenderRequirement());
        }
        if (request.getGradeRequirement() != null) {
            post.setGradeRequirement(request.getGradeRequirement());
        }
        if (request.getInterestRequirements() != null) {
            post.setInterestRequirements(request.getInterestRequirements());
        }
        if (request.getCoverImage() != null) {
            post.setCoverImage(request.getCoverImage());
        }
        post.setUpdatedAt(LocalDateTime.now());
        updateById(post);

        if (request.getImageUrls() != null) {
            replaceImages(postId, request.getImageUrls());
        }

        return toResponse(post, getImages(postId));
    }

    @Override
    public void deletePost(Long userId, Long postId) {
        PalPost post = getById(postId);
        if (post == null || post.getDeletedAt() != null) {
            throw new RuntimeException("Post not found");
        }
        if (!post.getAuthorId().equals(userId)) {
            throw new RuntimeException("No permission to delete this post");
        }
        post.setStatus(3);
        post.setDeletedAt(LocalDateTime.now());
        post.setUpdatedAt(LocalDateTime.now());
        updateById(post);
    }

    @Override
    public PalPostResponse pinPost(Long userId, Long postId, Integer isPinned) {
        PalPost post = getById(postId);
        if (post == null || post.getDeletedAt() != null) {
            throw new RuntimeException("Post not found");
        }
        if (!post.getAuthorId().equals(userId)) {
            throw new RuntimeException("No permission to pin this post");
        }
        post.setIsPinned(isPinned != null ? isPinned : 0);
        post.setUpdatedAt(LocalDateTime.now());
        updateById(post);
        return toResponse(post, getImages(postId));
    }

    @Override
    public PalPostResponse finishPost(Long userId, Long postId) {
        PalPost post = getById(postId);
        if (post == null || post.getDeletedAt() != null) {
            throw new RuntimeException("Post not found");
        }
        if (!post.getAuthorId().equals(userId)) {
            throw new RuntimeException("No permission to finish this post");
        }
        post.setStatus(2);
        post.setUpdatedAt(LocalDateTime.now());
        updateById(post);
        return toResponse(post, getImages(postId));
    }

    private List<PalPostImage> getImages(Long postId) {
        return postImageMapper.selectList(new QueryWrapper<PalPostImage>()
                .eq("post_id", postId)
                .orderByAsc("sort_no")
                .orderByAsc("id"));
    }

    private void saveImages(Long postId, List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return;
        }
        int index = 0;
        for (String url : imageUrls) {
            PalPostImage image = new PalPostImage();
            image.setPostId(postId);
            image.setImageUrl(url);
            image.setSortNo(index++);
            image.setCreatedAt(LocalDateTime.now());
            postImageMapper.insert(image);
        }
    }

    private void replaceImages(Long postId, List<String> imageUrls) {
        postImageMapper.delete(new QueryWrapper<PalPostImage>().eq("post_id", postId));
        saveImages(postId, imageUrls);
    }

    private PalPostResponse toResponse(PalPost post, List<PalPostImage> images) {
        PalPostResponse response = new PalPostResponse();
        response.setId(post.getId());
        response.setAuthorId(post.getAuthorId());
        response.setScene(post.getScene());
        response.setTitle(post.getTitle());
        response.setContent(post.getContent());
        response.setLocation(post.getLocation());
        response.setStartTime(post.getStartTime());
        response.setExpectedCount(post.getExpectedCount());
        response.setCurrentCount(post.getCurrentCount());
        response.setGenderRequirement(post.getGenderRequirement());
        response.setGradeRequirement(post.getGradeRequirement());
        response.setInterestRequirements(post.getInterestRequirements());
        response.setStatus(post.getStatus());
        response.setIsPinned(post.getIsPinned());
        response.setReviewStatus(post.getReviewStatus());
        response.setCoverImage(post.getCoverImage());
        response.setImageUrls(images.stream().map(PalPostImage::getImageUrl).collect(Collectors.toList()));
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
        return response;
    }
}
