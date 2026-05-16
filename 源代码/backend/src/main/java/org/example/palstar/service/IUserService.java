package org.example.palstar.service;

import com.baomidou.mybatisplus.extension.service.IService;
import org.example.palstar.dto.LoginResponse;
import org.example.palstar.dto.UserFollowResponse;
import org.example.palstar.dto.UserProfileUpdateRequest;
import org.example.palstar.dto.UserPublicProfileResponse;
import org.example.palstar.dto.WechatLoginRequest;
import org.example.palstar.entity.User;

import java.io.IOException;
import java.util.List;

public interface IUserService extends IService<User> {
    User findByOpenid(String openid);

    LoginResponse loginOrRegister(WechatLoginRequest request) throws IOException;

    User updateUserProfile(Long userId, UserProfileUpdateRequest request);

    UserPublicProfileResponse getUserPublicProfile(Long viewerId, Long targetUserId);

    void applyForCancellation(Long userId);

    void revokeCancellation(Long userId);

    UserFollowResponse followUser(Long followerId, Long followingId);

    void unfollowUser(Long followerId, Long followingId);

    List<UserPublicProfileResponse> searchUsers(String keyword);

    List<UserPublicProfileResponse> getFollowers(Long userId);

    List<UserPublicProfileResponse> getFollowing(Long userId);

    void processUserCancellation(Long userId);
}
