package org.example.palstar.service;

import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
import org.example.palstar.dto.MomentCommentRequest;
import org.example.palstar.dto.MomentCommentResponse;
import org.example.palstar.dto.MomentCreateRequest;
import org.example.palstar.dto.MomentFavoriteResponse;
import org.example.palstar.dto.MomentLikeResponse;
import org.example.palstar.dto.MomentResponse;
import org.example.palstar.dto.MomentUpdateRequest;
import org.example.palstar.entity.Moment;

public interface IMomentService extends IService<Moment> {
    MomentResponse createMoment(Long userId, MomentCreateRequest request);

    List<MomentResponse> listMoments(Long viewerId, Long authorId, String sort, String keyword, String tag);

    MomentResponse getMoment(Long viewerId, Long momentId);

    MomentResponse updateMoment(Long userId, Long momentId, MomentUpdateRequest request);

    void deleteMoment(Long userId, Long momentId);

    MomentLikeResponse likeMoment(Long userId, Long momentId);

    void unlikeMoment(Long userId, Long momentId);

    MomentFavoriteResponse favoriteMoment(Long userId, Long momentId);

    void unfavoriteMoment(Long userId, Long momentId);

    MomentCommentResponse addComment(Long userId, Long momentId, MomentCommentRequest request);

    List<MomentCommentResponse> listComments(Long momentId);

    void deleteComment(Long userId, Long commentId);
}
