import {
  publishDynamic,
  uploadImage
} from '../../utils/request';

Page({
  data: {
    title: '',
    content: '',
    location: '',

    tags: [],

    imgList: [],

    tagsList: [
      { name: '旅行攻略', value: '旅行', active: false },
      { name: '学习方法', value: '学习', active: false },
      { name: '干饭推荐', value: '干饭', active: false },
      { name: '运动技巧', value: '运动', active: false }
    ],

    submitting: false
  },

  setTitle(e) {
    this.setData({
      title: e.detail.value
    });
  },

  setContent(e) {
    this.setData({
      content: e.detail.value
    });
  },

  setLocation(e) {
    this.setData({
      location: e.detail.value
    });
  },

  toggleTag(e) {
    const name = e.currentTarget.dataset.name;

    const tagsList = this.data.tagsList.map(item => {
      if (item.name === name) {
        return {
          ...item,
          active: !item.active
        };
      }

      return item;
    });

    const tags = tagsList
      .filter(item => item.active)
      .map(item => item.value);

    this.setData({
      tagsList,
      tags
    });
  },

  chooseImage() {
    const remainCount = 9 - this.data.imgList.length;

    if (remainCount <= 0) {
      wx.showToast({
        title: '最多上传9张图片',
        icon: 'none'
      });

      return;
    }

    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],

      success: (res) => {
        const newImages = (res.tempFiles || []).map(
          item => item.tempFilePath
        );

        this.setData({
          imgList: [
            ...this.data.imgList,
            ...newImages
          ]
        });
      }
    });
  },

  deleteImage(e) {
    const index = Number(e.currentTarget.dataset.index);

    const imgList = this.data.imgList.filter(
      (_, i) => i !== index
    );

    this.setData({
      imgList
    });
  },

  previewImage(e) {
    const current = e.currentTarget.dataset.url;
    const urls = this.data.imgList;

    if (!current || !urls.length) return;

    wx.previewImage({
      current,
      urls
    });
  },

  async submitDynamic() {
    if (this.data.submitting) return;

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

    const {
      title,
      content,
      location,
      tags,
      imgList
    } = this.data;

    const titleText = title.trim();
    const contentText = content.trim();
    const locationText = location.trim();

    if (!titleText) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      });

      return;
    }

    if (!contentText) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });

      return;
    }

    try {
      this.setData({
        submitting: true
      });

      wx.showLoading({
        title: '发布中'
      });
      console.log('待上传图片:', imgList);

      const uploadTasks = imgList.map(async (path) => {
        if (this.isRemoteUrl(path)) {
          return path;
        }

        const res = await uploadImage(path);

        return this.getUploadUrl(res);
      });

      const imageUrls = await Promise.all(uploadTasks);

      const media = imageUrls
        .filter(Boolean)
        .map((url, index) => ({
          mediaType: 0,
          mediaUrl: url,
          sortNo: index
        }));

      await publishDynamic({
        scene: 'moment',
        title: titleText,
        content: contentText,
        location: locationText,
        tags,
        status: 0,
        media
      });

      wx.showToast({
        title: '发布成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1200);

    } catch (err) {
      console.error('发布失败', err);

      wx.showToast({
        title: '发布失败',
        icon: 'none'
      });

    } finally {
      wx.hideLoading();

      this.setData({
        submitting: false
      });
    }
  },

  getUploadUrl(res) {
    const data = res.data;

    if (typeof data === 'string') {
      return data;
    }

    if (Array.isArray(data)) {
      return data[0] || '';
    }

    if (data && typeof data === 'object') {
      return data.url || data.fileUrl || data.mediaUrl || '';
    }

    return '';
  },

  isRemoteUrl(url) {
    if (!url) return false;
  
    if (url.startsWith('http://tmp/')) {
      return false;
    }
  
    return /^https?:\/\//.test(url);
  }
  
  
});
