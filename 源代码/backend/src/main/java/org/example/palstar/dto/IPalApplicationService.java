package org.example.palstar.service;

import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
import org.example.palstar.dto.PalPostApplicationCreateRequest;
import org.example.palstar.dto.PalPostApplicationResponse;
import org.example.palstar.dto.PalPostApplicationReviewRequest;
import org.example.palstar.entity.PalApplication;

public interface IPalApplicationService extends IService<PalApplication> {
    PalPostApplicationResponse apply(Long userId, Long postId, PalPostApplicationCreateRequest request);

    List<PalPostApplicationResponse> listApplications(Long userId, Long postId);

    PalPostApplicationResponse review(Long userId, Long postId, Long applicationId, PalPostApplicationReviewRequest request);

    PalPostApplicationResponse cancel(Long userId, Long postId, Long applicationId);

    List<PalPostApplicationResponse> listMyApplications(Long userId);
}
