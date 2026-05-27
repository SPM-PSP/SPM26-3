Page({
  data: {
    university: "上海交通大学",
    selectedCat: "全部",
    statusBarHeight: 20,
    categories: [
      { name: "全部", icon: "✨" },
      { name: "旅行", icon: "✈️" },
      { name: "学习", icon: "📚" },
      { name: "干饭", icon: "🍜" },
      { name: "运动", icon: "⚽" }
    ],
    allPosts: [ /* 之前的模拟数据添加 category 字段 */ ],
    displayPosts: []
  },

  onLoad() {
    const sys = wx.getSystemInfoSync();
    this.setData({ 
      statusBarHeight: sys.statusBarHeight,
      displayPosts: this.data.allPosts 
    });
  },

  // 修改学校预留
  onChangeUniversity() {
    wx.showToast({ title: '定位功能开发中', icon: 'none' });
  },

  // 消息跳转预留
  onGoToMessage() {
    wx.switchTab({ url: '/pages/message/message' });
  },

  // 场景筛选逻辑
  onSelectCategory(e) {
    const cat = e.currentTarget.dataset.name;
    this.setData({ selectedCat: cat });
    
    // 自动筛选显示相关内容
    if (cat === "全部") {
      this.setData({ displayPosts: this.data.allPosts });
    } else {
      const filtered = this.data.allPosts.filter(item => item.category === cat);
      this.setData({ displayPosts: filtered });
    }
  },

  // 模块点击变色逻辑
  onFeatureTap(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({ title: '进入' + (type==='post'?'发布':'攻略'), icon: 'none' });
    // 这里可以加逻辑跳转页面
  },

  // 跳转详情页接口
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${id}`
    });
  }
});