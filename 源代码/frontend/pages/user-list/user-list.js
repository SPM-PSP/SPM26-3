// pages/user-list/user-list.js
import { getFollowers, getFollowing, searchUsers } from "../../utils/request.js";

Page({
  data: {
    type: '',        // followers, following, search
    title: '',
    userId: null,
    keyword: '',
    list: [],
    loading: true,
    hasMore: true,
    page: 1
  },

  onLoad(options) {
    const { type, userId, title, keyword } = options;
    this.setData({ 
      type, 
      userId: userId ? parseInt(userId) : null,
      title: title || (type === 'followers' ? '粉丝列表' : (type === 'following' ? '关注列表' : '搜索结果')),
      keyword: keyword || ''
    });
    this.loadList();
  },

  async loadList(isRefresh = false) {
    if (isRefresh) {
      this.setData({ page: 1, hasMore: true });
    }
    
    if (!this.data.hasMore && !isRefresh) return;
    
    this.setData({ loading: true });

    try {
      const { type, userId, keyword, page } = this.data;
      let result = null;
      
      if (type === 'followers') {
        result = await getFollowers(userId);
      } else if (type === 'following') {
        result = await getFollowing(userId);
      } else if (type === 'search') {
        result = await searchUsers(keyword);
      }
      
      if (result && result.code === 200) {
        let newList = result.data || [];
        this.processList(newList, isRefresh);
      } else {
        this.processList([], isRefresh);
      }
    } catch (err) {
      console.error('加载列表失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.processList([], isRefresh);
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  processList(newList, isRefresh) {
    const safeList = Array.isArray(newList) ? newList : [];
    
    let updatedList = [];
    if (isRefresh) {
      updatedList = safeList;
    } else {
      updatedList = [...this.data.list, ...safeList];
    }
    
    this.setData({
      list: updatedList,
      hasMore: safeList.length >= 20,
      page: this.data.page + 1
    });
  },

  // 查看用户主页
  goToProfile(e) {
    const userId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/otherProfile/otherProfile?id=${userId}`
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  onPullDownRefresh() {
    this.loadList(true);
  },

  onReachBottom() {
    this.loadMore();
  },

  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadList();
    }
  }
});