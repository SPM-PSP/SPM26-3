import { 
  request, 
  getPalList,
  getPalApplications,
  reviewPalApplication, 
  cancelPalApplication,
  getOtherUserProfile 
} from '../../utils/request.js';

Page({
  data: {
    currentTab: 0,
    isLoading: false,
    showDropdown: false, // 控制下拉菜单显示
    selectedPostName: '全部活动', // 下拉框显示的文本
    filterPostId: '', // 当前筛选的帖子ID
    sentList: [],     
    receivedList: [], 
    myPosts: [],      
    myId: ''
  },

  onLoad(options) {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ myId: userInfo.id });
    }
    if (options.currentTab) {
      this.setData({ currentTab: parseInt(options.currentTab) });
    }
    if (options.postId) {
      this.setData({ filterPostId: options.postId });
    }
  },

  onShow() {
    this.initPage();
  },

  async initPage() {
    await this.fetchMyPosts(); // 预加载我的帖子，用于下拉列表
    this.fetchData();
  },

  // 1. 获取我发布的帖子（作为下拉菜单的数据源）
  async fetchMyPosts() {
    try {
      const res = await getPalList({ authorId: this.data.myId });
      if (res.code === 200) {
        this.setData({ myPosts: res.data || [] });
        // 如果是从详情页跳过来有 filterPostId，更新一下显示的名称
        if (this.data.filterPostId) {
          const post = res.data.find(p => p.id == this.data.filterPostId);
          if (post) this.setData({ selectedPostName: post.title });
        }
      }
    } catch (e) { console.error(e); }
  },

  // 2. 下拉菜单控制
  toggleDropdown() {
    this.setData({ showDropdown: !this.data.showDropdown });
  },

  // 3. 执行筛选
  onSelectFilter(e) {
    const { id, name } = e.currentTarget.dataset;
    this.setData({ 
      filterPostId: id,
      selectedPostName: name || '全部活动',
      showDropdown: false,
      receivedList: [] 
    }, () => {
      this.fetchData();
    });
  },

  /**
   * 4. 核心：加载申请列表
   */
  async fetchData() {
    if (this.data.isLoading) return;
    this.setData({ isLoading: true });
    wx.showLoading({ title: '同步星球信号...' });

    try {
      if (this.data.currentTab === 1) {
        // --- 【收到的申请】逻辑 ---
        let allApps = [];
        if (this.data.filterPostId) {
          const res = await getPalApplications(this.data.filterPostId);
          allApps = (res.data || []).map(app => ({ ...app, postTitle: this.data.selectedPostName }));
        } else {
          // 循环获取我所有帖子的申请
          const appPromises = this.data.myPosts.map(async (post) => {
            try {
              const res = await getPalApplications(post.id);
              return (res.data || []).map(app => ({ ...app, postTitle: post.title }));
            } catch (e) { return []; }
          });
          allApps = (await Promise.all(appPromises)).flat();
        }
        
        // 补全申请人头像昵称
        const fullApps = await Promise.all(allApps.map(async (app) => {
          try {
            const userRes = await getOtherUserProfile(app.applicantId);
            return { ...app, userName: userRes.data.nickname, userAvatar: userRes.data.avatarUrl };
          } catch (e) { return app; }
        }));
        this.setData({ receivedList: this.formatList(fullApps) });

      } else {
        // --- 【发出的申请】逻辑 ---
        // 临时方案：遍历所有帖子寻找我的申请（正式环境建议后端加接口）
        const allPostsRes = await getPalList();
        const allPosts = allPostsRes.data || [];
        const mySentPromises = allPosts.map(async (post) => {
          try {
            const appRes = await getPalApplications(post.id);
            return (appRes.data || []).filter(app => app.applicantId == this.data.myId)
                                      .map(app => ({ ...app, postTitle: post.title, authorId: post.authorId }));
          } catch (e) { return []; }
        });
        const mySentApps = (await Promise.all(mySentPromises)).flat();

        // 补全作者信息
        const fullSentApps = await Promise.all(mySentApps.map(async (app) => {
          try {
            const userRes = await getOtherUserProfile(app.authorId);
            return { ...app, targetName: userRes.data.nickname, targetAvatar: userRes.data.avatarUrl };
          } catch (e) { return app; }
        }));
        this.setData({ sentList: this.formatList(fullSentApps) });
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.setData({ isLoading: false });
      wx.hideLoading();
      wx.stopPullDownRefresh();
    }
  },

  formatList(list) {
    const statusMap = {
      0: { text: '等待回复', class: 'pending' },
      1: { text: '已通过', class: 'accepted' },
      2: { text: '已拒绝', class: 'rejected' },
      3: { text: '已取消', class: 'rejected' }
    };
    return list.map(item => ({
      ...item,
      userName: item.userName || '星球校友',
      userAvatar: item.userAvatar || '/images/default-avatar.png',
      targetName: item.targetName || '发起人',
      targetAvatar: item.targetAvatar || '/images/default-avatar.png',
      time: this.formatTime(item.createdAt),
      statusText: statusMap[item.status]?.text || '未知',
      statusClass: statusMap[item.status]?.class || 'pending'
    }));
  },

  formatTime(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr.replace(/-/g, '/').replace('T', ' '));
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes() < 10 ? '0'+d.getMinutes() : d.getMinutes()}`;
  },

  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({ currentTab: index, showDropdown: false }, () => this.fetchData());
  },

  async handleApply(e) {
    const { id, postid, type } = e.currentTarget.dataset;
    const status = type === 'accept' ? 1 : 2;
    try {
      await reviewPalApplication(postid, id, { status, rejectReason: null });
      wx.showToast({ title: '处理成功', icon: 'success' });
      this.fetchData();
    } catch (err) {}
  },

  async cancelApply(e) {
    const { id, postid } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认撤回',
      content: '确定要取消申请吗？',
      success: async (res) => {
        if (res.confirm) {
          await cancelPalApplication(postid, id);
          this.fetchData();
        }
      }
    });
  },

  goChat() { wx.switchTab({ url: '/pages/message/message' }); },
  onPullDownRefresh() { this.fetchData(); }
});