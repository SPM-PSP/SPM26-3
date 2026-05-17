package org.example.palstar.service;

import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
import org.example.palstar.dto.GroupChatResponse;
import org.example.palstar.dto.GroupMemberCountResponse;
import org.example.palstar.dto.GroupMemberResponse;
import org.example.palstar.dto.GroupMessageResponse;
import org.example.palstar.dto.GroupMessageSendRequest;
import org.example.palstar.entity.GroupChat;

public interface IGroupChatService extends IService<GroupChat> {

    // I-G-001 发帖时创建群聊，只加群主
    Long createGroup(Long postId, Long ownerId, String groupName);

    // 审批通过时，将新成员加入已有群聊
    void addMemberToGroup(Long postId, Long applicantId);

    // 修改群名（仅群主可操作）
    void updateGroupName(Long groupId, Long userId, String groupName);

    // 管理员或群主邀请成员加群
    void inviteMember(Long groupId, Long operatorId, Long invitedUserId);

    // I-G-002 发送群消息
    GroupMessageResponse sendMessage(Long groupId, Long senderId, GroupMessageSendRequest request);

    // I-G-003 查询我加入的群列表
    List<GroupChatResponse> listMyGroups(Long userId);

    // 查询某个群的成员列表（含头像昵称）
    List<GroupMemberResponse> listGroupMembers(Long groupId);

    // 查询某个群的成员数
    GroupMemberCountResponse getGroupMemberCount(Long groupId);

    // I-G-004 退群或解散群
    void leaveOrDissolve(Long groupId, Long userId);

    // 拉取历史消息（分页）
    List<GroupMessageResponse> listMessages(Long groupId,  Long userId, int page, int size);

    // 根据 postId 获取群聊
    GroupChat getGroupByPostId(Long postId);

    // 群主设置管理员
    void setAdmin(Long groupId, Long ownerId, Long targetUserId);
}
