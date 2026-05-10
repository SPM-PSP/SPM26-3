package org.example.palstar.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import java.time.LocalDateTime;
import java.util.List;
import org.example.palstar.entity.User;
import org.example.palstar.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class UserCancellationScheduler {

    @Autowired
    private IUserService userService;

    @Autowired
    private UserMapper userMapper;

    @Scheduled(cron = "0 0 3 * * ?")
    public void processExpiredCancellations() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(15);
        List<User> candidates = userMapper.selectList(new QueryWrapper<User>()
                .eq("status", 3)
                .isNotNull("delete_apply_at")
                .isNull("deleted_at")
                .le("delete_apply_at", cutoff));
        if (candidates == null || candidates.isEmpty()) {
            return;
        }
        for (User user : candidates) {
            userService.processUserCancellation(user.getId());
        }
    }
}
