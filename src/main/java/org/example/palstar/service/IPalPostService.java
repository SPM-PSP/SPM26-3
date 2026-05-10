package org.example.palstar.service;

import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
import org.example.palstar.dto.PalPostCreateRequest;
import org.example.palstar.dto.PalPostResponse;
import org.example.palstar.dto.PalPostUpdateRequest;
import org.example.palstar.entity.PalPost;

public interface IPalPostService extends IService<PalPost> {
    PalPostResponse createPost(Long userId, PalPostCreateRequest request);

    List<PalPostResponse> listPosts(Long authorId, String keyword, String interest);

    PalPostResponse getPost(Long postId);

    PalPostResponse updatePost(Long userId, Long postId, PalPostUpdateRequest request);

    void deletePost(Long userId, Long postId);

    PalPostResponse pinPost(Long userId, Long postId, Integer isPinned);

    PalPostResponse finishPost(Long userId, Long postId);
}
