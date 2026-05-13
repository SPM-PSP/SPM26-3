package org.example.palstar.service;

import com.baomidou.mybatisplus.extension.service.IService;
import java.util.List;
import org.example.palstar.dto.GroupChatResponse;
import org.example.palstar.dto.GroupMessageResponse;
import org.example.palstar.dto.GroupMessageSendRequest;
import org.example.palstar.entity.GroupChat;

public interface IGroupChatService extends IService<GroupChat> {

    // I-G-001 申请通过后系统自动调用创建群聊
    Long createGroup(Long postId, Long ownerId, Long applicantId, String groupName);

    // I-G-002 发送群消息
    GroupMessageResponse sendMessage(Long groupId, Long senderId, GroupMessageSendRequest request);

    // I-G-003 查询我加入的群列表
    List<GroupChatResponse> listMyGroups(Long userId);

    // I-G-004 退群或解散群
    void leaveOrDissolve(Long groupId, Long userId);

    // 拉取历史消息（分页）
    List<GroupMessageResponse> listMessages(Long groupId, int page, int size);
}