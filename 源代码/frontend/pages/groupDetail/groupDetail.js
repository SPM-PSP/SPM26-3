import {
  getUserProfile,
  quitOrDissolveGroup,
  updateGroupName
} from '../../utils/request.js';

Page({
  data: {
    groupInfo: {},
    groupMembers: [],
    currentUserId: '',
    isOwner: false
  },

  async onLoad() {
    const groupInfo =
      wx.getStorageSync('current_group_info') || {};

    const groupMembers =
      wx.getStorageSync('current_group_members') || [];

    try {
      const res = await getUserProfile();

      const currentUserId = String(res.data.id);
      console.log('groupInfo =', groupInfo);
      console.log('currentUserId =', currentUserId);
      console.log('ownerId =', groupInfo.ownerId);
      this.setData({
        groupInfo,
        groupMembers,
        currentUserId,
        
        isOwner:
          currentUserId === String(groupInfo.ownerId)
      });

    } catch (err) {
      console.error('获取用户失败', err);

      this.setData({
        groupInfo,
        groupMembers
      });
    }
  },

  async handleGroupAction() {
    const { isOwner, groupInfo } = this.data;

    wx.showModal({
      title: isOwner ? '解散群聊' : '退出群聊',

      content: isOwner
        ? '解散后所有成员将被移出群聊，是否继续？'
        : '确定退出该群聊吗？',

      confirmText: isOwner ? '解散' : '退出',

      confirmColor: '#EF4444',

      success: async (res) => {
        if (!res.confirm) return;

        try {
          wx.showLoading({
            title: isOwner ? '解散中' : '退出中'
          });

          await quitOrDissolveGroup(groupInfo.id);

          wx.hideLoading();

          wx.showToast({
            title: isOwner
              ? '群聊已解散'
              : '已退出群聊',

            icon: 'success'
          });

          setTimeout(() => {
            wx.navigateBack({
              delta: 2
            });
          }, 1200);

        } catch (err) {
          console.error(err);

          wx.hideLoading();

          wx.showToast({
            title: '操作失败',
            icon: 'none'
          });
        }
      }
    });
  },
  // 修改群名称
  async editGroupName() {

    wx.showModal({
      title: '修改群名称',
      editable: true,
      placeholderText: '请输入新的群名称',
  
      success: async (res) => {
  
        if (!res.confirm) return;
  
        const newName = res.content.trim();
  
        if (!newName) {
          wx.showToast({
            title: '群名称不能为空',
            icon: 'none'
          });
          return;
        }
  
        try {
  
          wx.showLoading({
            title: '修改中'
          });
  
          await updateGroupName(
            this.data.groupInfo.id,
            {
              groupName: newName
            }
          );
  
          wx.hideLoading();
  
          // 立即刷新页面
          this.setData({
            'groupInfo.name': newName
          });
  
          // 同步缓存
          const newGroupInfo = {
            ...this.data.groupInfo,
            name: newName
          };
  
          wx.setStorageSync(
            'current_group_info',
            newGroupInfo
          );
  
          wx.showToast({
            title: '修改成功',
            icon: 'success'
          });
  
        } catch (err) {
  
          console.error('修改群名失败', err);
  
          wx.hideLoading();
  
          wx.showToast({
            title: '修改失败',
            icon: 'none'
          });
  
        }
      }
    });
  }
});