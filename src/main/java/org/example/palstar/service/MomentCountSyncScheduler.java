package org.example.palstar.service;

import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import org.example.palstar.entity.Moment;
import org.example.palstar.mapper.MomentMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class MomentCountSyncScheduler {

    private static final String LIKE_KEY_PATTERN = "moment:*:likeCount";
    private static final String FAVORITE_KEY_PATTERN = "moment:*:favoriteCount";
    private static final String COMMENT_KEY_PATTERN = "moment:*:commentCount";

    @Autowired
    private StringRedisTemplate redisTemplate;

    @Autowired
    private MomentMapper momentMapper;

    @Scheduled(cron = "0 */10 * * * ?")
    public void syncMomentCounts() {
        Map<Long, CountBundle> counts = new HashMap<>();
        collectCounts(counts, LIKE_KEY_PATTERN, "like");
        collectCounts(counts, FAVORITE_KEY_PATTERN, "favorite");
        collectCounts(counts, COMMENT_KEY_PATTERN, "comment");

        for (Map.Entry<Long, CountBundle> entry : counts.entrySet()) {
            Long momentId = entry.getKey();
            CountBundle bundle = entry.getValue();
            Moment moment = momentMapper.selectById(momentId);
            if (moment == null) {
                continue;
            }
            UpdateWrapper<Moment> update = new UpdateWrapper<Moment>().eq("id", momentId);
            boolean hasUpdate = false;
            if (bundle.likeCount != null) {
                update.set("like_count", bundle.likeCount);
                hasUpdate = true;
            }
            if (bundle.favoriteCount != null) {
                update.set("favorite_count", bundle.favoriteCount);
                hasUpdate = true;
            }
            if (bundle.commentCount != null) {
                update.set("comment_count", bundle.commentCount);
                hasUpdate = true;
            }
            BigDecimal hotScore = calculateHotScore(moment, bundle);
            if (hotScore != null) {
                update.set("hot_score", hotScore);
                hasUpdate = true;
            }
            if (hasUpdate) {
                momentMapper.update(null, update);
            }
        }
    }

    private void collectCounts(Map<Long, CountBundle> counts, String pattern, String type) {
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys == null || keys.isEmpty()) {
            return;
        }
        for (String key : keys) {
            Long momentId = parseMomentId(key);
            if (momentId == null) {
                continue;
            }
            String value = redisTemplate.opsForValue().get(key);
            Integer count = parseCount(value);
            CountBundle bundle = counts.computeIfAbsent(momentId, id -> new CountBundle());
            if ("like".equals(type)) {
                bundle.likeCount = count;
            } else if ("favorite".equals(type)) {
                bundle.favoriteCount = count;
            } else if ("comment".equals(type)) {
                bundle.commentCount = count;
            }
        }
    }

    private Long parseMomentId(String key) {
        String[] parts = key.split(":");
        if (parts.length < 3) {
            return null;
        }
        try {
            return Long.parseLong(parts[1]);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer parseCount(String value) {
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private BigDecimal calculateHotScore(Moment moment, CountBundle bundle) {
        int likeCount = bundle.likeCount != null ? bundle.likeCount : safeInt(moment.getLikeCount());
        int favoriteCount = bundle.favoriteCount != null ? bundle.favoriteCount : safeInt(moment.getFavoriteCount());
        int commentCount = bundle.commentCount != null ? bundle.commentCount : safeInt(moment.getCommentCount());
        LocalDateTime createdAt = moment.getCreatedAt();
        long hours = 0;
        if (createdAt != null) {
            hours = Math.max(0, Duration.between(createdAt, LocalDateTime.now()).toHours());
        }
        double base = likeCount + favoriteCount * 2.0 + commentCount * 3.0;
        double score = base / Math.pow(hours + 2.0, 1.5);
        return BigDecimal.valueOf(score);
    }

    private int safeInt(Integer value) {
        return value != null ? value : 0;
    }

    private static class CountBundle {
        private Integer likeCount;
        private Integer favoriteCount;
        private Integer commentCount;
    }
}
