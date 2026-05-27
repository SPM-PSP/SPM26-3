import {
  getUserProfile,
  getGroupMessages,
  getGroupMembers,
  sendGroupMessage,
  uploadImage
} from '../../utils/request.js';

Page({
  data: {
    chatType: 'group',
    chatId: '',

    selfInfo: {
      id: '',
      nickname: '',
      avatarUrl: ''
    },

    groupInfo: {
      id: '',
      postId: '',
      ownerId: '',
      name: '群聊',
      memberCount: 0,
      status: 0,
      createdAt: '',
      dissolvedAt: null
    },

    groupMembers: [],
    userProfileMap: {},
    pollTimer: null,
    inputContent: '',
    msgList: [],
    lastMsgId: '',
    showMediaPanel: false,
    sendingMedia: false
  },

  async onLoad(options) {
    const rawGroupId = options.groupId || options.id || '';
    const groupId = this.normalizeChatId(rawGroupId);
    const groupName = options.name ? decodeURIComponent(options.name) : '';
  
    if (!groupId) {
      wx.showToast({
        title: '缺少群聊ID',
        icon: 'none'
      });
      return;
    }
  
    this.setData({
      chatId: groupId,
      'groupInfo.id': groupId,
      'groupInfo.name': groupName || this.data.groupInfo.name
    });
  
    await this.loadSelfInfo();
    await this.loadGroupMembers();
    await this.loadGroupMessages();
    this.startPolling();
  },
  

  normalizeChatId(id) {
    if (!id) return '';

    const text = String(id);

    if (/^\d+$/.test(text)) {
      return text;
    }

    const match = text.match(/\d+/);

    return match ? String(Number(match[0])) : text;
  },

  async loadSelfInfo() {
    try {
      const res = await getUserProfile();
      const user = res.data || {};

      this.setData({
        selfInfo: {
          id: user.id || this.data.selfInfo.id,
          nickname: user.nickname || '我',
          avatarUrl: user.avatarUrl || this.data.selfInfo.avatarUrl
        }
      });
    } catch (err) {
      console.error('获取当前用户失败', err);
    }
  },

  async loadGroupMessages() {
    const groupId = this.data.groupInfo.id || this.data.chatId;

    if (!groupId) {
      wx.showToast({
        title: '群聊不存在',
        icon: 'none'
      });
      return;
    }

    try {
      wx.showLoading({
        title: '加载中'
      });

      const res = await getGroupMessages(groupId, {
        page: 1,
        size: 50
      });

      const list = res.data || [];
      const orderedList = [...list].sort((a, b) => {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

      const msgList = orderedList.map(item => this.normalizeGroupMsg(item));

      this.setMessageList(msgList);
    } catch (err) {
      console.error('获取群消息失败', err);

      wx.showToast({
        title: '消息加载失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  normalizeGroupMsg(item) {
    const sender = this.getGroupMember(item.senderId);
    return {
      msgId: item.id,
      groupId: item.groupId,
      senderId: item.senderId,
      receiverId: null,
      role: sender.role,
      nickname: sender.nickname,
      avatarUrl: sender.avatarUrl,
  
      content: item.content || '',
  
      msgType: item.msgType || 0,
  
      mediaUrl: item.mediaUrl || '',
  
      sendTime: this.formatTime(item.createdAt),
  
      status: item.status,
  
      createdAt: item.createdAt
    };
  },

  getGroupMember(userId) {
    const selfId = String(this.data.selfInfo.id);

    if (String(userId) === selfId) {
      const selfMember =
    this.data.userProfileMap[String(userId)];
      return {
        userId,
        nickname: this.data.selfInfo.nickname,
        avatarUrl: this.data.selfInfo.avatarUrl,
        role: selfMember?.role
      };
    }
    return this.data.userProfileMap[String(userId)] || {
      userId,
      nickname: `用户${userId}`,
      avatarUrl: '/images/default-avatar.png'
    };
  },

  setInput(e) {
    this.setData({
      inputContent: e.detail.value
    });
  },

  async sendMsg() {
    const content = this.data.inputContent.trim();
    const groupId = this.data.groupInfo.id || this.data.chatId;
    if (!content) {
      wx.showToast({
        title: '请输入消息',
        icon: 'none'
      });
      return;
    }
    if (!groupId) {
      wx.showToast({
        title: '缺少群聊ID',
        icon: 'none'
      });
      return;
    }
    try {
      const res = await sendGroupMessage(this.data.groupInfo.id || this.data.chatId, {
        msgType: 0,
        content,
        mediaUrl: null
      });

      const newMsg = this.normalizeGroupMsg(res.data || {});

      this.setMessageList([
        ...this.data.msgList,
        newMsg
      ]);

      this.setData({ inputContent: '' });
    } catch (err) {
      console.error('发送群消息失败', err);

      wx.showToast({
        title: '发送失败',
        icon: 'none'
      });
    }
  },
  async chooseAndSendImage() {
    if (this.data.sendingMedia) {
      return;
    }
  
    try {
      const res = await wx.chooseMedia({
        count: 9,
        mediaType: ['image'],
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      });
  
      const files = res.tempFiles || [];
  
      if (!files.length) {
        return;
      }
  
      this.setData({
        sendingMedia: true,
        showMediaPanel: false
      });
  
      for (const file of files) {
        wx.showLoading({
          title: '图片发送中'
        });
  
        const uploadRes = await uploadImage(
          file.tempFilePath
        );
  
        const imageUrl = this.getUploadUrl(uploadRes);
  
        if (!imageUrl) {
          continue;
        }
  
        const msgRes = await sendGroupMessage(
          this.data.chatId,
          {
            msgType: 1,
            content: '',
            mediaUrl: imageUrl
          }
        );
  
        const newMsg = this.normalizeGroupMsg(
          msgRes.data || {}
        );
  
        this.setMessageList([
          ...this.data.msgList,
          newMsg
        ]);
      }
  
    } catch (err) {
      console.error('发送图片失败', err);
  
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      });
  
    } finally {
      wx.hideLoading();
  
      this.setData({
        sendingMedia: false
      });
    }
  },
  async chooseAndSendVideo() {
    if (this.data.sendingMedia) {
      return;
    }
  
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['video'],
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        maxDuration: 60
      });
  
      const file = res.tempFiles?.[0];
  
      if (!file) {
        return;
      }
  
      this.setData({
        sendingMedia: true,
        showMediaPanel: false
      });
  
      wx.showLoading({
        title: '视频发送中'
      });
  
      const uploadRes = await uploadImage(
        file.tempFilePath
      );
  
      const videoUrl = this.getUploadUrl(uploadRes);
  
      if (!videoUrl) {
        wx.showToast({
          title: '视频上传失败',
          icon: 'none'
        });
  
        return;
      }
  
      const msgRes = await sendGroupMessage(
        this.data.chatId,
        {
          msgType: 3,
          content: '',
          mediaUrl: videoUrl
        }
      );
  
      const newMsg = this.normalizeGroupMsg(
        msgRes.data || {}
      );
  
      this.setMessageList([
        ...this.data.msgList,
        newMsg
      ]);
  
    } catch (err) {
      console.error('发送视频失败', err);
  
      wx.showToast({
        title: '发送失败',
        icon: 'none'
      });
  
    } finally {
      wx.hideLoading();
  
      this.setData({
        sendingMedia: false
      });
    }
  },
  setMessageList(list) {

    const msgList = this.addTimeVisible(list);
  
    const lastMsgId =
      msgList.length > 0
        ? `msg-${msgList[msgList.length - 1].msgId}`
        : '';
  
    this.setData({
      msgList,
      lastMsgId: ''
    }, () => {
  
      setTimeout(() => {
  
        this.setData({
          lastMsgId
        });
  
      }, 300);
  
    });
  
  },

  addTimeVisible(list) {
    return list.map((item, index) => {
  
      if (index === 0) {
        return {
          ...item,
          showTime: true
        };
      }
  
      const prev = list[index - 1];
  
      const currentTime =
        new Date(item.createdAt).getTime();
  
      const prevTime =
        new Date(prev.createdAt).getTime();
  
      return {
        ...item,
  
        showTime:
          currentTime - prevTime >= 5 * 60 * 1000
      };
    });
  },
  getUploadUrl(res) {
    const data = res.data;
  
    if (typeof data === 'string') {
      return data;
    }
  
    if (Array.isArray(data)) {
      return data[0] || '';
    }
  
    if (data && typeof data === 'object') {
      return (
        data.url ||
        data.fileUrl ||
        data.mediaUrl ||
        ''
      );
    }
  
    return '';
  },

  formatTime(dateTime) {
    if (!dateTime) return '';
  
    const date = new Date(dateTime);
  
    const month =
      date.getMonth() + 1;
  
    const day =
      date.getDate();
  
    const hours =
      String(date.getHours()).padStart(2, '0');
  
    const minutes =
      String(date.getMinutes()).padStart(2, '0');
  
    return `${month}/${day} ${hours}:${minutes}`;
  },

  goGroupDetail() {
    const { groupMembers } = this.data;
  
    const groupInfo = {
      ...this.data.groupInfo,
  
      memberCount: groupMembers.length
    };
  
    wx.setStorageSync(
      'current_group_info',
      groupInfo
    );
  
    wx.setStorageSync(
      'current_group_members',
      groupMembers
    );
  
    wx.navigateTo({
      url: '/pages/groupDetail/groupDetail'
    });
  },
  previewChatImage(e) {
    const current = e.currentTarget.dataset.url;
  
    const urls = this.data.msgList
      .filter(item => item.msgType === 1)
      .map(item => item.mediaUrl);
  
    wx.previewImage({
      current,
      urls
    });
  },
  toggleMediaPanel() {
    this.setData({
      showMediaPanel: !this.data.showMediaPanel
    });
  },
  previewVideo(e) {
    const url = e.currentTarget.dataset.url;
  
    if (!url) {
      return;
    }
  
    wx.previewMedia({
      sources: [
        {
          url,
          type: 'video'
        }
      ],
      current: 0
    });
  },
  closeMediaPanel() {
    if (this.data.showMediaPanel) {
      this.setData({
        showMediaPanel: false
      })
    }
  },
  
  noop() {},
  startPolling() {

    if (this.data.pollTimer) {
      clearInterval(this.data.pollTimer);
    }
  
    const timer = setInterval(async () => {
  
      try {
  
        const res = await getGroupMessages(
          this.data.chatId,
          {
            page: 1,
            size: 50
          }
        );
  
        const list = res.data || [];
  
        const orderedList = [...list].sort((a, b) => {
          return new Date(a.createdAt).getTime()
            - new Date(b.createdAt).getTime();
        });
  
        const msgList = orderedList.map(item =>
          this.normalizeGroupMsg(item)
        );
  
        const oldLastId =
          this.data.msgList[
            this.data.msgList.length - 1
          ]?.msgId;

        const newLastId =
          msgList[
            msgList.length - 1
          ]?.msgId;

        if (oldLastId !== newLastId) {

          this.setMessageList(msgList);

        }
      } catch (err) {
        console.error('轮询失败', err);
      }
  
    }, 2000);
  
    this.setData({
      pollTimer: timer
    });
  },
  onUnload() {

    if (this.data.pollTimer) {
      clearInterval(this.data.pollTimer);
    }
  
  },
  async loadGroupMembers() {
    const groupId = this.data.chatId;
  
    if (!groupId) return;
  
    try {
  
      const res = await getGroupMembers(groupId);
  
      const members = res.data || [];
  
      const userProfileMap = {};
  
      let ownerId = '';
  
      members.forEach(item => {
  
        userProfileMap[String(item.userId)] = {
          userId: item.userId,
          nickname: item.nickname,
          avatarUrl: item.avatarUrl,
          role: item.role
        };
  
        // 群主 role = 2
        if (item.role === 2) {
          ownerId = item.userId;
        }
  
      });
  
      return new Promise(resolve => {
  
        this.setData({
  
          groupMembers: members,
  
          userProfileMap,
  
          'groupInfo.memberCount': members.length,
  
          'groupInfo.ownerId': ownerId
  
        }, resolve);
  
      });
  
    } catch (err) {
  
      console.error('获取群成员失败', err);
  
    }
  }
});
