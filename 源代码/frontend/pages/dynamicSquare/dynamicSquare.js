import {
  getMomentList,
  getMomentDetail,
  getOtherUserProfile,
  likeDynamic,
  unlikeDynamic,
  favoriteDynamic,
  unfavoriteDynamic
} from '../../utils/request.js';

Page({
  data: {
    dynamicList: [],

    activeTag: '热门',

    searchKeyword: '',
    authorProfileMap: {},
    tagConfig: [
      { name: '热门', sort: 'hot', tag: '' },
      { name: '旅行攻略', sort: 'latest', tag: '旅行' },
      { name: '学习方法', sort: 'latest', tag: '学习' },
      { name: '干饭推荐', sort: 'latest', tag: '干饭' },
      { name: '运动技巧', sort: 'latest', tag: '运动' }
    ]
  },

  onLoad() {
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
  },
  
  onShow() {
    this.fetchMomentList();
  },

  onPullDownRefresh() {
    this.fetchMomentList().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async fetchMomentList() {
    try {
      wx.showLoading({
        title: '加载中'
      });

      const {
        activeTag,
        searchKeyword,
        tagConfig
      } = this.data;

      const currentConfig = tagConfig.find(
        item => item.name === activeTag
      ) || tagConfig[0];

      const params = this.cleanParams({
        sort: currentConfig.sort,
        keyword: searchKeyword.trim(),
        tag: currentConfig.tag
      });

      const res = await getMomentList(params);
      const authorProfileMap = {
        ...this.data.authorProfileMap
      };
      const list = await Promise.all((res.data || []).map(async (item) => {
        let detail = item;
      
        try {
          const detailRes = await getMomentDetail(item.id);
          detail = {
            ...item,
            ...(detailRes.data || {})
          };
        } catch (err) {
          console.error('获取动态详情失败:', item.id, err);
        }
      
        const media = this.normalizeMedia(detail.media);
        const tags = this.normalizeArray(detail.tags);
        const coverImage = this.getCoverImage(detail, media);
        const author = await this.getAuthorInfo(detail.authorId, authorProfileMap);

        return {
          ...detail,
          tags,
          media,
          author,
          publishTime: this.formatRelativeTime(detail.createdAt),
          coverImage,
          showTag: tags.length > 0 ? tags[0] : '动态',
          likeCount: detail.likeCount || 0,
          commentCount: detail.commentCount || 0,
          favoriteCount: detail.favoriteCount || 0,
          hotScore: detail.hotScore || 0,
          isLiked: !!detail.isLiked,
          isFavorited: !!detail.isFavorited
        };
      }));
      

      this.setData({
        dynamicList: list,
        authorProfileMap
      });

    } catch (err) {
      console.error('动态列表获取失败', err);

      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });

    } finally {
      wx.hideLoading();
    }
  },

  normalizeMedia(media) {
    if (!media) return [];

    if (Array.isArray(media)) {
      return media;
    }

    if (typeof media === 'string') {
      try {
        const parsed = JSON.parse(media);

        return Array.isArray(parsed)
          ? parsed
          : [];
      } catch (err) {
        return [];
      }
    }

    return [];
  },

  normalizeArray(value) {
    if (!value) return [];

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);

        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (err) {
        return value
          ? value.split(',').filter(Boolean)
          : [];
      }
    }

    return [];
  },

  getCoverImage(item, media) {
    if (item.coverImage) {
      return item.coverImage;
    }

    if (item.mediaUrl) {
      return item.mediaUrl;
    }

    const firstImage = media.find(mediaItem =>
      Number(mediaItem.mediaType) === 0 && mediaItem.mediaUrl
    );

    return firstImage
      ? firstImage.mediaUrl
      : '';
  },

  cleanParams(params) {
    const result = {};

    Object.keys(params).forEach(key => {
      const value = params[key];

      if (value !== undefined && value !== null && value !== '') {
        result[key] = value;
      }
    });

    return result;
  },

  formatRelativeTime(isoTime) {
    if (!isoTime) return '未知时间';

    const publishTime = new Date(isoTime);
    const time = publishTime.getTime();

    if (Number.isNaN(time)) {
      return '未知时间';
    }

    const now = new Date();
    const diff = now.getTime() - time;

    if (diff < 0) {
      return '刚刚';
    }

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) {
      return '刚刚';
    }

    if (diff < hour) {
      return `${Math.floor(diff / minute)}分钟前`;
    }

    if (diff < day) {
      return `${Math.floor(diff / hour)}小时前`;
    }

    return `${Math.floor(diff / day)}天前`;
  },

  switchTag(e) {
    const tagName = e.currentTarget.dataset.name;

    if (tagName === this.data.activeTag) {
      return;
    }

    this.setData({
      activeTag: tagName
    });

    this.fetchMomentList();
  },

  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    });
  },

  onSearchConfirm() {
    this.fetchMomentList();
  },

  goPublishDynamic() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });

      wx.navigateTo({
        url: '/pages/login/login'
      });

      return;
    }

    wx.navigateTo({
      url: '/pages/releaseDynamic/releaseDynamic'
    });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;

    if (!id) return;

    wx.navigateTo({
      url: `/pages/dynamicDetail/dynamicDetail?id=${id}`
    });
  },

  async toggleLike(e) {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }

    const index = e.currentTarget.dataset.index;
    const list = [...this.data.dynamicList];
    const item = list[index];

    if (!item) return;

    try {
      if (item.isLiked) {
        await unlikeDynamic(item.id);

        item.likeCount = Math.max((item.likeCount || 0) - 1, 0);
      } else {
        await likeDynamic(item.id);

        item.likeCount = (item.likeCount || 0) + 1;
      }

      item.isLiked = !item.isLiked;

      this.setData({
        dynamicList: list
      });

    } catch (err) {
      console.error(err);
    }
  },

  async toggleFavorite(e) {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }

    const index = e.currentTarget.dataset.index;
    const list = [...this.data.dynamicList];
    const item = list[index];

    if (!item) return;

    try {
      if (item.isFavorited) {
        await unfavoriteDynamic(item.id);

        item.favoriteCount = Math.max((item.favoriteCount || 0) - 1, 0);
      } else {
        await favoriteDynamic(item.id);

        item.favoriteCount = (item.favoriteCount || 0) + 1;
      }

      item.isFavorited = !item.isFavorited;

      this.setData({
        dynamicList: list
      });

    } catch (err) {
      console.error(err);
    }
  },
  goOtherProfile(e) {
    const userId = e.currentTarget.dataset.userId;
    console.log('userId=', userId);
    if (!userId) return;
  
    wx.navigateTo({
      url: `/pages/otherProfile/otherProfile?userId=${userId}`
    });
  },
  async getAuthorInfo(authorId, authorProfileMap) {
    if (!authorId) {
      return {
        nickname: '用户',
        avatarUrl: '',
        initial: '用'
      };
    }
  
    const key = String(authorId);
  
    if (authorProfileMap[key]) {
      return authorProfileMap[key];
    }
  
    try {
      const res = await getOtherUserProfile(authorId);
      const user = res.data || {};
      const nickname = user.nickname || `用户${authorId}`;
  
      const author = {
        nickname,
        avatarUrl: user.avatarUrl || '',
        initial: nickname[0] || '用'
      };
  
      authorProfileMap[key] = author;
  
      return author;
    } catch (err) {
      console.error('获取作者信息失败', authorId, err);
  
      const nickname = `用户${authorId}`;
  
      return {
        nickname,
        avatarUrl: '',
        initial: '用'
      };
    }
  },
});