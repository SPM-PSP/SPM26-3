import {
  getMomentDetail,
  getOtherUserProfile,
  getMomentComments,
  likeDynamic,
  unlikeDynamic,
  favoriteDynamic,
  unfavoriteDynamic,
  addComment
} from '../../utils/request';

Page({
  data: {
    momentId: null,

    icons: {
      like: '/assets/icons/喜爱1.svg',
      liked: '/assets/icons/喜爱2.svg',
      comment: '/assets/icons/评论.svg',
      favorite: '/assets/icons/收藏.svg',
      favorited: '/assets/icons/收藏 -已收藏.svg'
    },

    detail: {
      id: null,
      authorId: null,
      scene: '',
      title: '',
      content: '',
      location: '',
      tags: [],
      status: 0,
      reviewStatus: 0,
      likeCount: 0,
      favoriteCount: 0,
      commentCount: 0,
      hotScore: 0,
      isLiked: false,
      isFavorited: false,
      isFollow: false,
      followerCount: 0,
      followingCount: 0,
      media: [],
      createdAt: '',
      createdAtText: '',
      updatedAt: '',
      author: {
        nickname: '用户',
        avatarUrl: ''
      }
    },

    comment: '',
    commentList: [],
    commentUserMap: {}
  },

  onLoad(options) {
    const momentId = options.id;

    if (!momentId) {
      wx.showToast({
        title: '动态不存在',
        icon: 'none'
      });
      return;
    }

    this.setData({ momentId });

    this.loadMomentDetail(momentId);
    this.loadCommentList(momentId);
  },

  async loadMomentDetail(momentId) {
    try {
      const res = await getMomentDetail(momentId);
      const data = res.data || {};

      const detail = {
        ...this.data.detail,
        ...data,
        tags: data.tags || [],
        media: data.media || [],
        likeCount: data.likeCount || 0,
        favoriteCount: data.favoriteCount || 0,
        commentCount: data.commentCount || 0,
        hotScore: data.hotScore || 0,
        isLiked: !!data.isLiked,
        isFavorited: !!data.isFavorited,
        isFollow: !!data.isFollow,
        followerCount: data.followerCount || 0,
        followingCount: data.followingCount || 0,
        createdAtText: this.formatTime(data.createdAt),
        author: {
          nickname: '用户',
          avatarUrl: ''
        }
      };

      this.setData({ detail });

      if (data.authorId) {
        this.loadAuthorInfo(data.authorId);
      }
    } catch (err) {
      console.error(err);
    }
  },

  async loadAuthorInfo(authorId) {
    try {
      const res = await getOtherUserProfile(authorId);
      const user = res.data || {};

      this.setData({
        'detail.author': {
          nickname: user.nickname || '用户',
          avatarUrl: user.avatarUrl || ''
        },
        'detail.isFollow': typeof user.isFollow === 'boolean'
          ? user.isFollow
          : this.data.detail.isFollow,
        'detail.followerCount': user.followerCount || this.data.detail.followerCount,
        'detail.followingCount': user.followingCount || this.data.detail.followingCount
      });
    } catch (err) {
      console.error(err);
    }
  },

  async loadCommentList(momentId) {
    try {
      const res = await getMomentComments(momentId);
      const list = res.data || [];

      const commentList = list.map(item => ({
        ...item,
        createdAtText: this.formatTime(item.createdAt),
        user: {
          nickname: item.nickname || `用户${item.userId || ''}`,
          avatarUrl: item.avatarUrl || ''
        }
      }));

      this.setData({ commentList });
    } catch (err) {
      console.error(err);
    }
  },

  async loadCommentList(momentId) {
    try {
      const res = await getMomentComments(momentId);
      const list = res.data || [];
      const commentUserMap = {
        ...this.data.commentUserMap
      };

      const commentList = await Promise.all(list.map(async (item) => {
        const user = await this.getCommentUserInfo(item.userId, commentUserMap, item);

        return {
          ...item,
          createdAtText: this.formatTime(item.createdAt),
          user
        };
      }));

      this.setData({
        commentList,
        commentUserMap
      });
    } catch (err) {
      console.error(err);
    }
  },

  async getCommentUserInfo(userId, commentUserMap, comment) {
    if (!userId) {
      const nickname = comment.nickname || '用户';

      return {
        nickname,
        avatarUrl: comment.avatarUrl || '',
        initial: nickname[0] || '用'
      };
    }

    const key = String(userId);

    if (commentUserMap[key]) {
      return commentUserMap[key];
    }

    try {
      const res = await getOtherUserProfile(userId);
      const user = res.data || {};
      const nickname = user.nickname || comment.nickname || `用户${userId}`;

      const userInfo = {
        nickname,
        avatarUrl: user.avatarUrl || comment.avatarUrl || '',
        initial: nickname[0] || '用'
      };

      commentUserMap[key] = userInfo;

      return userInfo;
    } catch (err) {
      console.error('获取评论用户信息失败', userId, err);

      const nickname = comment.nickname || `用户${userId}`;

      return {
        nickname,
        avatarUrl: comment.avatarUrl || '',
        initial: nickname[0] || '用'
      };
    }
  },

  async toggleLike() {
    const { detail, momentId } = this.data;
    const isLiked = detail.isLiked;

    try {
      if (isLiked) {
        await unlikeDynamic(momentId);
      } else {
        await likeDynamic(momentId);
      }

      this.setData({
        'detail.isLiked': !isLiked,
        'detail.likeCount': isLiked
          ? Math.max(detail.likeCount - 1, 0)
          : detail.likeCount + 1
      });

      wx.showToast({
        title: isLiked ? '已取消点赞' : '点赞成功',
        icon: 'none'
      });
    } catch (err) {
      console.error(err);
    }
  },

  async toggleFavorite() {
    const { detail, momentId } = this.data;
    const isFavorited = detail.isFavorited;

    try {
      if (isFavorited) {
        await unfavoriteDynamic(momentId);
      } else {
        await favoriteDynamic(momentId);
      }

      this.setData({
        'detail.isFavorited': !isFavorited,
        'detail.favoriteCount': isFavorited
          ? Math.max(detail.favoriteCount - 1, 0)
          : detail.favoriteCount + 1
      });

      wx.showToast({
        title: isFavorited ? '已取消收藏' : '收藏成功',
        icon: 'none'
      });
    } catch (err) {
      console.error(err);
    }
  },

  setComment(e) {
    this.setData({
      comment: e.detail.value
    });
  },

  async sendComment() {
    const { comment, momentId } = this.data;
    const content = comment.trim();

    if (!content) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    try {
      await addComment(momentId, {
        content,
        parentId: null,
        replyToId: null
      });

      wx.showToast({
        title: '评论成功',
        icon: 'success'
      });

      this.setData({
        comment: '',
        'detail.commentCount': this.data.detail.commentCount + 1
      });

      this.loadCommentList(momentId);
    } catch (err) {
      console.error(err);
    }
  },

  previewImage(e) {
    const current = e.currentTarget.dataset.url;

    const urls = this.data.detail.media
      .filter(item => item.mediaType === 0)
      .map(item => item.mediaUrl);

    if (!current || !urls.length) return;

    wx.previewImage({
      current,
      urls
    });
  },

  formatTime(time) {
    if (!time) return '';

    const date = new Date(time);
    const now = new Date();

    const diff = now.getTime() - date.getTime();

    const minute = Math.floor(diff / 60000);
    const hour = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);

    if (minute < 1) return '刚刚';
    if (minute < 60) return `${minute}分钟前`;
    if (hour < 24) return `${hour}小时前`;
    if (day < 7) return `${day}天前`;

    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${m}-${d}`;
  },
  goOtherProfile(e) {
    const userId = e.currentTarget.dataset.userId;
  
    if (!userId) return;
  
    wx.navigateTo({
      url: `/pages/otherProfile/otherProfile?userId=${userId}`
    });
  },
  
});
