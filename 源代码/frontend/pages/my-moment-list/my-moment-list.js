// pages/my-moments-list/my-moments-list.js
import { getMyLikedMoments, getMyFavoritedMoments, getMyComments } from "../../utils/request.js";

Page({
  data: {
    type: '',    // likes, favorites, comments
    title: '',
    list: [],
    loading: true
  },

  onLoad(options) {
    const { type, title } = options;
    this.setData({ 
      type, 
      title: title || (type === 'likes' ? '我点赞的' : (type === 'favorites' ? '我收藏的' : '我的评论'))
    });
    this.loadList();
  },

  async loadList() {
    this.setData({ loading: true });

    try {
      const { type } = this.data;
      let result = null;
      
      if (type === 'likes') {
        result = await getMyLikedMoments();
      } else if (type === 'favorites') {
        result = await getMyFavoritedMoments();
      } else if (type === 'comments') {
        result = await getMyComments();
      }
      
      if (result && result.code === 200) {
        this.setData({ list: result.data || [] });
      }
    } catch (err) {
      console.error('加载列表失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh();
    }
  },

  // 跳转动态详情
  goToMomentDetail(e) {
    const momentId = e.currentTarget.dataset.id;
    if (momentId) {
      wx.navigateTo({ url: `/pages/moment-detail/moment-detail?id=${momentId}` });
    }
  },

  // 查看用户主页
  goToProfile(e) {
    const userId = e.currentTarget.dataset.id;
    if (userId) {
      wx.navigateTo({ url: `/pages/otherProfile/otherProfile?id=${userId}` });
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  onPullDownRefresh() {
    this.loadList();
  }
});