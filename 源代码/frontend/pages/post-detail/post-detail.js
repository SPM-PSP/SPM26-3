import {
  getPalDetail,
  applyPal,
  getOtherUserProfile,
  request
} from '../../utils/request.js';

Page({
  data: {
    postId: '',
    isJoined: false,
    isMine: false,
    hasApplied: false,
    groupId: '',
    postInfo: {
      userAvatar: '',
      userName: '加载中...',
      title: '',
      desc: '',
      location: '',
      time: '',
      tags: [],
      participants: '0/0',
      isCertified: false,
      avatarColor: 'purple-bg',
      creditScore: '5.0',
      // 新增图片相关字段
      imageUrls: [], 
      coverImage: ''
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ postId: options.id });
      this.fetchFullDetail(options.id);
    }
  },

  // 拦截点击，防止冒泡触发背景返回逻辑
  stopBubbling() {},

  async fetchFullDetail(postId) {
    wx.showLoading({ title: '加载中...' });
    try {
      const postRes = await getPalDetail(postId);
      const postData = postRes.data;

      const profileRes = await request({ url: '/api/v1/user/profile' });
      const myProfile = profileRes.data || {};
      const myId = myProfile.id ? String(myProfile.id) : '';
      const authorId = postData.authorId ? String(postData.authorId) : '';
      const isMine = myId === authorId;

      const authorRes = await getOtherUserProfile(postData.authorId);
      const authorData = authorRes.data;

      let joinedGroup = null;
      if (!isMine) {
        try {
          const groupRes = await request({ url: '/api/v1/users/me/groups' });
          const myGroups = groupRes.data || [];
          joinedGroup = myGroups.find(g => String(g.postId) === String(postId));
        } catch (e) { console.log('获取群聊失败', e); }
      }

      let hasApplied = false;
      if (!isMine && !joinedGroup) {
        try {
          const appRes = await request({ url: `/api/v1/post/${postId}/applications` });
          const applications = appRes.data || [];
          const myApplication = applications.find(item => String(item.applicantId) === myId);
          if (myApplication && (myApplication.status === 0 || myApplication.status === 1)) {
            hasApplied = true;
          }
        } catch (e) { console.log('获取申请状态失败', e); }
      }

      this.setData({
        isMine,
        isJoined: !!joinedGroup,
        hasApplied,
        groupId: joinedGroup ? joinedGroup.id : '',
        postInfo: {
          userAvatar: authorData.avatarUrl,
          userName: authorData.nickname || `用户${postData.authorId}`,
          title: postData.title,
          desc: postData.content,
          location: postData.location,
          time: this.formatDate(postData.startTime),
          tags: (postData.interestRequirements && postData.interestRequirements.length > 0) 
                ? postData.interestRequirements : ['不限兴趣'],
          participants: `${postData.currentCount}/${postData.expectedCount}`,
          isCertified: authorData.verifyStatus === 2,
          creditScore: authorData.verifyStatus === 2 ? '4.9' : '5.0',
          avatarColor: this.getAvatarColor(postData.scene),
          // 映射图片数据
          imageUrls: postData.imageUrls || [],
          coverImage: postData.coverImage || ''
        }
      });
    } catch (err) {
      console.error("加载详情失败:", err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  // 图片预览功能
  previewImage(e) {
    const current = e.currentTarget.dataset.src;
    const urls = this.data.postInfo.imageUrls.length > 0 
                 ? this.data.postInfo.imageUrls 
                 : [this.data.postInfo.coverImage];
    wx.previewImage({
      current: current,
      urls: urls
    });
  },

  handleEdit() {
    wx.navigateTo({ url: `/pages/editPal/editPal?id=${this.data.postId}` });
  },

  handleViewApplications() {
    wx.navigateTo({ url: `/pages/myApplications/myApplications?currentTab=1&postId=${this.data.postId}` });
  },

  async handleApply() {
    wx.showModal({
      title: '申请留言',
      placeholderText: '简单介绍一下自己吧...',
      editable: true,
      confirmColor: '#7c3aed',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '发送中' });
          try {
            await applyPal(this.data.postId, { message: res.content || '我想加入！' });
            wx.showToast({ title: '申请已发送', icon: 'success' });
            this.setData({ hasApplied: true });
          } catch (err) {
            wx.showToast({ title: '申请失败', icon: 'none' });
          }
        }
      }
    });
  },

  handleEnterChat() {
    if (!this.data.groupId) {
      wx.showToast({ title: '群聊不存在', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/pages/chatRoom/chatRoom?groupId=${this.data.groupId}&name=${this.data.postInfo.title}`
    });
  },

  formatDate(dateStr) {
    if (!dateStr) return "待定";
    const d = new Date(dateStr.replace(/-/g, '/').replace('T', ' '));
    return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours()}:${d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()}`;
  },

  getAvatarColor(scene) {
    const colors = { travel: 'purple-bg', food: 'orange-bg', study: 'blue-bg', sports: 'blue-bg' };
    return colors[scene] || 'purple-bg';
  },

  goBack() {
    wx.navigateBack({ fail: () => { wx.switchTab({ url: '/pages/home/home' }); } });
  }
});