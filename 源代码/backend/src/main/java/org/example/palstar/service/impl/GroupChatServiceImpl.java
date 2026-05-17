package org.example.palstar.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.example.palstar.dto.GroupChatResponse;
import org.example.palstar.dto.GroupMessageResponse;
import org.example.palstar.dto.GroupMessageSendRequest;
import org.example.palstar.dto.GroupMemberResponse;
import org.example.palstar.dto.GroupMemberCountResponse;
import org.example.palstar.entity.GroupChat;
import org.example.palstar.entity.GroupMember;
import org.example.palstar.entity.GroupMessage;
import org.example.palstar.entity.User;
import org.example.palstar.mapper.UserMapper;
import org.example.palstar.mapper.GroupChatMapper;
import org.example.palstar.mapper.GroupMemberMapper;
import org.example.palstar.mapper.GroupMessageMapper;
import org.example.palstar.service.IGroupChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GroupChatServiceImpl extends ServiceImpl<GroupChatMapper, GroupChat>
        implements IGroupChatService {

    @Autowired
    private GroupChatMapper groupChatMapper;

    @Autowired
    private GroupMemberMapper groupMemberMapper;

    @Autowired
    private GroupMessageMapper groupMessageMapper;

    @Autowired
    private UserMapper userMapper;

    // ——— I-G-001 发帖时创建群聊，只加群主 ———
    @Override
    @Transactional
    public Long createGroup(Long postId, Long ownerId, String groupName) {

        // 检查该帖子是否已有群聊，避免重复创建
        long exists = groupChatMapper.selectCount(
                new LambdaQueryWrapper<GroupChat>()
                        .eq(GroupChat::getPostId, postId)
        );
        if (exists > 0) {
            throw new RuntimeException("该帖子已存在群聊");
        }

        // 1. 创建群聊记录
        GroupChat group = new GroupChat();
        group.setPostId(postId);
        group.setOwnerId(ownerId);
        group.setName(groupName);
        group.setStatus(0);
        group.setCreatedAt(LocalDateTime.now());
        groupChatMapper.insert(group);

        Long groupId = group.getId();

        // 2. 只将群主加入（role=2群主，joinSource=2直接创建）
        addMember(groupId, ownerId, 2, 2);

        return groupId;
    }

    // ——— 审批通过时将申请人加入已有群聊 ———
    @Override
    @Transactional
    public void addMemberToGroup(Long postId, Long applicantId) {

        // 根据 postId 找到已有群聊
        GroupChat group = groupChatMapper.selectOne(
                new LambdaQueryWrapper<GroupChat>()
                        .eq(GroupChat::getPostId, postId)
                        .eq(GroupChat::getStatus, 0)
        );
        if (group == null) {
            throw new RuntimeException("群聊不存在或已解散");
        }

        // 检查是否已经是成员
        long alreadyMember = groupMemberMapper.selectCount(
                new LambdaQueryWrapper<GroupMember>()
                        .eq(GroupMember::getGroupId, group.getId())
                        .eq(GroupMember::getUserId, applicantId)
                        .isNull(GroupMember::getLeftAt)
        );
        if (alreadyMember > 0) {
            throw new RuntimeException("该用户已是群成员");
        }

        // 将申请人加入群（role=0普通成员，joinSource=0申请通过）
        addMember(group.getId(), applicantId, 0, 0);
    }

    //修改群名
    @Override
    public void updateGroupName(Long groupId, Long userId, String groupName) {

        GroupChat group = groupChatMapper.selectById(groupId);
        if (group == null || group.getStatus() == 1) {
            throw new RuntimeException("群聊不存在或已解散");
        }
        // 只有群主可以修改群名
        if (!group.getOwnerId().equals(userId)) {
            throw new RuntimeException("只有群主可以修改群名");
        }

        // 直接修改对象字段再更新
        group.setName(groupName);
        groupChatMapper.updateById(group);
    }

    //群主或管理员邀请群成员
    @Override
    @Transactional
    public void inviteMember(Long groupId, Long operatorId, Long invitedUserId) {

        GroupChat group = groupChatMapper.selectById(groupId);
        if (group == null || group.getStatus() == 1) {
            throw new RuntimeException("群聊不存在或已解散");
        }

        // 校验操作者是群主或管理员
        GroupMember operatorMember = groupMemberMapper.selectOne(
                new LambdaQueryWrapper<GroupMember>()
                        .eq(GroupMember::getGroupId, groupId)
                        .eq(GroupMember::getUserId, operatorId)
                        .isNull(GroupMember::getLeftAt)
        );
        if (operatorMember == null || operatorMember.getRole() == 0) {
            throw new RuntimeException("只有群主或管理员可以邀请成员");
        }

        // 检查被邀请者是否已是成员
        long alreadyMember = groupMemberMapper.selectCount(
                new LambdaQueryWrapper<GroupMember>()
                        .eq(GroupMember::getGroupId, groupId)
                        .eq(GroupMember::getUserId, invitedUserId)
                        .isNull(GroupMember::getLeftAt)
        );
        if (alreadyMember > 0) {
            throw new RuntimeException("该用户已是群成员");
        }

        // 加入群（role=0普通成员，joinSource=1被邀请）
        addMember(groupId, invitedUserId, 0, 1);
    }

    //群主设置管理员
    @Override
    @Transactional
    public void setAdmin(Long groupId, Long ownerId, Long targetUserId) {

        GroupChat group = groupChatMapper.selectById(groupId);
        if (group == null || group.getStatus() == 1) {
            throw new RuntimeException("群聊不存在或已解散");
        }

        // 只有群主可以设置管理员
        if (!group.getOwnerId().equals(ownerId)) {
            throw new RuntimeException("只有群主可以设置管理员");
        }

        // 查询目标用户是否在群里
        GroupMember targetMember = groupMemberMapper.selectOne(
                new LambdaQueryWrapper<GroupMember>()
                        .eq(GroupMember::getGroupId, groupId)
                        .eq(GroupMember::getUserId, targetUserId)
                        .isNull(GroupMember::getLeftAt)
        );
        if (targetMember == null) {
            throw new RuntimeException("该用户不是群成员");
        }
        if (targetMember.getRole() == 2) {
            throw new RuntimeException("不能修改群主的角色");
        }
        if (targetMember.getRole() == 1) {
            throw new RuntimeException("该用户已经是管理员");
        }

        // 设置为管理员 role=1
        groupMemberMapper.update(null,
                new LambdaUpdateWrapper<GroupMember>()
                        .eq(GroupMember::getGroupId, groupId)
                        .eq(GroupMember::getUserId, targetUserId)
                        .set(GroupMember::getRole, 1)
        );
    }

    // ——— I-G-002 发送群消息 ———
    @Override
    public GroupMessageResponse sendMessage(Long groupId, Long senderId,
                                            GroupMessageSendRequest request) {

        // 校验发送者是否为当前群成员
        long count = groupMemberMapper.selectCount(
                new LambdaQueryWrapper<GroupMember>()
                        .eq(GroupMember::getGroupId, groupId)
                        .eq(GroupMember::getUserId, senderId)
                        .isNull(GroupMember::getLeftAt)
        );
        if (count == 0) {
            throw new RuntimeException("你不是该群成员，无法发送消息");
        }

        GroupMessage msg = new GroupMessage();
        msg.setGroupId(groupId);
        msg.setSenderId(senderId);
        msg.setMsgType(request.getMsgType());
        msg.setContent(request.getContent());
        msg.setMediaUrl(request.getMediaUrl());
        msg.setStatus(0);
        msg.setCreatedAt(LocalDateTime.now());
        groupMessageMapper.insert(msg);

        return toMessageResponse(msg);
    }

    // ——— I-G-003 我的群列表 ———
    @Override
    public List<GroupChatResponse> listMyGroups(Long userId) {

        // 查我未退出的群成员记录
        List<GroupMember> myMembers = groupMemberMapper.selectList(
                new LambdaQueryWrapper<GroupMember>()
                        .eq(GroupMember::getUserId, userId)
                        .isNull(GroupMember::getLeftAt)
        );

        if (myMembers.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> groupIds = new ArrayList<>();
        for (GroupMember m : myMembers) {
            groupIds.add(m.getGroupId());
        }

        // 只查状态正常（0）的群
        List<GroupChat> groups = groupChatMapper.selectList(
                new LambdaQueryWrapper<GroupChat>()
                        .in(GroupChat::getId, groupIds)
                        .eq(GroupChat::getStatus, 0)
        );

        List<GroupChatResponse> result = new ArrayList<>();
        for (GroupChat g : groups) {
            long memberCount = groupMemberMapper.selectCount(
                    new LambdaQueryWrapper<GroupMember>()
                            .eq(GroupMember::getGroupId, g.getId())
                            .isNull(GroupMember::getLeftAt)
            );

            GroupChatResponse vo = new GroupChatResponse();
            vo.setId(g.getId());
            vo.setName(g.getName());
            vo.setPostId(g.getPostId());
            vo.setOwnerId(g.getOwnerId());
            vo.setMemberCount((int) memberCount);
            vo.setCreatedAt(g.getCreatedAt());
            result.add(vo);
        }

        return result;
    }

    // ——— 查询群成员列表 ———
    @Override
    public List<GroupMemberResponse> listGroupMembers(Long groupId) {

        // 判断群是否存在
        GroupChat group = groupChatMapper.selectById(groupId);
        if (group == null || group.getStatus() == 1) {
            throw new RuntimeException("群聊不存在或已解散");
        }

        List<GroupMember> members = groupMemberMapper.selectList(
                new LambdaQueryWrapper<GroupMember>()
                        .eq(GroupMember::getGroupId, groupId)
                        .isNull(GroupMember::getLeftAt)
        );

        List<GroupMemberResponse> result = new ArrayList<>();
        for (GroupMember m : members) {
            User user = userMapper.selectById(m.getUserId());
            GroupMemberResponse resp = new GroupMemberResponse();
            resp.setUserId(m.getUserId());
            resp.setNickname(user != null ? user.getNickname() : null);
            resp.setAvatarUrl(user != null ? user.getAvatarUrl() : null);
            resp.setRole(m.getRole());
            resp.setJoinSource(m.getJoinSource());
            resp.setJoinedAt(m.getJoinedAt());
            result.add(resp);
        }
        return result;
    }

    // ——— 查询群成员数 ———
    @Override
    public GroupMemberCountResponse getGroupMemberCount(Long groupId) {

        GroupChat group = groupChatMapper.selectById(groupId);
        if (group == null || group.getStatus() == 1) {
            throw new RuntimeException("群聊不存在或已解散");
        }

        long count = groupMemberMapper.selectCount(
                new LambdaQueryWrapper<GroupMember>()
                        .eq(GroupMember::getGroupId, groupId)
                        .isNull(GroupMember::getLeftAt)
        );

        GroupMemberCountResponse resp = new GroupMemberCountResponse();
        resp.setGroupId(groupId);
        resp.setMemberCount((int) count);
        return resp;
    }

    // ——— I-G-004 退群 / 解散 ———
    @Override
    @Transactional
    public void leaveOrDissolve(Long groupId, Long userId) {

        GroupChat group = groupChatMapper.selectById(groupId);
        if (group == null || group.getStatus() == 1) {
            throw new RuntimeException("群聊不存在或已解散");
        }

        if (group.getOwnerId().equals(userId)) {
            // 群主解散：status 设为 1
            groupChatMapper.update(null,
                    new LambdaUpdateWrapper<GroupChat>()
                            .eq(GroupChat::getId, groupId)
                            .set(GroupChat::getStatus, 1)
                            .set(GroupChat::getDissolvedAt, LocalDateTime.now())
            );
        } else {
            // 普通成员退群：记录退出时间
            groupMemberMapper.update(null,
                    new LambdaUpdateWrapper<GroupMember>()
                            .eq(GroupMember::getGroupId, groupId)
                            .eq(GroupMember::getUserId, userId)
                            .isNull(GroupMember::getLeftAt)
                            .set(GroupMember::getLeftAt, LocalDateTime.now())
            );
        }
    }

    // ——— 历史消息（分页） ———
    @Override
    public List<GroupMessageResponse> listMessages(Long groupId, Long userId, int page, int size) {

        // 校验群是否存在
        GroupChat group = groupChatMapper.selectById(groupId);
        if (group == null || group.getStatus() == 1) {
            throw new RuntimeException("群聊不存在或已解散");
        }

        // 校验当前用户是否是群成员且未退出
        long isMember = groupMemberMapper.selectCount(
                new LambdaQueryWrapper<GroupMember>()
                        .eq(GroupMember::getGroupId, groupId)
                        .eq(GroupMember::getUserId, userId)
                        .isNull(GroupMember::getLeftAt)
        );
        if (isMember == 0) {
            throw new RuntimeException("你不是该群成员，无法查看消息");
        }

        int offset = (page - 1) * size;
        List<GroupMessage> messages = groupMessageMapper.selectList(
                new LambdaQueryWrapper<GroupMessage>()
                        .eq(GroupMessage::getGroupId, groupId)
                        .eq(GroupMessage::getStatus, 0)
                        .orderByDesc(GroupMessage::getCreatedAt)
                        .last("LIMIT " + size + " OFFSET " + offset)
        );

        List<GroupMessageResponse> result = new ArrayList<>();
        for (GroupMessage m : messages) {
            result.add(toMessageResponse(m));
        }
        return result;
    }

    // ——— 私有辅助方法 ———

    private void addMember(Long groupId, Long userId, int role, int joinSource) {
        GroupMember member = new GroupMember();
        member.setGroupId(groupId);
        member.setUserId(userId);
        member.setRole(role);
        member.setJoinSource(joinSource);
        member.setJoinedAt(LocalDateTime.now());
        groupMemberMapper.insert(member);
    }

    private GroupMessageResponse toMessageResponse(GroupMessage m) {
        GroupMessageResponse resp = new GroupMessageResponse();
        resp.setId(m.getId());
        resp.setGroupId(m.getGroupId());
        resp.setSenderId(m.getSenderId());
        resp.setMsgType(m.getMsgType());
        resp.setContent(m.getContent());
        resp.setMediaUrl(m.getMediaUrl());
        resp.setCreatedAt(m.getCreatedAt());
        return resp;
    }

    @Override
    public GroupChat getGroupByPostId(Long postId) {
        return groupChatMapper.selectOne(
                new LambdaQueryWrapper<GroupChat>()
                        .eq(GroupChat::getPostId, postId)
                        .eq(GroupChat::getStatus, 0)
        );
    }
}

