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
import org.example.palstar.entity.GroupChat;
import org.example.palstar.entity.GroupMember;
import org.example.palstar.entity.GroupMessage;
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

    // ——— I-G-001 创建群聊 ———
    @Override
    @Transactional
    public Long createGroup(Long postId, Long ownerId, Long applicantId, String groupName) {

        // 1. 创建群聊记录，status=0 正常
        GroupChat group = new GroupChat();
        group.setPostId(postId);
        group.setOwnerId(ownerId);
        group.setName(groupName);
        group.setStatus(0);
        group.setCreatedAt(LocalDateTime.now());
        groupChatMapper.insert(group);

        Long groupId = group.getId();

        // 2. 将群主加入（role=2群主，joinSource=2直接创建）
        addMember(groupId, ownerId, 2, 2);

        // 3. 将申请人加入（role=0普通成员，joinSource=0申请通过）
        addMember(groupId, applicantId, 0, 0);

        return groupId;
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
    public List<GroupMessageResponse> listMessages(Long groupId, int page, int size) {

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
}
