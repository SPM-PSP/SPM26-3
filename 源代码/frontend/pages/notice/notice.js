// 对应ER图的通知表（点赞/关注/评论）
Page({
  data: {
    // 后续可对接接口，显示未读数量
    likeCount: 0,
    followCount: 0,
    commentCount: 0
  },

  // 跳转到点赞通知列表
  goLikeNotice() {
    wx.showToast({ title: "暂无点赞通知", icon: "none" });
  },
  // 跳转到关注通知列表
  goFollowNotice() {
    wx.showToast({ title: "暂无关注通知", icon: "none" });
  },
  // 跳转到评论通知列表
  goCommentNotice() {
    wx.showToast({ title: "暂无评论通知", icon: "none" });
  }
})