package org.example.palstar.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.UpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.palstar.dto.LoginResponse;
import org.example.palstar.dto.UserFollowResponse;
import org.example.palstar.dto.UserProfileUpdateRequest;
import org.example.palstar.dto.UserPublicProfileResponse;
import org.example.palstar.dto.WechatLoginRequest;
import org.example.palstar.entity.Moment;
import org.example.palstar.entity.MomentComment;
import org.example.palstar.entity.MomentFavorite;
import org.example.palstar.entity.MomentLike;
import org.example.palstar.entity.PalApplication;
import org.example.palstar.entity.PalPost;
import org.example.palstar.entity.UserFollow;
import org.example.palstar.entity.User;
import org.example.palstar.mapper.MomentCommentMapper;
import org.example.palstar.mapper.MomentFavoriteMapper;
import org.example.palstar.mapper.MomentLikeMapper;
import org.example.palstar.mapper.MomentMapper;
import org.example.palstar.mapper.PalApplicationMapper;
import org.example.palstar.mapper.PalPostMapper;
import org.example.palstar.mapper.UserFollowMapper;
import org.example.palstar.mapper.UserMapper;
import org.example.palstar.service.IUserService;
import org.example.palstar.service.WechatApiService;
import org.example.palstar.utils.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements IUserService {

    @Autowired
    private WechatApiService wechatApiService;

    @Autowired
    private UserFollowMapper userFollowMapper;

    @Autowired
    private PalPostMapper palPostMapper;

    @Autowired
    private PalApplicationMapper palApplicationMapper;

    @Autowired
    private MomentMapper momentMapper;

    @Autowired
    private MomentCommentMapper momentCommentMapper;

    @Autowired
    private MomentLikeMapper momentLikeMapper;

    @Autowired
    private MomentFavoriteMapper momentFavoriteMapper;

    @Override
    public User findByOpenid(String openid) {
        return getOne(new QueryWrapper<User>().eq("openid", openid));
    }

    @Override
    public LoginResponse loginOrRegister(WechatLoginRequest request) throws IOException {
        //System.out.println("Received WeChat login request: " + request);
        String openid = wechatApiService.getOpenid(request.getCode());

        User user = findByOpenid(openid);
        boolean isNewUser = (user == null);

        if (isNewUser) {
            user = new User();
            user.setId(System.currentTimeMillis()); // Use a better ID generation strategy in production
            user.setOpenid(openid);
            user.setNickname(request.getNickname());
            user.setAvatarUrl(request.getAvatarUrl());
            user.setVerifyStatus(0);
            user.setStatus(1);
            user.setCreatedAt(LocalDateTime.now());
            user.setUpdatedAt(LocalDateTime.now());
            save(user);
        } else {
            reactivateIfNeeded(user, request);
        }

        String token = JwtUtil.generateToken(user.getId());

        LoginResponse.UserInfo userInfo = new LoginResponse.UserInfo(
                user.getId(),
                user.getNickname(),
                user.getAvatarUrl(),
                user.getVerifyStatus()
        );

        return new LoginResponse(token, isNewUser, userInfo);
    }

    @Override
    public User updateUserProfile(Long userId, UserProfileUpdateRequest request) {
        User user = getById(userId);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        // 只有当请求中的值不为null时才更新，允许部分更新
        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isEmpty()) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getBio() != null) {
            user.setBio(request.getBio());
        }
        if (request.getGrade() != null) {
            user.setGrade(request.getGrade());
        }
        if (request.getSchool() != null) {
            user.setSchool(request.getSchool());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getInterestTags() != null) {
            user.setInterestTags(request.getInterestTags());
        }
        user.setUpdatedAt(LocalDateTime.now());
        updateById(user);
        return user;
    }

    @Override
    public UserPublicProfileResponse getUserPublicProfile(Long viewerId, Long targetUserId) {
        User user = getById(targetUserId);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        int followerCount = Math.toIntExact(userFollowMapper.selectCount(new QueryWrapper<UserFollow>()
            .eq("following_id", targetUserId)
            .eq("status", 0)));
        int followingCount = Math.toIntExact(userFollowMapper.selectCount(new QueryWrapper<UserFollow>()
            .eq("follower_id", targetUserId)
            .eq("status", 0)));
        boolean isFollow = false;
        if (viewerId != null && !viewerId.equals(targetUserId)) {
            isFollow = userFollowMapper.selectCount(new QueryWrapper<UserFollow>()
                    .eq("follower_id", viewerId)
                    .eq("following_id", targetUserId)
                    .eq("status", 0)) > 0;
        }

        UserPublicProfileResponse response = new UserPublicProfileResponse();
        response.setId(user.getId());
        response.setNickname(user.getNickname());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setBio(user.getBio());
        response.setSchool(user.getSchool());
        response.setGrade(user.getGrade());
        response.setGender(user.getGender());
        response.setInterestTags(user.getInterestTags());
        response.setVerifyStatus(user.getVerifyStatus());
        response.setIsFollow(isFollow);
        response.setFollowerCount(followerCount);
        response.setFollowingCount(followingCount);
        return response;
    }

    @Override
    public void applyForCancellation(Long userId) {
        User user = getById(userId);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        user.setStatus(3); // 3-注销申请中
        user.setDeleteApplyAt(LocalDateTime.now());
        updateById(user);
    }

    @Override
    public void revokeCancellation(Long userId) {
        User user = getById(userId);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        if (user.getStatus() == 3) {
            user.setStatus(1); // 1-正常
            user.setDeleteApplyAt(null);
            updateById(user);
        }
    }

    @Override
    public List<UserPublicProfileResponse> searchUsers(String keyword) {
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        queryWrapper.isNull("deleted_at").and(wrapper -> wrapper.like("nickname", keyword).or().like("id", keyword));
        List<User> users = list(queryWrapper);
        return users.stream().map(user -> {
            UserPublicProfileResponse response = new UserPublicProfileResponse();
            response.setId(user.getId());
            response.setNickname(user.getNickname());
            response.setAvatarUrl(user.getAvatarUrl());
            return response;
        }).collect(Collectors.toList());
    }

    @Override
    public List<UserPublicProfileResponse> getFollowers(Long userId) {
        return baseMapper.findFollowers(userId);
    }

    @Override
    public List<UserPublicProfileResponse> getFollowing(Long userId) {
        return baseMapper.findFollowing(userId);
    }

    @Override
    @Transactional
    public void processUserCancellation(Long userId) {
        User user = getById(userId);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        LocalDateTime now = LocalDateTime.now();

        palPostMapper.update(null, new UpdateWrapper<PalPost>()
                .eq("author_id", userId)
                .set("status", 3)
                .set("deleted_at", now)
                .set("updated_at", now));

        momentMapper.update(null, new UpdateWrapper<Moment>()
                .eq("author_id", userId)
                .set("status", 3)
                .set("deleted_at", now)
                .set("updated_at", now));

        momentCommentMapper.update(null, new UpdateWrapper<MomentComment>()
                .eq("user_id", userId)
                .set("status", 1)
                .set("updated_at", now));

        momentLikeMapper.delete(new QueryWrapper<MomentLike>().eq("user_id", userId));
        momentFavoriteMapper.delete(new QueryWrapper<MomentFavorite>().eq("user_id", userId));

        userFollowMapper.delete(new QueryWrapper<UserFollow>()
                .eq("follower_id", userId)
                .or()
                .eq("following_id", userId));

        palApplicationMapper.update(null, new UpdateWrapper<PalApplication>()
                .eq("applicant_id", userId)
                .eq("status", 0)
                .set("status", 3)
                .set("updated_at", now));

        user.setDeletedAt(now);
        user.setUpdatedAt(now);
        updateById(user);
    }

    @Override
    public UserFollowResponse followUser(Long userId, Long targetUserId) {
        if (userId.equals(targetUserId)) {
            throw new RuntimeException("Cannot follow yourself");
        }
        User target = getById(targetUserId);
        if (target == null) {
            throw new RuntimeException("User not found");
        }
        UserFollow existing = userFollowMapper.selectOne(new QueryWrapper<UserFollow>()
                .eq("follower_id", userId)
                .eq("following_id", targetUserId));
        LocalDateTime now = LocalDateTime.now();
        if (existing != null) {
            if (existing.getStatus() != null && existing.getStatus() == 0) {
                throw new RuntimeException("Already followed");
            }
            existing.setStatus(0);
            existing.setUpdatedAt(now);
            userFollowMapper.updateById(existing);
            return toFollowResponse(existing);
        }
        UserFollow follow = new UserFollow();
        follow.setFollowerId(userId);
        follow.setFollowingId(targetUserId);
        follow.setStatus(0);
        follow.setCreatedAt(now);
        follow.setUpdatedAt(now);
        userFollowMapper.insert(follow);
        return toFollowResponse(follow);
    }

    @Override
    public void unfollowUser(Long userId, Long targetUserId) {
        UserFollow existing = userFollowMapper.selectOne(new QueryWrapper<UserFollow>()
                .eq("follower_id", userId)
                .eq("following_id", targetUserId));
        if (existing == null || existing.getStatus() == null || existing.getStatus() != 0) {
            throw new RuntimeException("Follow not found");
        }
        existing.setStatus(1);
        existing.setUpdatedAt(LocalDateTime.now());
        userFollowMapper.updateById(existing);
    }

    private UserFollowResponse toFollowResponse(UserFollow follow) {
        UserFollowResponse response = new UserFollowResponse();
        response.setFollowerId(follow.getFollowerId());
        response.setFollowingId(follow.getFollowingId());
        response.setStatus(follow.getStatus());
        response.setCreatedAt(follow.getCreatedAt());
        return response;
    }

    private void reactivateIfNeeded(User user, WechatLoginRequest request) {
        boolean wasDeleted = user.getDeletedAt() != null;
        boolean wasPendingCancel = user.getStatus() != null && user.getStatus() == 3;
        if (!wasDeleted && !wasPendingCancel) {
            return;
        }
        user.setDeletedAt(null);
        user.setDeleteApplyAt(null);
        user.setStatus(1);
        if (request.getNickname() != null) {
            user.setNickname(request.getNickname());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }
        user.setUpdatedAt(LocalDateTime.now());
        updateById(user);
    }
}
