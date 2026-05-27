// pages/my-moments/my-moments.js
import { getMomentList, likeDynamic, unlikeDynamic, favoriteDynamic, unfavoriteDynamic, deleteMoment } from "../../utils/request.js";

Page({
  data: {
    momentList: [],
    userInfo: {},
    loading: true,
    page: 1,
    hasMore: true
  },

  onLoad() {
    this.loadUserInfo();
    this.loadMoments();
  },

  onShow() {
    // 每次显示时刷新列表（比如从详情页返回）
    if (this.data.momentList.length > 0) {
      this.refreshMoments();
    }
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ userInfo });
  },

  // 加载我的动态
  async loadMoments(isRefresh = false) {
    if (isRefresh) {
      this.setData({ page: 1, hasMore: true });
    }
    
    if (!this.data.hasMore && !isRefresh) return;

    this.setData({ loading: true });

    try {
      const res = await getMomentList({ 
        authorId: this.data.userInfo.id,
        sort: 'latest',
        page: this.data.page,
        size: 10
      });

      if (res.code === 200) {
        let newList = res.data || [];
        
        if (isRefresh) {
          this.setData({ momentList: newList });
        } else {
          this.setData({ 
            momentList: [...this.data.momentList, ...newList]
          });
        }
        
        this.setData({ 
          hasMore: newList.length >= 10,
          page: this.data.page + 1
        });
      } else {
        console.error('获取动态失败:', res.message);
      }
    } catch (err) {
      console.error('加载动态失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  // 刷新
  async refreshMoments() {
    await this.loadMoments(true);
    wx.stopPullDownRefresh();
  },

  // 加载更多
  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMoments();
    }
  },

  // 点赞/取消点赞
  async toggleLike(e) {
    const momentId = e.currentTarget.dataset.id;
    const item = this.data.momentList.find(m => m.id === momentId);
    if (!item) return;

    const action = item.isLiked ? unlikeDynamic : likeDynamic;
    try {
      const res = await action(momentId);
      if (res.code === 200) {
        // 更新本地数据
        const newList = this.data.momentList.map(m => {
          if (m.id === momentId) {
            return {
              ...m,
              isLiked: !item.isLiked,
              likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1
            };
          }
          return m;
        });
        this.setData({ momentList: newList });
      }
    } catch (err) {
      console.error('操作失败:', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 收藏/取消收藏
  async toggleFavorite(e) {
    const momentId = e.currentTarget.dataset.id;
    const item = this.data.momentList.find(m => m.id === momentId);
    if (!item) return;

    const action = item.isFavorited ? unfavoriteDynamic : favoriteDynamic;
    try {
      const res = await action(momentId);
      if (res.code === 200) {
        const newList = this.data.momentList.map(m => {
          if (m.id === momentId) {
            return {
              ...m,
              isFavorited: !item.isFavorited,
              favoriteCount: item.isFavorited ? item.favoriteCount - 1 : item.favoriteCount + 1
            };
          }
          return m;
        });
        this.setData({ momentList: newList });
      }
    } catch (err) {
      console.error('操作失败:', err);
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 删除动态
  async deleteMoment(e) {
    const momentId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '提示',
      content: '确定删除这条动态吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await deleteMoment(momentId);
            if (result.code === 200) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              // 从列表中移除
              const newList = this.data.momentList.filter(m => m.id !== momentId);
              this.setData({ momentList: newList });
            } else {
              wx.showToast({ title: result.message || '删除失败', icon: 'none' });
            }
          } catch (err) {
            console.error('删除失败:', err);
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 预览图片
  previewImage(e) {
    const src = e.currentTarget.dataset.src;
    const urls = [src];
    wx.previewImage({ urls });
  },

  // 跳转详情
  goDetail(e) {
    const momentId = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/moment-detail/moment-detail?id=${momentId}` });
  },

  // 发布动态
  goPublishMoment() {
    wx.navigateTo({ url: '/pages/releaseDynamic/releaseDynamic' });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.refreshMoments();
  },

  // 上拉加载更多
  onReachBottom() {
    this.loadMore();
  }
});