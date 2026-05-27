// pages/full-list/full-list.js
import {
  getPalList,
  getMyApplications,
  getPalApplications,
  reviewPalApplication,
  getPalDetail,
  deletePal
} from "../../utils/request.js";

Page({
  data: {
    type: '',        // publish, apply, success
    title: '',
    list: [],
    loading: true,
    page: 1,
    hasMore: true,
    userInfo: {},
    // 申请列表相关
    expandedPostId: null,
    applicationsMap: {},
    applicationsStats: {},
    loadingApps: false
  },

  onLoad(options) {
    const { type, title } = options;
    console.log('full-list onLoad:', { type, title });
    this.setData({ type, title });
    this.loadUserInfo();
    this.loadList();
  },

  onShow() {
    // 从详情页返回时刷新
    if (this.data.list.length > 0) {
      this.refreshList();
    }
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    this.setData({ userInfo });
  },

  async loadList(isRefresh = false) {
    if (isRefresh) {
      this.setData({ page: 1, hasMore: true });
    }
    
    if (!this.data.hasMore && !isRefresh) return;
    
    this.setData({ loading: true });

    try {
      const { type } = this.data;
      
      if (type === 'publish') {
        // 我发布的
        const result = await getPalList({ 
          authorId: this.data.userInfo.id,
          page: this.data.page,
          size: 10
        });
        
        if (result && result.code === 200) {
          const newList = result.data || [];
          this.processList(newList, isRefresh);
        } else {
          console.error('获取发布列表失败:', result);
          this.processList([], isRefresh);
        }
        
      } else if (type === 'apply' || type === 'success') {
        // 我申请的 / 已成功
        const appRes = await getMyApplications();
        
        if (appRes && appRes.code === 200) {
          const applications = appRes.data || [];
          const postIds = [...new Set(applications.map(app => app.postId))];
          
          if (postIds.length === 0) {
            this.processList([], isRefresh);
            return;
          }
          
          // 逐个获取帖子详情，跳过不存在的
          const validPosts = [];
          
          for (const postId of postIds) {
            try {
              const detailRes = await getPalDetail(postId);
              if (detailRes && detailRes.code === 200 && detailRes.data) {
                const application = applications.find(app => app.postId === postId);
                if (application) {
                  const postWithStatus = { 
                    ...detailRes.data, 
                    applicationStatus: application.status 
                  };
                  validPosts.push(postWithStatus);
                }
              } else {
                console.log(`帖子 ${postId} 不存在或已被删除，跳过`);
              }
            } catch (err) {
              console.error(`获取帖子 ${postId} 失败:`, err);
            }
          }
          
          // 根据类型筛选
          let finalList = validPosts;
          if (type === 'success') {
            finalList = validPosts.filter(post => 
              post.status === 2 && post.applicationStatus === 1
            );
          }
          
          this.processList(finalList, isRefresh);
        } else {
          console.error('获取申请列表失败:', appRes);
          this.processList([], isRefresh);
        }
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
      hasMore: safeList.length >= 10,
      page: this.data.page + 1
    });
  },

  // ========== 申请列表相关 ==========

  // 展开/收起申请列表
  async toggleApplications(e) {
    const postId = e.currentTarget.dataset.id;
    
    // 如果点击的是当前已展开的，则收起
    if (this.data.expandedPostId === postId) {
      this.setData({ expandedPostId: null });
      return;
    }
    
    // 如果已经有缓存数据，直接展开
    if (this.data.applicationsMap[postId]) {
      this.setData({ expandedPostId: postId });
      return;
    }
    
    // 否则加载申请列表
    this.setData({ loadingApps: true, expandedPostId: postId });
    
    try {
      const res = await getPalApplications(postId);
      
      if (res && res.code === 200) {
        const applications = res.data || [];
        
        // 计算统计数据
        const stats = {
          total: applications.length,
          pending: applications.filter(a => a.status === 0).length,
          approved: applications.filter(a => a.status === 1).length,
          rejected: applications.filter(a => a.status === 2).length
        };
        
        this.setData({
          [`applicationsMap.${postId}`]: applications,
          [`applicationsStats.${postId}`]: stats
        });
      } else {
        wx.showToast({ title: res?.message || '加载失败', icon: 'none' });
        this.setData({ expandedPostId: null });
      }
    } catch (err) {
      console.error('加载申请列表失败:', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
      this.setData({ expandedPostId: null });
    } finally {
      this.setData({ loadingApps: false });
    }
  },

  // 审核申请
  async reviewApplication(e) {
    const postId = e.currentTarget.dataset.postId;
    const appId = e.currentTarget.dataset.appId;
    const status = e.currentTarget.dataset.status;
    
    console.log('审核参数:', { postId, appId, status });
    
    const statusText = status === "1" ? '通过' : '拒绝';
    const confirmText = status === "1" ? '确定通过该申请吗？' : '确定拒绝该申请吗？';
    
    wx.showModal({
      title: '提示',
      content: confirmText,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...', mask: true });
          
          try {
            const result = await reviewPalApplication(postId, appId, { status });
            
            if (result && result.code === 200) {
              wx.showToast({ title: `已${statusText}`, icon: 'success' });
              
              // 更新本地申请状态
              const applications = [...(this.data.applicationsMap[postId] || [])];
              const index = applications.findIndex(a => a.id === appId);
              if (index !== -1) {
                applications[index].status = status;
                
                // 重新计算统计数据
                const stats = {
                  total: applications.length,
                  pending: applications.filter(a => a.status === 0).length,
                  approved: applications.filter(a => a.status === 1).length,
                  rejected: applications.filter(a => a.status === 2).length
                };
                
                this.setData({
                  [`applicationsMap.${postId}`]: applications,
                  [`applicationsStats.${postId}`]: stats
                });
              }
            } else {
              wx.showToast({ title: result?.message || '操作失败', icon: 'none' });
            }
          } catch (err) {
            console.error('审核失败:', err);
            wx.showToast({ title: '操作失败', icon: 'none' });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // 查看申请人资料
  viewApplicantProfile(e) {
    const userId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/otherProfile/otherProfile?id=${userId}`
    });
  },

  // ========== 编辑和删除功能 ==========

  // 编辑搭子帖
  editPublishPost(e) {
    const postId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/editPal/editPal?id=${postId}`
    });
  },

  // 删除搭子帖
  async deletePublishPost(e) {
    const postId = e.currentTarget.dataset.id;
    const post = this.data.list.find(p => p.id === postId);
    const postTitle = post?.title || '该帖子';
    
    wx.showModal({
      title: '提示',
      content: `确定删除「${postTitle}」吗？删除后无法恢复。`,
      confirmColor: '#ff4444',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...', mask: true });
          try {
            const result = await deletePal(postId);
            if (result && result.code === 200) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              // 从列表中移除
              const newList = this.data.list.filter(p => p.id !== postId);
              this.setData({ list: newList });
            } else {
              wx.showToast({ title: result?.message || '删除失败', icon: 'none' });
            }
          } catch (err) {
            console.error('删除失败:', err);
            wx.showToast({ title: '删除失败，请重试', icon: 'none' });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // 完成搭子帖（结束招募）
  async finishPublishPost(e) {
    const postId = e.currentTarget.dataset.id;
    const { finishPal } = require('../../utils/request.js');
    
    wx.showModal({
      title: '提示',
      content: '确定结束该帖子的招募吗？',
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...', mask: true });
          try {
            const result = await finishPal(postId);
            if (result && result.code === 200) {
              wx.showToast({ title: '已结束招募', icon: 'success' });
              // 刷新列表
              this.refreshList();
            } else {
              wx.showToast({ title: result?.message || '操作失败', icon: 'none' });
            }
          } catch (err) {
            console.error('操作失败:', err);
            wx.showToast({ title: '操作失败', icon: 'none' });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // ========== 其他方法 ==========

  refreshList() {
    this.loadList(true);
  },

  loadMore() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadList();
    }
  },

  // 跳转详情
  goPostDetail(e) {
    const postId = e.currentTarget.dataset.id;
    if (postId) {
      wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${postId}` });
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  onPullDownRefresh() {
    this.refreshList();
  },

  onReachBottom() {
    this.loadMore();
  }
});