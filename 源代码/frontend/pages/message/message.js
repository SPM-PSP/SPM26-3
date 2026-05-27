import { request } from '../../utils/request.js';

Page({
  data: {
    statusBarHeight: 20,
    searchKeyword: "",
    // 系统通知/申请消息状态
    systemNotice: {
      unreadCount: 0, 
      lastMsg: "查看收到的入伙申请",
      time: ""
    },
    // 会话列表
    chatList: [],
    allChats: [], // 备份用于搜索
    isLoading: false
  },

  onLoad() {
    const info = wx.getWindowInfo();
    this.setData({ statusBarHeight: info.statusBarHeight });
  },

  onShow() {
    if (this.getTabBar) this.getTabBar().setData({ selected: 3 });
    this.fetchChatData();
  },

  /**
   * 核心：获取群聊列表并尝试匹配最后一条消息
   */
  async fetchChatData() {
    if (this.data.isLoading) return;
    this.setData({ isLoading: true });

    try {
      // 1. 调用 I-G-003：获取我加入的群列表
      const res = await request({ url: '/api/v1/users/me/groups' });
      
      if (res.code === 200 && res.data) {
        const groups = res.data;
        
        // 2. 为每个群聊获取最后一条消息 (I-M-003)
        // 提示：实际生产环境建议后端在群列表接口直接返回最后一条消息
        const chatPromises = groups.map(async (group) => {
          const msgRes = await request({ 
            url: `/api/v1/groups/${group.id}/messages`,
            data: { page: 1, size: 1 } 
          });
          
          let lastMsgContent = "暂无消息";
          let lastTime = group.createdAt;

          if (msgRes.data && msgRes.data.length > 0) {
            const topMsg = msgRes.data[0];
            lastMsgContent = topMsg.msgType === 0 ? topMsg.content : "[图片/媒体]";
            lastTime = topMsg.createdAt;
          }

          return {
            id: group.id,
            type: "group",
            name: group.name,
            avatar: this.getIconByGroupName(group.name),
            avatarBg: this.getBgByGroupName(group.name),
            lastMsg: lastMsgContent,
            time: this.formatTime(lastTime),
            _rawTime: new Date(lastTime).getTime(), // 用于排序
            unread: 0, // 暂无未读数接口，预留
            tag: group.memberCount + "人"
          };
        });

        const chatList = await Promise.all(chatPromises);
        
        // 3. 按时间倒序排序
        chatList.sort((a, b) => b._rawTime - a._rawTime);

        this.setData({
          chatList: chatList,
          allChats: chatList
        });
      }
    } catch (err) {
      console.error("加载消息失败", err);
    } finally {
      this.setData({ isLoading: false });
      wx.stopPullDownRefresh();
    }
  },

  // 根据群名包含的关键字分配图标
  getIconByGroupName(name) {
    if (name.includes('travel') || name.includes('旅行')) return "✈️";
    if (name.includes('food') || name.includes('干饭')) return "🍜";
    if (name.includes('study') || name.includes('学习')) return "📚";
    if (name.includes('sport') || name.includes('运动')) return "⚽";
    return "🌟";
  },

  getBgByGroupName(name) {
    if (name.includes('travel')) return "#e3f7ff";
    if (name.includes('food')) return "#fff2e8";
    if (name.includes('study')) return "#e8f9e8";
    return "#f0edff";
  },

  // 时间格式化：今天显示时分，往日显示月日
  formatTime(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr.replace(/-/g, '/').replace('T', ' '));
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return `${date.getHours()}:${date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  },

  // 跳转聊天室
  apiGoToChat(e) {
    const { id, type, name } = e.currentTarget.dataset;
  
    const rawId = String(id || '')
      .replace(/^group_/, '')
      .replace(/^user_/, '');
  
    const chatId = Number(rawId);
  
    wx.navigateTo({
      url: `/pages/chatRoom/chatRoom?groupId=${chatId}&type=${type}&name=${encodeURIComponent(name || '群聊')}`
    });
  },
  
  // 跳转申请管理
  apiGoToNotification() {
    wx.navigateTo({ url: '/pages/myApplications/myApplications?currentTab=1' });
  },

  // 搜索过滤
  onSearchInput(e) {
    const val = e.detail.value.toLowerCase();
    if (!val) {
      this.setData({ chatList: this.data.allChats });
      return;
    }
    const filtered = this.data.allChats.filter(item => 
      item.name.toLowerCase().includes(val) || item.lastMsg.toLowerCase().includes(val)
    );
    this.setData({ chatList: filtered });
  },

  onPullDownRefresh() {
    this.fetchChatData();
  }
});