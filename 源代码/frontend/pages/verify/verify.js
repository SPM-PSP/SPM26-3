import {
  getStudentVerifyStatus,
  applyStudentVerify,
  uploadImage
} from '../../utils/request.js';

Page({
  data: {
    form: {
      realName: '',
      studentNo: '',
      school: '',
      proofImageUrl: ''
    },
    submitting: false,
    canEdit: true,
    statusMsg: '',
    verified: false,
    isFormComplete: false 
  },

  onLoad() {
    this.loadStatus();
  },

  async loadStatus() {
    try {
      const res = await getStudentVerifyStatus();
      if (res.code === 200 && res.data) {
        const { status, application } = res.data; // status: 0未认证,1审核中,2已认证,3失败
        let canEdit = true;
        let statusMsg = '';
        let verified = false;

        switch (status) {
          case 0: // 未认证
            canEdit = true;
            statusMsg = '';
            verified = false;
            // 清空表单（可选，如果希望用户全新填写）
            this.setData({
              form: { realName: '', studentNo: '', school: '', proofImageUrl: '' }
            });
            break;
          case 1: // 审核中
            canEdit = false;
            statusMsg = '认证审核中，请耐心等待';
            verified = false;
            break;
          case 2: // 已认证
            canEdit = false;
            statusMsg = '您已通过学生认证';
            verified = true;
            break;
          case 3: // 失败
            canEdit = true;
            statusMsg = application?.rejectReason ? `认证被拒绝，原因：${application.rejectReason}` : '认证失败，请重新提交';
            verified = false;
            // 回填上次申请的表单数据，方便用户修改
            if (application) {
              this.setData({
                form: {
                  realName: application.realName || '',
                  studentNo: application.studentNo || '',
                  school: application.school || '',
                  proofImageUrl: application.proofImageUrl || ''
                }
              });
            }
            break;
          default:
            canEdit = true;
            break;
        }
        this.setData({ canEdit, statusMsg, verified });
      } else {
        // 从未提交过申请，状态为 0
        this.setData({ canEdit: true, statusMsg: '', verified: false });
      }
    } catch (err) {
      console.error('获取认证状态失败', err);
      // 出错时默认允许编辑
      this.setData({ canEdit: true });
    }
  },

  onRealNameInput(e) {
    this.setData({ 'form.realName': e.detail.value });
    this.checkFormComplete();
  },
  onStudentNoInput(e) {
    this.setData({ 'form.studentNo': e.detail.value });
    this.checkFormComplete();
  },
  onSchoolInput(e) {
    this.setData({ 'form.school': e.detail.value });
    this.checkFormComplete();
  },

  async chooseImage() {
    if (!this.data.canEdit) {
      wx.showToast({ title: '当前状态不可修改', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        wx.showLoading({ title: '上传中...' });
        try {
          const uploadRes = await uploadImage(tempFilePath, 'verify');
          if (uploadRes.code === 200 && uploadRes.data) {
            this.setData({ 'form.proofImageUrl': uploadRes.data });
            wx.showToast({ title: '上传成功', icon: 'success' });
            this.checkFormComplete();
          } else {
            throw new Error(uploadRes.message || '上传失败');
          }
        } catch (err) {
          console.error(err);
          wx.showToast({ title: '图片上传失败', icon: 'none' });
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  checkFormComplete() {
    const { realName, studentNo, school, proofImageUrl } = this.data.form;
    const isComplete = realName.trim() !== '' && studentNo.trim() !== '' && school.trim() !== '' && proofImageUrl !== '';
    this.setData({ isFormComplete: isComplete });
  },

  async submitVerify() {
    const { realName, studentNo, school, proofImageUrl } = this.data.form;
    if (!realName.trim()) {
      wx.showToast({ title: '请填写真实姓名', icon: 'none' });
      return;
    }
    if (!studentNo.trim()) {
      wx.showToast({ title: '请填写学号', icon: 'none' });
      return;
    }
    if (!school.trim()) {
      wx.showToast({ title: '请填写学校', icon: 'none' });
      return;
    }
    if (!proofImageUrl) {
      wx.showToast({ title: '请上传证明材料', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const res = await applyStudentVerify({
        realName: realName.trim(),
        studentNo: studentNo.trim(),
        school: school.trim(),
        proofImageUrl
      });
      if (res.code === 200) {
        wx.showToast({ title: '提交成功，等待审核', icon: 'success' });
        await this.loadStatus();
      } else {
        wx.showToast({ title: res.message || '提交失败', icon: 'none' });
      }
    } catch (err) {
      console.error(err);
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  }
});