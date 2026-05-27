import {
  getPalDetail,
  editPal,
  uploadImage
} from '../../utils/request';

Page({
  data: {
    palId: '',

    scene: '',

    title: '',

    region: ['北京市', '北京市', '朝阳区'],
    locationDetail: '',

    date: '',

    time: '',

    number: 2,

    description: '',

    imgList: [],

    tags: [],

    submitting: false,

    sceneOptions: [
      { label: '旅行', value: 'travel' },
      { label: '学习', value: 'study' },
      { label: '干饭', value: 'meal' },
      { label: '运动', value: 'sport' },
      { label: '游戏', value: 'game' },
      { label: '观影', value: 'movie' }
    ],

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

  onLoad(options) {
    const palId = options.id || '';

    if (!palId) {
      wx.showToast({
        title: '帖子不存在',
        icon: 'none'
      });
      return;
    }

    this.setData({
      palId
    });

    this.loadPostDetail(palId);
  },

  async loadPostDetail(postId) {
    try {
      wx.showLoading({
        title: '加载中'
      });

      const res = await getPalDetail(postId);
      const data = res.data || {};

      const dateTime = this.splitDateTime(data.startTime);
      const interestRequirements = data.interestRequirements || [];

      const tagOptions = this.data.tagOptions.map(item => ({
        ...item,
        active:
          (
            item.type === 'interest' &&
            interestRequirements.includes(item.name)
          ) ||
          (
            item.type === 'gender' &&
            item.name === '女生优先' &&
            data.genderRequirement === 1
          )
      }));

      const imgList = data.imageUrls && data.imageUrls.length > 0
        ? data.imageUrls
        : (
            data.coverImage
              ? [data.coverImage]
              : []
          );

      this.setData({
        scene: data.scene || '',
        title: data.title || '',
        region: this.parseRegion(data.location).region,
        locationDetail: this.parseRegion(data.location).detail,
        date: dateTime.date,
        time: dateTime.time,
        number: data.expectedCount || 2,
        description: data.content || '',
        imgList,
        tags: tagOptions
          .filter(item => item.active)
          .map(item => item.name),
        tagOptions
      });

    } catch (err) {
      console.error('获取帖子详情失败', err);

      wx.showToast({
        title: '加载失败',
        icon: 'none'
      });

    } finally {
      wx.hideLoading();
    }
  },

  setTitle(e) {
    this.setData({
      title: e.detail.value
    });
  },

  setLocationDetail(e) {
    this.setData({
      locationDetail: e.detail.value
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

  async updatePal() {
    if (this.data.submitting) {
      return;
    }

    const {
      palId,
      scene,
      title,
      region,
      locationDetail,
      date,
      time,
      number,
      description,
      imgList,
      tagOptions
    } = this.data;

    const titleText = title.trim();
    const detailText = locationDetail.trim();

    const locationText = `${region[0]}|${region[1]}|${region[2]}|${detailText}`;
    const contentText = description.trim();

    if (!palId) {
      wx.showToast({
        title: '帖子不存在',
        icon: 'none'
      });
      return;
    }

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
        title: '保存中'
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

      await editPal(palId, {
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
        title: '编辑成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1200);

    } catch (err) {
      console.error('编辑失败', err);

      wx.showToast({
        title: '编辑失败',
        icon: 'none'
      });

    } finally {
      wx.hideLoading();

      this.setData({
        submitting: false
      });
    }
  },

  splitDateTime(dateTime) {
    if (!dateTime) {
      return {
        date: '',
        time: ''
      };
    }

    const normalized = dateTime.replace(' ', 'T');
    const arr = normalized.split('T');

    return {
      date: arr[0] || '',
      time: arr[1]
        ? arr[1].slice(0, 5)
        : ''
    };
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
  },
  parseRegion(locationText = '') {
    if (!locationText) {
      return {
        region: ['北京市', '北京市', '朝阳区'],
        detail: ''
      };
    }
  
    const arr = locationText.split('|');
  
    if (arr.length >= 4) {
      return {
        region: [arr[0], arr[1], arr[2]],
        detail: arr.slice(3).join(' ')
      };
    }
  
    return {
      region: ['北京市', '北京市', '朝阳区'],
      detail: locationText
    };
  },
  onRegionChange(e) {
    this.setData({
      region: e.detail.value
    });
  },
});
