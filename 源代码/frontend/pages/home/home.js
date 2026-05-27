// pages/home/home.js
import {
  getPalList,
  getOtherUserProfile,
  getMomentList
} from '../../utils/request.js';

Page({
  data: {
    statusBarHeight: 20,
    hasNotice: true,
    displayPosts: [],
    hotGuides: []
  },

  onLoad() {
    const info = wx.getWindowInfo();
    this.setData({
      statusBarHeight: info.statusBarHeight
    });
    this.fetchPalPosts();
    this.fetchRandomMoments();
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
    this.fetchPalPosts();
    this.fetchRandomMoments();
  },

  /**
   * 获取随机动态
   */
  async fetchRandomMoments() {
    try {
      const res = await getMomentList();
      if (res.code !== 200 || !res.data) return;
      let moments = [...res.data];
      moments.sort(() => Math.random() - 0.5);
      moments = moments.slice(0, 3);

      const guides = moments.map(item => ({
        id: item.id,
        title: item.title || '校园动态',
        tag: item.tags?.[0] || '热门',
        emoji: this.getMomentEmoji(item.tags),
        bgColor: this.getRandomBg()
      }));

      this.setData({
        hotGuides: guides
      });
    } catch (err) {
      console.error("动态获取失败:", err);
    }
  },

  /**
   * 获取帖子列表
   */
  async fetchPalPosts() {
    try {
      const res = await getPalList();
      if (res.code !== 200 || !res.data) return;

      const rawPosts = res.data;

      const fullDataPromises = rawPosts.map(async (item) => {
        try {
          const userRes = await getOtherUserProfile(item.authorId);
          const authorInfo = userRes.data;
          return {
            ...item,
            authorNickname: authorInfo.nickname,
            authorAvatar: authorInfo.avatarUrl
          };
        } catch (e) {
          return item;
        }
      });

      const postsWithUser = await Promise.all(fullDataPromises);

      const formattedPosts = postsWithUser.map(item => {
        const neededCount = item.expectedCount - item.currentCount;
        
        // --- [新增逻辑] 处理帖子图片：优先封面，次选图集第一张 ---
        let firstImage = '';
        if (item.coverImage) {
          firstImage = item.coverImage;
        } else if (item.imageUrls && item.imageUrls.length > 0) {
          firstImage = item.imageUrls[0];
        }

        return {
          id: item.id,
          userName: item.authorNickname || ("用户" + String(item.authorId).slice(-4)),
          userAvatar: item.authorAvatar || "/images/default-avatar.png",
          category: this.translateScene(item.scene),
          title: item.title,
          // 将处理好的图片路径放入数据
          postImage: firstImage, 
          location: item.location,
          time: this.formatDate(item.startTime),
          needed: neededCount > 0 ? neededCount : 0,
          tags: item.interestRequirements || []
        };
      });

      this.setData({
        displayPosts: formattedPosts
      });

    } catch (err) {
      console.error("首页数据接入失败:", err);
    }
  },

  getMomentEmoji(tags = []) {
    const str = tags.join('');
    if (str.includes('美食')) return '🍜';
    if (str.includes('学习')) return '📚';
    if (str.includes('运动')) return '🏃';
    if (str.includes('旅行')) return '✈️';
    if (str.includes('骑行')) return '🚲';
    return '✨';
  },

  getRandomBg() {
    const colors = ['#fffce8', '#eef2ff', '#f0fff4', '#fff1f2', '#f5f3ff'];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  translateScene(scene) {
    const dict = {
      'travel': '旅行', 'food': '干饭', 'study': '学习', 
      'sport': '运动', 'sports': '运动', 'ride': '骑行', 
      'game': '游戏', 'movie': '电影'
    };
    return dict[scene] || '其它';
  },

  formatDate(dateStr) {
    if (!dateStr) return "待定";
    const d = new Date(dateStr.replace(/-/g, '/').replace('T', ' '));
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  },

  onGoToNotice() { wx.navigateTo({ url: '/pages/notice/notice' }); },
  onGoToSquare() { wx.navigateTo({ url: '/pages/dynamicSquare/dynamicSquare' }); },
  onGoToGuide(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/dynamicDetail/dynamicDetail?id=${id}` });
  },
  onGoToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${id}` });
  }
});