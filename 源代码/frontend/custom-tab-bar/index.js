Component({
  data: {
    color: "#515151",
    selectedColor: "#a1c4fd",
    backgroundColor: "#ffffff",
    selected: 0,
    list: [
      {
        pagePath: "pages/home/home",
        text: "首页",
        iconPath: "/images/tab/home.png",
        selectedIconPath: "/images/tab/home_active.png"
      },
      {
        pagePath: "pages/search/search",
        text: "找搭子",
        iconPath: "/images/tab/search.png",
        selectedIconPath: "/images/tab/search_active.png"
      },
      {
        pagePath: "pages/releasePal/releasePal",
        text: "",
        bulge: true,
        iconPath: "/images/tab/publish.png",
        selectedIconPath: "/images/tab/publish.png"
      },
      {
        pagePath: "pages/message/message",
        text: "消息",
        iconPath: "/images/tab/message.png",
        selectedIconPath: "/images/tab/message_active.png"
      },
      {
        pagePath: "pages/profile/profile",
        text: "我的",
        iconPath: "/images/tab/me.png",
        selectedIconPath: "/images/tab/me_active.png"
      }
    ]
  },

  // ✅ 修复：加个判断，防止页面未加载时报错
  attached() {
    const pages = getCurrentPages();
    // 关键修复：如果没有页面，直接返回
    if (!pages || pages.length === 0) return;
    
    const currentPage = pages[pages.length - 1];
    // 关键修复：如果页面不存在，也返回
    if (!currentPage) return;

    const path = currentPage.route;
    const index = this.data.list.findIndex(item => item.pagePath === path);
    
    this.setData({
      selected: index !== -1 ? index : 0
    });
  },

  methods: {
    switchTab(e) {
      const { path, index } = e.currentTarget.dataset;
      this.setData({ selected: index });
      
      wx.switchTab({
        url: `/${path}`,
        fail: err => console.error("跳转失败：", err)
      });
    }
  }
})