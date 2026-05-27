// pages/search/search.js
import { getPalList, getOtherUserProfile } from '../../utils/request.js';

// 数据库 scene 对应关系
const sceneMap = {
  "全部": "",
  "旅游": "travel",
  "学习": "study",
  "干饭": "meal",
  "运动": "sport", 
  "更多": ["game", "movie", "ride"]
};

Page({
  data: {
    statusBarHeight: 20,
    searchKeyword: "",
    selectedInterest: "全部",
    filterTime: "全部时间",
    filterSort: "智能推荐",
    isLoading: false,
    interests: [
      { name: "全部", icon: "🧊", color: "#f0edff" },
      { name: "旅游", icon: "✈️", color: "#e3f7ff" },
      { name: "学习", icon: "📖", color: "#e8f9e8" },
      { name: "干饭", icon: "🍜", color: "#fff2e8" },
      { name: "运动", icon: "🏃", color: "#ffedf5" },
      { name: "更多", icon: "···", color: "#f5f5f5" }
    ],
    allFetchedPosts: [],
    displayPosts: []
  },

  onLoad() {
    const info = wx.getWindowInfo();
    this.setData({ statusBarHeight: info.statusBarHeight });
    this.apiFetchData();
  },

  onShow() {
    if (this.getTabBar) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  async apiFetchData() {
    this.setData({ isLoading: true });
    const params = {};
    if (this.data.searchKeyword) {
      params.keyword = this.data.searchKeyword;
    }

    try {
      const res = await getPalList(params);
      if (res.code === 200 && res.data) {
        // 并发补全作者信息
        const fullDataPromises = res.data.map(async (item) => {
          try {
            const userRes = await getOtherUserProfile(item.authorId);
            return {
              ...item,
              authorNickname: userRes.data.nickname,
              authorAvatar: userRes.data.avatarUrl
            };
          } catch (e) {
            return item;
          }
        });

        const postsWithUser = await Promise.all(fullDataPromises);

        const list = postsWithUser.map(item => {
          return this.formatPostItem(item);
        });

        this.setData({ allFetchedPosts: list }, () => {
          this.applyFiltersAndSorts();
        });
      }
    } catch (err) {
      console.error("获取帖子失败:", err);
    } finally {
      this.setData({ isLoading: false });
    }
  },

  applyFiltersAndSorts() {
    let list = [...this.data.allFetchedPosts];
    const { selectedInterest, filterSort, filterTime } = this.data;

    if (selectedInterest !== "全部") {
      const targetScene = sceneMap[selectedInterest];
      list = list.filter(item => {
        if (Array.isArray(targetScene)) {
          return targetScene.includes(item._rawScene);
        }
        return item._rawScene === targetScene;
      });
    }

    if (filterTime === '今天') {
      const today = new Date().toDateString();
      list = list.filter(item => new Date(item._rawTime).toDateString() === today);
    } else if (filterTime === '一周内') {
      const weekAgo = new Date().getTime() - 7 * 24 * 60 * 60 * 1000;
      list = list.filter(item => new Date(item._rawTime).getTime() > weekAgo);
    }

    if (filterSort === '最新发布') {
      list.sort((a, b) => b.id - a.id);
    } else if (filterSort === '最热门') {
      list.sort((a, b) => b.currentCount - a.currentCount);
    } else if (filterSort === '即将满员') {
      list.sort((a, b) => a.needed - b.needed);
    }

    this.setData({ displayPosts: list });
  },

  formatPostItem(item) {
    const neededCount = item.expectedCount - item.currentCount;
    
    // --- [新增逻辑] 处理帖子图片 ---
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
      avatarColor: item.scene === 'travel' ? '#4facfe' : '#7c66f5',
      category: this.translateScene(item.scene),
      title: item.title,
      desc: item.content,
      postImage: firstImage, // 帖子配图
      tags: item.interestRequirements || [],
      location: item.location,
      time: this.formatDate(item.startTime),
      needed: neededCount > 0 ? neededCount : 0,
      currentCount: item.currentCount,
      _rawScene: item.scene,
      _rawTime: item.startTime,
      decoration: item.scene === 'travel' ? '✈️' : '🍜'
    };
  },

  translateScene(scene) {
    const map = { travel:'旅游', study:'学习', food:'干饭', sports:'运动', game:'游戏', movie:'影视', ride:'骑行' };
    return map[scene] || '其它';
  },

  formatDate(dateStr) {
    if (!dateStr) return '待定';
    const d = new Date(dateStr.replace(/-/g, '/').replace('T', ' '));
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  },

  onSelectInterest(e) {
    const name = e.currentTarget.dataset.name;
    this.setData({ selectedInterest: name }, () => {
      this.applyFiltersAndSorts();
    });
  },

  onSearchInput(e) { this.setData({ searchKeyword: e.detail.value }); },
  apiSearch() { this.apiFetchData(); },
  apiRefresh() {
    this.apiFetchData().then(() => {
      wx.showToast({ title: '已刷新', icon: 'success' });
    });
  },
  apiGoToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/post-detail/post-detail?id=${id}` });
  },

  apiShowTimeMenu() {
    const menus = ['今天', '一周内', '全部时间'];
    wx.showActionSheet({
      itemList: menus,
      success: (res) => {
        this.setData({ filterTime: menus[res.tapIndex] });
        this.applyFiltersAndSorts();
      }
    });
  },

  apiShowHotMenu() {
    const menus = ['智能推荐', '最新发布', '最热门', '即将满员'];
    wx.showActionSheet({
      itemList: menus,
      success: (res) => {
        this.setData({ filterSort: menus[res.tapIndex] });
        this.applyFiltersAndSorts();
      }
    });
  }
});