// pages/profile/profile.js
import {
  getUserProfile,
  getStudentVerifyStatus,
  getPalList,
  getPalDetail,
  getMyApplications,
  deletePal,    
  getPalApplications,
  reviewPalApplication,
  getOtherUserProfile,
  getMyLikedMoments,
  getMyFavoritedMoments,
  getMyComments 
} from "../../utils/request.js";

Page({
  data: {
    userInfo: {},
    tabIndex: 0,
    publishList: [],      // 我发布的搭子帖
    applyList: [],        // 我申请的搭子帖
    successList: [],      // 已成功的搭子帖
     // 用于展示的前3条
     displayPublishList: [],
     displayApplyList: [],
     displaySuccessList: [],

      // 申请列表展开状态
    expandedPostId: null,      // 当前展开的帖子ID
    applicationsMap: {},  
    applicationsStats: {},   
    loadingApps: false,        // 是否正在加载申请列表
    loading: false,
    verifyStatus: 0,
    verifyStatusDesc: '未认证',

    // 关注相关数据
    followerCount: 0,
    followingCount: 0,
    interestTags: [],

    myLikesCount: 0,
    myFavoritesCount: 0,
    myCommentsCount: 0
  },

  onLoad() {
    this.checkLoginAndInit();
  },

  onShow() {
    if (this.getTabBar) this.getTabBar().setData({ selected: 4 });
    if (this.data.userInfo?.id) {
      this.initPage();
    }
  },

  checkLoginAndInit() {
    const token = wx.getStorageSync('token') || wx.getStorageSync('user_token');
    if (!token) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    this.initPage();
  },

  async initPage() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    try {
      await this.loadUserInfo();
      await Promise.all([
        this.loadVerifyStatus(),
        this.loadMyPublish(),
        this.loadMyAppliedAndSuccess(),
        this.loadInteractionStats()
      ]);
    } catch (err) {
      console.error('初始化失败', err);
      if (err?.code === 401 || err?.status === 401) this.goLogin();
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadUserInfo() {
    // 先获取基本信息
    const basicRes = await getUserProfile();
    if (basicRes.code === 200) {
      const basicData = basicRes.data || {};
      const userId = basicData.id;
      
      // 再用 getOtherUserProfile 获取完整信息（含关注数据）
      if (userId) {
        const fullRes = await getOtherUserProfile(userId);
        if (fullRes.code === 200) {
          const fullData = fullRes.data || {};
          this.setData({ 
            userInfo: fullData,
            followerCount: fullData.followerCount || 0,
            followingCount: fullData.followingCount || 0,
            interestTags: fullData.interestTags || []
          });
        } else {
          // 如果获取完整信息失败，使用基本信息
          this.setData({ 
            userInfo: basicData,
            followerCount: 0,
            followingCount: 0,
            interestTags: []
          });
        }
      } else {
        this.setData({ 
          userInfo: basicData,
          followerCount: 0,
          followingCount: 0,
          interestTags: []
        });
      }
    }
  },

  async loadVerifyStatus() {
    const res = await getStudentVerifyStatus();
    if (res.code === 200) {
      const status = res.data?.status ?? 0;
      const descMap = { 0: '未认证', 1: '审核中', 2: '已认证', 3: '认证失败' };
      this.setData({ verifyStatus: status, verifyStatusDesc: descMap[status] || '未认证' });
    }
  },

    // 我发布的搭子帖
    async loadMyPublish() {
      const userId = this.data.userInfo.id;
      if (!userId) return;
      const res = await getPalList({ authorId: userId });
      if (res.code === 200) {
        const fullList = res.data || [];
        
        // 为每个帖子添加 pendingCount 字段
        const listWithPendingCount = fullList.map(post => ({
          ...post,
          pendingCount: 0  // 初始为0，加载申请列表后再更新
        }));
        
        this.setData({ 
          publishList: listWithPendingCount,
          displayPublishList: listWithPendingCount.slice(0, 2)
        });
      }
    },
  
    // 我申请的 + 已成功
    async loadMyAppliedAndSuccess() {
      try {
        const appRes = await getMyApplications();
        if (appRes.code !== 200) {
          this.setData({ applyList: [], successList: [], displayApplyList: [], displaySuccessList: [] });
          return;
        }
        const applications = appRes.data || [];
        if (applications.length === 0) {
          this.setData({ applyList: [], successList: [], displayApplyList: [], displaySuccessList: [] });
          return;
        }
        
        // 逐个获取帖子详情，跳过不存在的
        const validApplyList = [];
        const validSuccessList = [];
        
        for (const app of applications) {

          try {
        
            const detailRes = await getPalDetail(app.postId);
        
            // 帖子不存在
            if (
              !detailRes ||
              detailRes.code !== 200 ||
              !detailRes.data
            ) {
              continue;
            }
        
            const postWithStatus = {
              ...detailRes.data,
              applicationStatus: app.status
            };
        
            validApplyList.push(postWithStatus);
        
            // 已成功
            if (
              detailRes.data.status === 2 &&
              app.status === 1
            ) {
              validSuccessList.push(postWithStatus);
            }
        
          } catch (err) {
        
            // 帖子被删除时直接跳过
            if (
              err?.code === 500 ||
              err?.message?.includes('Post not found')
            ) {
              continue;
            }
        
            // 其它错误才打印
            console.error(
              `获取帖子 ${app.postId} 失败:`,
              err
            );
          }
        }
        
        this.setData({
          applyList: validApplyList,
          successList: validSuccessList,
          displayApplyList: validApplyList.slice(0, 3),
          displaySuccessList: validSuccessList.slice(0, 3)
        });
      } catch (err) {
        console.error('获取申请列表失败', err);
        this.setData({ applyList: [], successList: [], displayApplyList: [], displaySuccessList: [] });
      }
    },

  // ========== 新增：我发布的帖子的编辑和删除功能 ==========

  // 编辑搭子帖
  editPublishPost(e) {
    const postId = e.currentTarget.dataset.id;
    const post = this.data.publishList.find(p => p.id === postId);
    if (!post) return;
    
    // 跳转到编辑页面，传递帖子数据
    wx.navigateTo({
      url: `/pages/editPal/editPal?id=${postId}`,
      success: (res) => {
        // 通过 eventChannel 传递帖子数据（可选）
        res.eventChannel.emit('editPost', { post });
      }
    });
  },

  // 删除搭子帖
  async deletePublishPost(e) {
    const postId = e.currentTarget.dataset.id;
    const post = this.data.publishList.find(p => p.id === postId);
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
            if (result.code === 200) {
              wx.showToast({ title: '删除成功', icon: 'success' });
              // 从列表中移除
              const newList = this.data.publishList.filter(p => p.id !== postId);
              this.setData({ publishList: newList });
              await this.loadMyPublish(true);
            } else {
              wx.showToast({ title: result.message || '删除失败', icon: 'none' });
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
            if (result.code === 200) {
              wx.showToast({ title: '已结束招募', icon: 'success' });
              // 刷新列表
              await this.loadMyPublish();
            } else {
              wx.showToast({ title: result.message || '操作失败', icon: 'none' });
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
      
      if (res.code === 200) {
        const applications = res.data || [];
        
        // 在 JS 中计算统计数据
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
        wx.showToast({ title: res.message || '加载失败', icon: 'none' });
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
    const { postId, appId, status } = e.currentTarget.dataset;
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
            
            if (result.code === 200) {
              wx.showToast({ title: `已${statusText}`, icon: 'success' });
              
              // 更新本地申请状态
              const applications = [...this.data.applicationsMap[postId]];
              const index = applications.findIndex(a => a.id === appId);
              if (index !== -1) {
                applications[index].status = status;
                this.setData({
                  [`applicationsMap.${postId}`]: applications
                });
                this.setData({ loadingApps: true, expandedPostId: postId });
              }
            } else {
              wx.showToast({ title: result.message || '操作失败', icon: 'none' });
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

  // ========== 原有方法 ==========

  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({ tabIndex: index });
  },

  goPalDetail(e) {
    const postId = e.currentTarget.dataset.id;
    if (postId) {
      wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${postId}` });
    }
  },

   // 跳转到完整列表页面
   goToFullList(e) {
    const type = e.currentTarget.dataset.type;
    let url = '/pages/full-list/full-list';
    let title = '';
    
    switch(type) {
      case 'publish':
        title = '我发布的';
        break;
      case 'apply':
        title = '我申请的';
        break;
      case 'success':
        title = '已成功';
        break;
    }
    
    wx.navigateTo({
      url: `${url}?type=${type}&title=${title}`
    });
  },

  // 跳转粉丝列表
goFollowers() {
  const userId = this.data.userInfo.id;
  if (!userId) {
    wx.showToast({ title: '用户信息错误', icon: 'none' });
    return;
  }
  console.log('跳转粉丝列表, userId:', userId);
  wx.navigateTo({
    url: `/pages/user-list/user-list?type=followers&userId=${userId}&title=粉丝列表`,
    fail: (err) => {
      console.error('跳转失败:', err);
      wx.showToast({ title: '页面不存在', icon: 'none' });
    }
  });
},

// 跳转关注列表
goFollowing() {
  const userId = this.data.userInfo.id;
  if (!userId) {
    wx.showToast({ title: '用户信息错误', icon: 'none' });
    return;
  }
  console.log('跳转关注列表, userId:', userId);
  wx.navigateTo({
    url: `/pages/user-list/user-list?type=following&userId=${userId}&title=关注列表`,
    fail: (err) => {
      console.error('跳转失败:', err);
      wx.showToast({ title: '页面不存在', icon: 'none' });
    }
  });
},

  goMomentDetail(e) {
    const momentId = e.currentTarget.dataset.id;
    if (momentId) {
      wx.navigateTo({ url: `/pages/moment-detail/moment-detail?id=${momentId}` });
    }
  },

  goMyMoments() {
    wx.navigateTo({ url: '/pages/my-moments/my-moments' });
  },

  goPage(e) {
    const url = e.currentTarget.dataset.url;
    if (url) wx.navigateTo({ url });
  },

  goEditProfile() {
    wx.navigateTo({ url: '/pages/edit-profile/edit-profile' });
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  },

  goLogin() {
    wx.clearStorageSync();
    wx.reLaunch({ url: '/pages/login/login' });
  },

  // 跳转方法
goToLikedMoments() {
  console.log('===== 我点赞的被点击了 =====');
  wx.navigateTo({
    url: '/pages/my-moment-list/my-moment-list?type=likes&title=我点赞的',
    success: () => console.log('跳转成功'),
      fail: (err) => console.error('跳转失败:', err)
  });
},

goToFavoritedMoments() {
  wx.navigateTo({
    url: '/pages/my-moment-list/my-moment-list?type=favorites&title=我收藏的'
  });
},

goToMyComments() {
  wx.navigateTo({
    url: '/pages/my-moment-list/my-moment-list?type=comments&title=我的评论'
  });
},

  async onPullDownRefresh() {
    await this.initPage();
    wx.stopPullDownRefresh();
  },
  // 加载互动统计
async loadInteractionStats() {
  try {

    const [
      likeRes,
      favoriteRes,
      commentRes
    ] = await Promise.all([
      getMyLikedMoments(),
      getMyFavoritedMoments(),
      getMyComments()
    ]);

    this.setData({
      myLikesCount:
        likeRes.code === 200
          ? (likeRes.data || []).length
          : 0,

      myFavoritesCount:
        favoriteRes.code === 200
          ? (favoriteRes.data || []).length
          : 0,

      myCommentsCount:
        commentRes.code === 200
          ? (commentRes.data || []).length
          : 0
    });

    console.log('互动统计:', {
      likes: this.data.myLikesCount,
      favorites: this.data.myFavoritesCount,
      comments: this.data.myCommentsCount
    });

  } catch (err) {
    console.error('加载互动统计失败', err);
  }
}
});