import {
  publishPal,
  uploadImage
} from '../../utils/request';

Page({
  data: {
    tabIndex: 0,
    scene: '',

    title: '',

    location: '',
    region: ['请选择', '', ''],
    detailLocation: '',
    date: '',

    time: '',

    number: 2,

    description: '',

    imgList: [],

    submitting: false,

    sceneOptions: [
      { label: '旅行', value: 'travel' },
      { label: '学习', value: 'study' },
      { label: '干饭', value: 'meal' },
      { label: '运动', value: 'sport' },
      { label: '游戏', value: 'game' },
      { label: '观影', value: 'movie' }
    ],

    tags: [],

    tagOptions: [
      { name: '女生优先', type: 'gender', active: false },
      { name: 'AA制', type: 'interest', active: false },
      { name: '拍照控', type: 'interest', active: false },
      { name: '不挑食', type: 'interest', active: false },
      { name: '自律', type: 'interest', active: false },
      { name: '晨起打卡', type: 'interest', active: false },
      { name: '说走就走', type: 'interest', active: false },
      { name: '考研', type: 'interest', active: false }
    ]
  },

  getInitialFormData() {
    return {
      tabIndex: 0,
      scene: '',
      title: '',
      location: '',
      region: ['请选择', '', ''],
      detailLocation: '',
      date: '',
      time: '',
      number: 2,
      description: '',
      imgList: [],
      tags: [],
      tagOptions: this.data.tagOptions.map(item => ({
        ...item,
        active: false
      }))
    };
  },

  resetForm() {
    this.setData(this.getInitialFormData());
  },

  onShow() {
    if (this.getTabBar) this.getTabBar().setData({ selected: 2 });
  },

  setTitle(e) {
    this.setData({
      title: e.detail.value
    });
  },

  setLocation(e) {
    this.setData({
      location: e.detail.value
    });
  },

  setDescription(e) {
    this.setData({
      description: e.detail.value
    });
  },

  selectScene(e) {
    this.setData({
      scene: e.currentTarget.dataset.scene
    });
  },

  selectNumber(e) {
    this.setData({
      number: Number(e.currentTarget.dataset.num)
    });
  },

  toggleTag(e) {
    const tag = e.currentTarget.dataset.tag;

    const tagOptions = this.data.tagOptions.map(item => {
      if (item.name === tag) {
        return {
          ...item,
          active: !item.active
        };
      }

      return item;
    });

    const tags = tagOptions
      .filter(item => item.active)
      .map(item => item.name);

    this.setData({
      tagOptions,
      tags
    });
  },

  onDateChange(e) {
    this.setData({
      date: e.detail.value
    });
  },

  onTimeChange(e) {
    this.setData({
      time: e.detail.value
    });
  },

  chooseImage() {
    const remainCount = 9 - this.data.imgList.length;

    if (remainCount <= 0) {
      wx.showToast({
        title: '最多上传9张',
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

    this.setData({
      imgList: this.data.imgList.filter(
        (_, i) => i !== index
      )
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

  async submitPal() {
    if (this.data.submitting) {
      return;
    }

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
      scene,
      title,
      region,
      detailLocation,
      date,
      time,
      number,
      description,
      imgList,
      tagOptions
    } = this.data;

    const titleText = title.trim();
    const detailText = detailLocation.trim();

    const regionText = region.filter(item => item &&item !== '请选择').join('');

    const locationText = regionText + detailText;
    const contentText = description.trim();

    if (!scene) {
      wx.showToast({
        title: '请选择场景',
        icon: 'none'
      });

      return;
    }

    if (!titleText) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      });

      return;
    }

    if (!contentText) {
      wx.showToast({
        title: '请输入描述',
        icon: 'none'
      });

      return;
    }

    if (!locationText) {
      wx.showToast({
        title: '请输入地点',
        icon: 'none'
      });

      return;
    }

    if (!date || !time) {
      wx.showToast({
        title: '请选择时间',
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

      const uploadTasks = imgList.map(async (path) => {
        if (this.isRemoteUrl(path)) {
          return path;
        }

        const res = await uploadImage(path);

        return this.getUploadUrl(res);
      });

      const imageUrls = (await Promise.all(uploadTasks)).filter(Boolean);

      const selectedTags = tagOptions.filter(item => item.active);
      const genderRequirement = selectedTags.some(
        item => item.type === 'gender' && item.name === '女生优先'
      ) ? 1 : 0;

      const interestRequirements = selectedTags
        .filter(item => item.type === 'interest')
        .map(item => item.name);

      await publishPal({
        scene,
        title: titleText,
        content: contentText,
        location: locationText,
        startTime: `${date}T${time}:00`,
        expectedCount: number,
        genderRequirement,
        gradeRequirement: [],
        interestRequirements,
        coverImage: imageUrls[0] || '',
        imageUrls
      });

      wx.showToast({
        title: '发布成功',
        icon: 'success'
      });

      this.resetForm();

      setTimeout(() => {
        wx.switchTab({
          url: '/pages/home/home'
        });
      }, 1200);

    } catch (err) {
      console.error('发布搭子帖失败', err);

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

  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({ tabIndex: index });
  },

  isRemoteUrl(url) {
    if (!url) return false;
  
    if (url.startsWith('http://tmp/')) {
      return false;
    }
  
    return /^https?:\/\//.test(url);
  },
  onRegionChange(e) {
    this.setData({
      region: e.detail.value
    });
  },
  
  setDetailLocation(e) {
    this.setData({
      detailLocation: e.detail.value
    });
  },
  
});
