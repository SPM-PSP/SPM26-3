const BASE_URL = 'http://localhost:8080';
const TOKEN_KEY = 'token';

const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync(TOKEN_KEY) || '';

    const url = BASE_URL + options.url;
    const method = options.method || 'GET';
    const data = options.data || {};
    const header = {
      Authorization: token ? `Bearer ${token}` : '',
      'content-type': 'application/json'
    };

    console.log('请求地址:', url);
    console.log('请求方法:', method);
    console.log('请求参数:', data);
    console.log('请求头:', header);

    wx.request({
      url,
      method,
      data,
      header,
      timeout: 30000,
      success: (res) => {
        console.log('响应状态:', res.statusCode);
        console.log('响应数据:', res.data);

        const result = res.data || {};

        if (res.statusCode === 401 || result.status === 401 || result.code === 401) {
          wx.showToast({
            title: '登录已失效',
            icon: 'none'
          });
          reject(result);
          return;
        }

        if (result.code === 200) {
          resolve(result);
          return;
        }

        wx.showToast({
          title: result.message || result.error || '请求失败',
          icon: 'none'
        });
        reject(result);
      },
      fail: (err) => {
        console.error('请求失败:', err);

        wx.showToast({
          title: err.errMsg && err.errMsg.includes('timeout')
            ? '请求超时'
            : '网络异常',
          icon: 'none'
        });

        reject(err);
      }
    });
  });
};

const COS = require('./cos-wx-sdk-v5');

const COS_BUCKET = 'palstar-1429796209';
const COS_REGION = 'ap-chengdu';

const getToken = () => {
  return wx.getStorageSync(TOKEN_KEY) || wx.getStorageSync('user_token') || '';
};

const buildAuthHeader = (token) => {
  if (!token) return '';

  return token.startsWith('Bearer ')
    ? token
    : `Bearer ${token}`;
};

const getFileExtension = (filePath) => {
  const cleanPath = filePath.split('?')[0];
  const index = cleanPath.lastIndexOf('.');

  return index >= 0
    ? cleanPath.substring(index)
    : '.jpg';
};

const uploadImage = (filePath, dir = 'moment') => {
  return new Promise((resolve, reject) => {
    const token = getToken();

    if (!filePath) {
      reject(new Error('图片路径为空'));
      return;
    }

    console.log('准备上传图片:', filePath);

    wx.request({
      url: BASE_URL + '/api/v1/cos/upload',
      method: 'GET',
      header: {
        Authorization: buildAuthHeader(token)
      },
      success: (stsRes) => {
        console.log('COS凭证响应:', stsRes.data);

        const responseData = stsRes.data || {};

        if (stsRes.statusCode === 401 || responseData.status === 401 || responseData.code === 401) {
          wx.showToast({
            title: '登录已失效',
            icon: 'none'
          });

          reject(responseData);
          return;
        }

        if (responseData.code !== 200 || !responseData.data) {
          wx.showToast({
            title: responseData.message || '获取上传凭证失败',
            icon: 'none'
          });

          reject(responseData);
          return;
        }

        const data = responseData.data;
        const credentials = data.credentials || {};

        if (!credentials.tmpSecretId || !credentials.tmpSecretKey || !credentials.token) {
          wx.showToast({
            title: '上传凭证异常',
            icon: 'none'
          });

          reject(responseData);
          return;
        }

        const extension = getFileExtension(filePath);
        const cosPath = `${dir}/${Date.now()}-${Math.floor(Math.random() * 100000)}${extension}`;

        const cos = new COS({
          getAuthorization: (options, callback) => {
            callback({
              TmpSecretId: credentials.tmpSecretId,
              TmpSecretKey: credentials.tmpSecretKey,
              XCosSecurityToken: credentials.token,
              StartTime: data.startTime,
              ExpiredTime: data.expiredTime
            });
          }
        });

        wx.showLoading({
          title: '上传中 0%'
        });

        cos.putObject({
          Bucket: COS_BUCKET,
          Region: COS_REGION,
          Key: cosPath,
          FilePath: filePath,
          onProgress: (progressData) => {
            const percent = Math.round((progressData.percent || 0) * 100);

            wx.showLoading({
              title: `上传中 ${percent}%`
            });
          }
        }, (err, cosData) => {
          wx.hideLoading();

          if (err) {
            console.error('COS上传失败:', err);

            wx.showToast({
              title: '图片上传失败',
              icon: 'none'
            });

            reject(err);
            return;
          }

          const imageUrl = cosData.Location
            ? `https://${cosData.Location}`
            : `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com/${cosPath}`;

          console.log('COS上传成功:', imageUrl);

          resolve({
            code: 200,
            message: '上传成功',
            data: imageUrl
          });
        });
      },
      fail: (err) => {
        console.error('获取COS凭证失败:', err);

        wx.showToast({
          title: '获取上传凭证失败',
          icon: 'none'
        });

        reject(err);
      }
    });
  });
};


/* 用户 */
export const loginByWechat = (data) => request({
  url: '/api/v1/auth/login/wechat',
  method: 'POST',
  data
});

export const getUserProfile = () => request({
  url: '/api/v1/user/profile',
  method: 'GET'
});

export const getOtherUserProfile = (userId) => request({
  url: `/api/v1/user/${userId}/profile`,
  method: 'GET'
});


export const updateUserProfile = (data) => request({
  url: '/api/v1/user/profile',
  method: 'PUT',
  data
});

export const followUser = (userId) => request({
  url: `/api/v1/user/${userId}/follow`,
  method: 'POST'
});

export const unfollowUser = (userId) => request({
  url: `/api/v1/user/${userId}/follow`,
  method: 'DELETE'
});

// ========== 用户搜索与列表 ==========

// 搜索用户
export const searchUsers = (keyword) => request({
  url: '/api/v1/users/search',
  method: 'GET',
  data: { keyword }
});

// 获取粉丝列表
export const getFollowers = (userId) => request({
  url: `/api/v1/user/${userId}/followers`,
  method: 'GET'
});

// 获取关注列表
export const getFollowing = (userId) => request({
  url: `/api/v1/user/${userId}/following`,
  method: 'GET'
});

export const getMyApplications = () => request({
  url: '/api/v1/applications/me',
  method: 'GET'
});

// ========== 我的列表 ==========

// 我点赞的动态
export const getMyLikedMoments = () => request({
  url: '/api/v1/moments/me/likes',
  method: 'GET'
});

// 我收藏的动态
export const getMyFavoritedMoments = () => request({
  url: '/api/v1/moments/me/favorites',
  method: 'GET'
});

// 我发布的评论
export const getMyComments = () => request({
  url: '/api/v1/moments/me/comments',
  method: 'GET'
});

/* 学生认证相关接口 */
export const applyStudentVerify = (data) => request({
  url: '/api/v1/verification/student/apply',
  method: 'POST',
  data
});

export const getStudentVerifyStatus = () => request({
  url: '/api/v1/verification/student/status',
  method: 'GET'
});
/* 动态 Moment */
export const publishDynamic = (data) => request({
  url: '/api/v1/moments',
  method: 'POST',
  data
});

export const getMomentList = (params = {}) => request({
  url: '/api/v1/moments',
  method: 'GET',
  data: params
});

export const getMomentDetail = (momentId) => request({
  url: `/api/v1/moments/${momentId}`,
  method: 'GET'
});

export const updateMoment = (momentId, data) => request({
  url: `/api/v1/moments/${momentId}`,
  method: 'PUT',
  data
});

export const deleteMoment = (momentId) => request({
  url: `/api/v1/moments/${momentId}`,
  method: 'DELETE'
});

export const likeDynamic = (momentId) => request({
  url: `/api/v1/moments/${momentId}/like`,
  method: 'POST'
});

export const unlikeDynamic = (momentId) => request({
  url: `/api/v1/moments/${momentId}/like`,
  method: 'DELETE'
});

export const favoriteDynamic = (momentId) => request({
  url: `/api/v1/moments/${momentId}/favorite`,
  method: 'POST'
});

export const unfavoriteDynamic = (momentId) => request({
  url: `/api/v1/moments/${momentId}/favorite`,
  method: 'DELETE'
});

export const addComment = (momentId, data) => request({
  url: `/api/v1/moments/${momentId}/comment`,
  method: 'POST',
  data
});

export const getMomentComments = (momentId) => request({
  url: `/api/v1/moments/${momentId}/comment`,
  method: 'GET'
});

export const deleteMomentComment = (commentId) => request({
  url: `/api/v1/moments/comment/${commentId}`,
  method: 'DELETE'
});

/* 搭子帖 PalPost */
export const publishPal = (data) => request({
  url: '/api/v1/post',
  method: 'POST',
  data
});

export const getPalList = (params = {}) => request({
  url: '/api/v1/post',
  method: 'GET',
  data: params
});

export const getPalDetail = (postId) => request({
  url: `/api/v1/post/${postId}`,
  method: 'GET'
});

export const editPal = (postId, data) => request({
  url: `/api/v1/post/${postId}`,
  method: 'PUT',
  data
});

export const deletePal = (postId) => request({
  url: `/api/v1/post/${postId}`,
  method: 'DELETE'
});

export const pinPal = (postId, isPinned) => request({
  url: `/api/v1/post/${postId}/pin`,
  method: 'POST',
  data: { isPinned }
});

export const finishPal = (postId) => request({
  url: `/api/v1/post/${postId}/finish`,
  method: 'POST',
  data: { status: 2 }
});

export const applyPal = (postId, data) => request({
  url: `/api/v1/post/${postId}/apply`,
  method: 'POST',
  data
});

export const getPalApplications = (postId) => request({
  url: `/api/v1/post/${postId}/applications`,
  method: 'GET'
});

export const reviewPalApplication = (postId, applicationId, data) => request({
  url: `/api/v1/post/${postId}/applications/${applicationId}/review`,
  method: 'POST',
  data
});

export const cancelPalApplication = (postId, applicationId) => request({
  url: `/api/v1/post/${postId}/applications/${applicationId}/cancel`,
  method: 'POST'
});
/* 群聊 Group */
export const getMyGroups = () => request({
  url: '/api/v1/users/me/groups',
  method: 'GET'
});

export const getGroupMessages = (groupId, params = {}) => request({
  url: `/api/v1/groups/${groupId}/messages`,
  method: 'GET',
  data: params
});

export const sendGroupMessage = (groupId, data) => request({
  url: `/api/v1/groups/${groupId}/messages`,
  method: 'POST',
  data
});

export const quitOrDissolveGroup = (groupId) => {
  return request({
    url: `/api/v1/groups/${groupId}/members/me`,
    method: 'DELETE'
  });
};
export const getGroupMembers = (groupId) => request({
  url: `/api/v1/groups/${groupId}/members`,
  method: 'GET'
});
export { request, uploadImage };
