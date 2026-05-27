import {
  getOtherUserProfile,
  followUser,
  unfollowUser,
  getMomentList,
  getPalList
} from '../../utils/request.js';

Page({
  data: {
    userId: '',
    tabIndex: 0,
    loading: false,
    followingChanging: false,

    userInfo: {
      id: '',
      nickname: '用户',
      avatarUrl: '',
      bio: '',
      school: '',
      grade: '',
      gender: 0,
      interestTags: [],
      verifyStatus: 0,
      isFollow: false,
      followerCount: 0,
      followingCount: 0
    },

    momentList: [],
    palList: []
  },

  onLoad(options) {
    const userId = options.userId || options.id || '';

    if (!userId) {
      wx.showToast({
        title: '用户不存在',
        icon: 'none'
      });
      return;
    }

    this.setData({ userId });
    this.initPage(userId);
  },

  async initPage(userId) {
    try {
      this.setData({ loading: true });

      await Promise.all([
        this.loadUserProfile(userId),
        this.loadUserMoments(userId),
        this.loadUserPals(userId)
      ]);
    } catch (err) {
      console.error('初始化他人主页失败', err);
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadUserProfile(userId) {
    const res = await getOtherUserProfile(userId);
    const data = res.data || {};

    this.setData({
      userInfo: {
        id: data.id || userId,
        nickname: data.nickname || '用户',
        avatarUrl: data.avatarUrl || '',
        bio: data.bio || '',
        school: data.school || '',
        grade: data.grade || '',
        gender: data.gender || 0,
        interestTags: data.interestTags || [],
        verifyStatus: data.verifyStatus || 0,
        isFollow: !!data.isFollow,
        followerCount: data.followerCount || 0,
        followingCount: data.followingCount || 0
      }
    });
  },

  async loadUserMoments(userId) {
    const res = await getMomentList({ authorId: userId, sort: 'latest' });
    this.setData({
      momentList: res.data || []
    });
  },

  async loadUserPals(userId) {
    const res = await getPalList({ authorId: userId });
    this.setData({
      palList: res.data || []
    });
  },

  switchTab(e) {
    this.setData({
      tabIndex: Number(e.currentTarget.dataset.index)
    });
  },

  async toggleFollow() {
    if (this.data.followingChanging) return;

    const { userId, userInfo } = this.data;

    try {
      this.setData({ followingChanging: true });

      if (userInfo.isFollow) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }

      this.setData({
        'userInfo.isFollow': !userInfo.isFollow,
        'userInfo.followerCount': userInfo.isFollow
          ? Math.max((userInfo.followerCount || 0) - 1, 0)
          : (userInfo.followerCount || 0) + 1
      });
    } catch (err) {
      console.error('关注操作失败', err);
    } finally {
      this.setData({ followingChanging: false });
    }
  },

  goMomentDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;

    wx.navigateTo({
      url: `/pages/dynamicDetail/dynamicDetail?id=${id}`
    });
  },

  goPalDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;

    wx.navigateTo({
      url: `/pages/palDetail/palDetail?id=${id}`
    });
  }
});
