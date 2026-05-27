// pages/edit-profile/edit-profile.js
import {
  getUserProfile,
  updateUserProfile,
  uploadImage
} from '../../utils/request.js';

Page({
  data: {
    userInfo: {
      nickname: '',
      bio: '',
      avatarUrl: '',
      school: '',
      grade: '',
      gender: 0,
      interestTags: []
    },
    originalData: {},
    uploading: false,
    gradeOptions: ['大一', '大二', '大三', '大四', '研一', '研二', '研三', '博士', '其他'],
    selectedTags: [] ,  // 明确初始化为空数组
    allTags: [
      { id: 1, name: '运动', active: false },
      { id: 2, name: '读书', active: false },
      { id: 3, name: '音乐', active: false },
      { id: 4, name: '美食', active: false },
      { id: 5, name: '旅行', active: false },
      { id: 6, name: '摄影', active: false },
      { id: 7, name: '游戏', active: false },
      { id: 8, name: '宠物', active: false },
    ]
  },

  onLoad() {
    this.loadUserInfo();
  },

  async loadUserInfo() {
    wx.showLoading({ title: '加载中...' });
    try {
      const res = await getUserProfile();
      if (res.code === 200 && res.data) {
        const user = res.data;
        // 确保 interestTags 是数组，如果不是则置空
        let interestTags = user.interestTags;
        if (!Array.isArray(interestTags)) interestTags = [];
        
        const userInfo = {
          nickname: user.nickname || '',
          bio: user.bio || '',
          avatarUrl: user.avatarUrl || '',
          school: user.school || '',
          grade: user.grade || '',
          gender: user.gender ?? 0,
          interestTags: interestTags
        };

        console.log('后端返回的 interestTags:', interestTags, 'selectedTags 初始值:', [...interestTags]);
        
        this.setData({
          userInfo: userInfo,
          originalData: JSON.parse(JSON.stringify(userInfo)), // 深拷贝原始数据
          selectedTags: [...interestTags]   // 仅将用户已选择的标签填入，而不是全部标签
        });
        this.initTagActive();
      } else {
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  initTagActive() {
    let { allTags, userInfo } = this.data;
    let selectedNames = userInfo.interestTags || [];

    // 遍历标签，匹配到就设为选中
    allTags.forEach(tag => {
      tag.active = selectedNames.includes(tag.name);
    });

    this.setData({ allTags });
  },

  // 选择头像
  async chooseAvatar() {
    if (this.data.uploading) return;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ uploading: true });
        wx.showLoading({ title: '上传中...' });
        try {
          const uploadRes = await uploadImage(tempFilePath, 'avatar');
          if (uploadRes.code === 200 && uploadRes.data) {
            this.setData({ 'userInfo.avatarUrl': uploadRes.data });
            wx.showToast({ title: '上传成功', icon: 'success' });
          } else {
            throw new Error(uploadRes.message || '上传失败');
          }
        } catch (err) {
          console.error(err);
          wx.showToast({ title: '头像上传失败', icon: 'none' });
        } finally {
          wx.hideLoading();
          this.setData({ uploading: false });
        }
      }
    });
  },

  setNickname(e) { this.setData({ 'userInfo.nickname': e.detail.value }); },
  setBio(e) { this.setData({ 'userInfo.bio': e.detail.value }); },
  setSchool(e) { this.setData({ 'userInfo.school': e.detail.value }); },

  onGradeChange(e) {
    const index = e.detail.value;
    this.setData({ 'userInfo.grade': this.data.gradeOptions[index] });
  },

  setGender(e) {
    const gender = parseInt(e.currentTarget.dataset.gender);
    this.setData({ 'userInfo.gender': gender });
  },

  toggleTag(e) {
    const index = e.currentTarget.dataset.index;
    const tag = this.data.allTags[index];
    
    // 核心：直接取反 active 属性
    this.setData({
      [`allTags[${index}].active`]: !tag.active
    });

     // 重新获取选中标签，并同步到 userInfo
     const selectedNames = this.data.allTags
     .filter(item => item.active)
     .map(item => item.name);

    this.setData({
      'userInfo.interestTags': selectedNames
    });
  },

  // 获取所有已选中的标签（提交表单用）
  getSelectedTags() {
    const selectedList = this.data.allTags.filter(item => item.active);
    console.log('选中的标签：', selectedList);
    return selectedList;
  },

  async saveProfile() {
    const { userInfo, originalData } = this.data;
    
    // 检查是否有修改
    const isSame = (
      userInfo.nickname === originalData.nickname &&
      userInfo.bio === originalData.bio &&
      userInfo.avatarUrl === originalData.avatarUrl &&
      userInfo.school === originalData.school &&
      userInfo.grade === originalData.grade &&
      userInfo.gender === originalData.gender &&
      JSON.stringify(userInfo.interestTags) === JSON.stringify(originalData.interestTags)
    );
    if (isSame) {
      wx.showToast({ title: '未做任何修改', icon: 'none' });
      return;
    }
    if (!userInfo.nickname.trim()) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    try {
      const updateData = {};
      if (userInfo.nickname !== originalData.nickname) updateData.nickname = userInfo.nickname;
      if (userInfo.bio !== originalData.bio) updateData.bio = userInfo.bio;
      if (userInfo.avatarUrl !== originalData.avatarUrl) updateData.avatarUrl = userInfo.avatarUrl;
      if (userInfo.school !== originalData.school) updateData.school = userInfo.school;
      if (userInfo.grade !== originalData.grade) updateData.grade = userInfo.grade;
      if (userInfo.gender !== originalData.gender) updateData.gender = userInfo.gender;
      if (JSON.stringify(userInfo.interestTags) !== JSON.stringify(originalData.interestTags)) {
        updateData.interestTags = userInfo.interestTags;
      }

      const res = await updateUserProfile(updateData);
      if (res.code === 200) {
        const newUserInfo = { ...userInfo };
        wx.setStorageSync('user_info', newUserInfo);
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        wx.showToast({ title: res.message || '保存失败', icon: 'none' });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
})