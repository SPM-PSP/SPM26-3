// pages/login/login.js
import { loginByWechat } from "../../utils/request.js";

Page({
  data: {
    isAgree: false,
    logining: false
  },

  onLoad() {
    // 检查是否已登录
    const token = wx.getStorageSync('token') || wx.getStorageSync('user_token');
    if (token) {
      // 已登录，直接跳转
      wx.switchTab({
        url: '/pages/profile/profile'
      });
    }
  },

  // 切换协议勾选状态
  toggleAgree() {
    this.setData({
      isAgree: !this.data.isAgree
    });
  },

  // 微信授权登录
  async getUserProfile(e) {
    // 1. 判断是否勾选协议
    if (!this.data.isAgree) {
      wx.showToast({
        title: "请先同意用户协议",
        icon: "none"
      });
      return;
    }

    // 2. 防止重复点击
    if (this.data.logining) {
      return;
    }

    // 3. 检查授权结果（兼容新旧版本）
    // 新版本微信：使用 e.detail.errMsg
    // 旧版本微信：直接调用 wx.getUserProfile
    let userInfo = null;
    
    // 方式1：通过 button 的 getUserInfo 事件获取（已废弃，但兼容）
    if (e && e.detail) {
      if (e.detail.errMsg === "getUserInfo:ok") {
        userInfo = e.detail.userInfo;
      } else if (e.detail.errMsg && e.detail.errMsg !== "getUserInfo:ok") {
        wx.showToast({
          title: "需要授权才能登录",
          icon: "none"
        });
        return;
      }
    }

    this.setData({ logining: true });
    wx.showLoading({ title: "登录中...", mask: true });

    try {
      // 4. 获取微信登录 code
      const loginRes = await wx.login();
      const code = loginRes.code;
      
      if (!code) {
        throw new Error("获取登录凭证失败");
      }
      console.log("获取到code:", code);

      // 5. 如果没有获取到用户信息（新版微信），主动调用 getUserProfile
      if (!userInfo) {
        try {
          const profileRes = await new Promise((resolve, reject) => {
            wx.getUserProfile({
              desc: '用于完善用户资料',
              success: resolve,
              fail: reject
            });
          });
          userInfo = profileRes.userInfo;
          console.log("通过getUserProfile获取用户信息:", userInfo);
        } catch (profileErr) {
          console.error("获取用户信息失败:", profileErr);
          if (profileErr.errMsg === "getUserProfile:fail auth deny") {
            wx.showToast({
              title: "需要授权才能登录",
              icon: "none"
            });
          } else {
            wx.showToast({
              title: "获取用户信息失败",
              icon: "none"
            });
          }
          this.setData({ logining: false });
          wx.hideLoading();
          return;
        }
      }

      const { nickName, avatarUrl } = userInfo;
      console.log("用户信息:", { nickName, avatarUrl });

      // 6. 调用后端登录接口
      const res = await loginByWechat({
        code: code,
        nickname: nickName,
        avatarUrl: avatarUrl
      });

      console.log("登录接口返回:", res);

      // 7. 处理登录结果
      if (res.code === 200) {
        // 存储 token 和用户信息
        const token = res.data?.token || res.data?.accessToken;
        const userData = res.data?.user || res.data?.userInfo;
        
        if (token) {
          wx.setStorageSync("token", token);
          wx.setStorageSync("user_token", token);
        }
        
        if (userData) {
          wx.setStorageSync("userInfo", userData);
        } else {
          // 如果后端没有返回用户信息，存储前端获取的
          wx.setStorageSync("userInfo", {
            nickname: nickName,
            avatar: avatarUrl
          });
        }

        wx.hideLoading();
        wx.showToast({
          title: "登录成功",
          icon: "success",
          duration: 1500
        });

        // 8. 跳转到个人主页
        setTimeout(() => {
          wx.switchTab({
            url: "/pages/profile/profile",
            fail: (err) => {
              console.error("跳转失败:", err);
              // 如果 switchTab 失败，尝试 reLaunch
              wx.reLaunch({
                url: "/pages/home/home"
              });
            }
          });
        }, 1500);
      } else {
        throw new Error(res.message || "登录失败");
      }
    } catch (err) {
      console.error("登录异常:", err);
      wx.hideLoading();
      
      let errorMsg = "登录失败，请重试";
      if (err.message === "获取登录凭证失败") {
        errorMsg = "获取登录凭证失败，请重试";
      } else if (err.message && err.message.includes("code")) {
        errorMsg = "登录凭证失效，请重试";
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      wx.showToast({
        title: errorMsg,
        icon: "none",
        duration: 2000
      });
    } finally {
      this.setData({ logining: false });
    }
  },

  // 跳转到用户协议
  goToAgreement() {
    wx.navigateTo({
      url: '/pages/agreement/agreement'
    });
  },

  // 跳转到隐私政策
  goToPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    });
  }
});