package org.example.palstar.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.example.palstar.dto.MomentCommentRequest;
import org.example.palstar.dto.MomentCommentResponse;
import org.example.palstar.dto.MomentCreateRequest;
import org.example.palstar.dto.MomentFavoriteResponse;
import org.example.palstar.dto.MomentLikeResponse;
import org.example.palstar.dto.MomentMediaRequest;
import org.example.palstar.dto.MomentMediaResponse;
import org.example.palstar.dto.MomentResponse;
import org.example.palstar.dto.MomentUpdateRequest;
import org.example.palstar.dto.MyCommentResponse;
import org.example.palstar.dto.MyLikedMomentResponse;
import org.example.palstar.entity.Moment;
import org.example.palstar.entity.MomentComment;
import org.example.palstar.entity.MomentFavorite;
import org.example.palstar.entity.MomentLike;
import org.example.palstar.entity.MomentMedia;
import org.example.palstar.entity.UserFollow;
import org.example.palstar.mapper.MomentCommentMapper;
import org.example.palstar.mapper.MomentFavoriteMapper;
import org.example.palstar.mapper.MomentLikeMapper;
import org.example.palstar.mapper.MomentMapper;
import org.example.palstar.mapper.MomentMediaMapper;
import org.example.palstar.mapper.UserFollowMapper;
import org.example.palstar.service.IMomentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MomentServiceImpl extends ServiceImpl<MomentMapper, Moment> implements IMomentService {

    @Autowired
    private MomentMediaMapper momentMediaMapper;

    @Autowired
    private MomentLikeMapper momentLikeMapper;

    @Autowired
    private MomentFavoriteMapper momentFavoriteMapper;

    @Autowired
    private MomentCommentMapper momentCommentMapper;

    @Autowired
    private UserFollowMapper userFollowMapper;

    @Autowired
    private StringRedisTemplate redisTemplate;

    private static final Duration COUNT_CACHE_TTL = Duration.ofMinutes(10);

    @Override
    @Transactional
    public MomentResponse createMoment(Long userId, MomentCreateRequest request) {
        Moment moment = new Moment();
        moment.setAuthorId(userId);
        moment.setScene(request.getScene() != null ? request.getScene() : "moment");
        moment.setTitle(request.getTitle());
        moment.setContent(request.getContent());
        moment.setLocation(request.getLocation());
        moment.setTags(request.getTags());
        moment.setStatus(request.getStatus() != null ? request.getStatus() : 0);
        moment.setReviewStatus(0);
        moment.setLikeCount(0);
        moment.setFavoriteCount(0);
        moment.setCommentCount(0);
        moment.setHotScore(BigDecimal.ZERO);
        moment.setCreatedAt(LocalDateTime.now());
        moment.setUpdatedAt(LocalDateTime.now());
        save(moment);

        saveMedia(moment.getId(), request.getMedia());

        return toResponse(moment, getMedia(moment.getId()));
    }

    @Override
    public List<MomentResponse> listMoments(Long viewerId, Long authorId, String sort, String keyword, String tag) {
        QueryWrapper<Moment> query = new QueryWrapper<Moment>()
                .isNull("deleted_at")
                .ne("status", 3);
        if (authorId != null) {
            query.eq("author_id", authorId);
            if (viewerId == null || !authorId.equals(viewerId)) {
                query.ne("status", 1);
            }
        } else {
            query.ne("status", 1);
        }
        if (keyword != null && !keyword.isEmpty()) {
            query.like("title", keyword);
        }
        if (tag != null && !tag.isEmpty()) {
            query.apply("JSON_CONTAINS(tags, '\"" + tag + "\"')");
        }
        if ("hot".equalsIgnoreCase(sort)) {
            query.orderByDesc("hot_score").orderByDesc("created_at");
        } else {
            query.orderByDesc("created_at");
        }
        List<Moment> moments = list(query);
        if (moments.isEmpty()) {
            return Collections.emptyList();
        }
        return moments.stream()
                .map(moment -> toResponseWithRelations(moment, null, viewerId))
                .collect(Collectors.toList());
    }

    @Override
    public MomentResponse getMoment(Long viewerId, Long momentId) {
        Moment moment = getOne(new QueryWrapper<Moment>()
                .eq("id", momentId)
                .isNull("deleted_at")
                .ne("status", 3));
        if (moment == null) {
            throw new RuntimeException("Moment not found");
        }
        if (moment.getStatus() != null && moment.getStatus() == 1
                && (viewerId == null || !moment.getAuthorId().equals(viewerId))) {
            throw new RuntimeException("Moment not found");
        }
        return toResponseWithRelations(moment, getMedia(momentId), viewerId);
    }

    @Override
    @Transactional
    public MomentResponse updateMoment(Long userId, Long momentId, MomentUpdateRequest request) {
        Moment moment = getById(momentId);
        if (moment == null || moment.getDeletedAt() != null || moment.getStatus() != null && moment.getStatus() == 3) {
            throw new RuntimeException("Moment not found");
        }
        if (!moment.getAuthorId().equals(userId)) {
            throw new RuntimeException("No permission to update this moment");
        }
        if (request.getTitle() != null) {
            moment.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            moment.setContent(request.getContent());
        }
        if (request.getLocation() != null) {
            moment.setLocation(request.getLocation());
        }
        if (request.getTags() != null) {
            moment.setTags(request.getTags());
        }
        if (request.getStatus() != null) {
            moment.setStatus(request.getStatus());
        }
        moment.setUpdatedAt(LocalDateTime.now());
        updateById(moment);

        if (request.getMedia() != null) {
            replaceMedia(momentId, request.getMedia());
        }

        return toResponse(moment, getMedia(momentId));
    }

    @Override
    public void deleteMoment(Long userId, Long momentId) {
        Moment moment = getById(momentId);
        if (moment == null || moment.getDeletedAt() != null || moment.getStatus() != null && moment.getStatus() == 3) {
            throw new RuntimeException("Moment not found");
        }
        if (!moment.getAuthorId().equals(userId)) {
            throw new RuntimeException("No permission to delete this moment");
        }
        moment.setStatus(2);
        moment.setDeletedAt(LocalDateTime.now());
        moment.setUpdatedAt(LocalDateTime.now());
        updateById(moment);
    }

    @Override
    @Transactional
    public MomentLikeResponse likeMoment(Long userId, Long momentId) {
        Moment moment = requireActiveMoment(momentId);
        MomentLike existing = momentLikeMapper.selectOne(new QueryWrapper<MomentLike>()
                .eq("moment_id", momentId)
                .eq("user_id", userId));
        if (existing != null) {
            throw new RuntimeException("Already liked");
        }
        MomentLike like = new MomentLike();
        like.setMomentId(momentId);
        like.setUserId(userId);
        like.setCreatedAt(LocalDateTime.now());
        momentLikeMapper.insert(like);

        redisTemplate.opsForValue().increment(likeCountKey(momentId));
        touchCountKey(likeCountKey(momentId));

        MomentLikeResponse response = new MomentLikeResponse();
        response.setMomentId(momentId);
        response.setUserId(userId);
        response.setCreatedAt(like.getCreatedAt());
        return response;
    }

    @Override
    @Transactional
    public void unlikeMoment(Long userId, Long momentId) {
        Moment moment = requireActiveMoment(momentId);
        MomentLike existing = momentLikeMapper.selectOne(new QueryWrapper<MomentLike>()
                .eq("moment_id", momentId)
                .eq("user_id", userId));
        if (existing == null) {
            throw new RuntimeException("Like not found");
        }
        momentLikeMapper.deleteById(existing.getId());
        redisTemplate.opsForValue().decrement(likeCountKey(momentId));
        touchCountKey(likeCountKey(momentId));
    }

    @Override
    @Transactional
    public MomentFavoriteResponse favoriteMoment(Long userId, Long momentId) {
        Moment moment = requireActiveMoment(momentId);
        MomentFavorite existing = momentFavoriteMapper.selectOne(new QueryWrapper<MomentFavorite>()
                .eq("moment_id", momentId)
                .eq("user_id", userId));
        if (existing != null) {
            throw new RuntimeException("Already favorited");
        }
        MomentFavorite favorite = new MomentFavorite();
        favorite.setMomentId(momentId);
        favorite.setUserId(userId);
        favorite.setCreatedAt(LocalDateTime.now());
        momentFavoriteMapper.insert(favorite);

        redisTemplate.opsForValue().increment(favoriteCountKey(momentId));
        touchCountKey(favoriteCountKey(momentId));

        MomentFavoriteResponse response = new MomentFavoriteResponse();
        response.setMomentId(momentId);
        response.setUserId(userId);
        response.setCreatedAt(favorite.getCreatedAt());
        return response;
    }

    @Override
    @Transactional
    public void unfavoriteMoment(Long userId, Long momentId) {
        Moment moment = requireActiveMoment(momentId);
        MomentFavorite existing = momentFavoriteMapper.selectOne(new QueryWrapper<MomentFavorite>()
                .eq("moment_id", momentId)
                .eq("user_id", userId));
        if (existing == null) {
            throw new RuntimeException("Favorite not found");
        }
        momentFavoriteMapper.deleteById(existing.getId());
        redisTemplate.opsForValue().decrement(favoriteCountKey(momentId));
        touchCountKey(favoriteCountKey(momentId));
    }

    @Override
    @Transactional
    public MomentCommentResponse addComment(Long userId, Long momentId, MomentCommentRequest request) {
        Moment moment = requireActiveMoment(momentId);
        MomentComment comment = new MomentComment();
        comment.setMomentId(momentId);
        comment.setUserId(userId);
        comment.setParentId(request.getParentId());
        comment.setReplyToId(request.getReplyToId());
        comment.setContent(request.getContent());
        comment.setStatus(0);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());
        momentCommentMapper.insert(comment);

        redisTemplate.opsForValue().increment(commentCountKey(momentId));
        touchCountKey(commentCountKey(momentId));

        return toCommentResponse(comment);
    }

    @Override
    public List<MomentCommentResponse> listComments(Long momentId) {
        requireActiveMoment(momentId);
        List<MomentComment> comments = momentCommentMapper.selectList(new QueryWrapper<MomentComment>()
                .eq("moment_id", momentId)
                .eq("status", 0)
                .orderByAsc("created_at")
                .orderByAsc("id"));
        if (comments.isEmpty()) {
            return Collections.emptyList();
        }
        return comments.stream()
                .map(this::toCommentResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        MomentComment comment = momentCommentMapper.selectById(commentId);
        if (comment == null || comment.getStatus() == null || comment.getStatus() != 0) {
            throw new RuntimeException("Comment not found");
        }
        if (!comment.getUserId().equals(userId)) {
            throw new RuntimeException("No permission to delete this comment");
        }
        comment.setStatus(1);
        comment.setUpdatedAt(LocalDateTime.now());
        momentCommentMapper.updateById(comment);

        redisTemplate.opsForValue().decrement(commentCountKey(comment.getMomentId()));
        touchCountKey(commentCountKey(comment.getMomentId()));
    }

    @Override
    public List<MyLikedMomentResponse> getMyLikedMoments(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        return baseMapper.findLikedMomentsByUserId(userId);
    }

    @Override
    public List<MyLikedMomentResponse> getMyFavoritedMoments(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        return baseMapper.findFavoritedMomentsByUserId(userId);
    }

    @Override
    public List<MyCommentResponse> getMyComments(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        return baseMapper.findCommentsByUserId(userId);
    }

    private List<MomentMedia> getMedia(Long momentId) {
        return momentMediaMapper.selectList(new QueryWrapper<MomentMedia>()
                .eq("moment_id", momentId)
                .orderByAsc("sort_no")
                .orderByAsc("id"));
    }

    private void saveMedia(Long momentId, List<MomentMediaRequest> media) {
        if (media == null || media.isEmpty()) {
            return;
        }
        int index = 0;
        for (MomentMediaRequest item : media) {
            MomentMedia momentMedia = new MomentMedia();
            momentMedia.setMomentId(momentId);
            momentMedia.setMediaType(item.getMediaType());
            momentMedia.setMediaUrl(item.getMediaUrl());
            momentMedia.setSortNo(item.getSortNo() != null ? item.getSortNo() : index);
            momentMedia.setCreatedAt(LocalDateTime.now());
            momentMediaMapper.insert(momentMedia);
            index++;
        }
    }

    private void replaceMedia(Long momentId, List<MomentMediaRequest> media) {
        momentMediaMapper.delete(new QueryWrapper<MomentMedia>().eq("moment_id", momentId));
        saveMedia(momentId, media);
    }

    private MomentResponse toResponse(Moment moment, List<MomentMedia> media) {
        MomentResponse response = new MomentResponse();
        response.setId(moment.getId());
        response.setAuthorId(moment.getAuthorId());
        response.setScene(moment.getScene());
        response.setTitle(moment.getTitle());
        response.setContent(moment.getContent());
        response.setLocation(moment.getLocation());
        response.setTags(moment.getTags());
        response.setStatus(moment.getStatus());
        response.setReviewStatus(moment.getReviewStatus());
        response.setLikeCount(moment.getLikeCount());
        response.setFavoriteCount(moment.getFavoriteCount());
        response.setCommentCount(moment.getCommentCount());
        response.setHotScore(moment.getHotScore());
        response.setCreatedAt(moment.getCreatedAt());
        response.setUpdatedAt(moment.getUpdatedAt());
        if (media != null) {
            response.setMedia(media.stream().map(this::toMediaResponse).collect(Collectors.toList()));
        }
        return response;
    }

        private MomentResponse toResponseWithRelations(Moment moment, List<MomentMedia> media, Long viewerId) {
            MomentResponse response = toResponse(moment, media);
            applyCountsFromCache(response, moment);
            if (viewerId == null) {
                return response;
            }
        Long momentId = moment.getId();
        Long authorId = moment.getAuthorId();
        boolean isLiked = momentLikeMapper.selectCount(new QueryWrapper<MomentLike>()
            .eq("moment_id", momentId)
            .eq("user_id", viewerId)) > 0;
        boolean isFavorited = momentFavoriteMapper.selectCount(new QueryWrapper<MomentFavorite>()
            .eq("moment_id", momentId)
            .eq("user_id", viewerId)) > 0;
        boolean isFollow = false;
        if (authorId != null && !authorId.equals(viewerId)) {
            isFollow = userFollowMapper.selectCount(new QueryWrapper<UserFollow>()
                .eq("follower_id", viewerId)
                .eq("following_id", authorId)
                .eq("status", 0)) > 0;
        }
        int followerCount = Math.toIntExact(userFollowMapper.selectCount(new QueryWrapper<UserFollow>()
            .eq("following_id", authorId)
            .eq("status", 0)));
        int followingCount = Math.toIntExact(userFollowMapper.selectCount(new QueryWrapper<UserFollow>()
            .eq("follower_id", authorId)
            .eq("status", 0)));

        response.setIsLiked(isLiked);
        response.setIsFavorited(isFavorited);
        response.setIsFollow(isFollow);
        response.setFollowerCount(followerCount);
        response.setFollowingCount(followingCount);
        return response;
        }

    private void applyCountsFromCache(MomentResponse response, Moment moment) {
        Long momentId = moment.getId();
        Integer likeCount = getCountFromCache(likeCountKey(momentId), moment.getLikeCount());
        Integer favoriteCount = getCountFromCache(favoriteCountKey(momentId), moment.getFavoriteCount());
        Integer commentCount = getCountFromCache(commentCountKey(momentId), moment.getCommentCount());
        response.setLikeCount(likeCount);
        response.setFavoriteCount(favoriteCount);
        response.setCommentCount(commentCount);
    }

    private Integer getCountFromCache(String key, Integer fallback) {
        String value = redisTemplate.opsForValue().get(key);
        if (value == null) {
            Integer resolved = fallback != null ? fallback : 0;
            redisTemplate.opsForValue().set(key, String.valueOf(resolved), COUNT_CACHE_TTL);
            return resolved;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            Integer resolved = fallback != null ? fallback : 0;
            redisTemplate.opsForValue().set(key, String.valueOf(resolved), COUNT_CACHE_TTL);
            return resolved;
        }
    }

    private void touchCountKey(String key) {
        redisTemplate.expire(key, COUNT_CACHE_TTL);
    }

    private String likeCountKey(Long momentId) {
        return "moment:" + momentId + ":likeCount";
    }

    private String favoriteCountKey(Long momentId) {
        return "moment:" + momentId + ":favoriteCount";
    }

    private String commentCountKey(Long momentId) {
        return "moment:" + momentId + ":commentCount";
    }

    private MomentCommentResponse toCommentResponse(MomentComment comment) {
        MomentCommentResponse response = new MomentCommentResponse();
        response.setId(comment.getId());
        response.setMomentId(comment.getMomentId());
        response.setUserId(comment.getUserId());
        response.setParentId(comment.getParentId());
        response.setReplyToId(comment.getReplyToId());
        response.setContent(comment.getContent());
        response.setStatus(comment.getStatus());
        response.setCreatedAt(comment.getCreatedAt());
        response.setUpdatedAt(comment.getUpdatedAt());
        return response;
    }

    private Moment requireActiveMoment(Long momentId) {
        Moment moment = getOne(new QueryWrapper<Moment>()
                .eq("id", momentId)
                .isNull("deleted_at")
                .ne("status", 3));
        if (moment == null) {
            throw new RuntimeException("Moment not found");
        }
        return moment;
    }


    private MomentMediaResponse toMediaResponse(MomentMedia media) {
        MomentMediaResponse response = new MomentMediaResponse();
        response.setId(media.getId());
        response.setMediaType(media.getMediaType());
        response.setMediaUrl(media.getMediaUrl());
        response.setSortNo(media.getSortNo());
        return response;
    }
}
