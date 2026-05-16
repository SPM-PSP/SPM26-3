# 用户认证
## post /api/v1/auth/login/wechat
### 请求体
```json
{
  "code": "微信小程序wx.login()获取的临时登录凭证",
  "nickname": "微信用户昵称",
  "avatarUrl": "微信用户头像URL"
}
```
### 响应体
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", // 用于后续请求的JWT
    "isNewUser": false, // 是否为新注册用户（这个字段可以用于前端判断是否需要跳转到补充个人信息界面）
    "userInfo": {
      "id": "123456789",
      "nickname": "张三",
      "avatarUrl": "http://example.com/avatar.jpg",
      "verifyStatus": 2 // 0-未认证, 1-审核中, 2-已认证, 3-失败
    }
  }
}
```


## get /api/v1/user/profile
获得个人信息
### 响应体
```json
{
  "code": 200,
  "message": "Success",
  "data": {
    "id": 1778234511681,
    "openid": "oU1BC1zxFD9cwp7XJfHORoTMA4bI",
    "nickname": "微信用户",
    "avatarUrl": "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132",
    "bio": "",
    "school": null,
    "grade": null,
    "gender": 0,
    "interestTags": [],
    "verifyStatus": 0,
    "status": 1,
    "deleteApplyAt": null,
    "deletedAt": null,
    "createdAt": "2026-05-08T18:01:52",
    "updatedAt": "2026-05-08T18:01:52"
  }
}
```

## get /api/v1/user/{userId}/profile
查看他人主页信息

### 响应体
```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": 1778234512000,
    "nickname": "旅行达人",
    "avatarUrl": "https://example.com/avatar/2000.jpg",
    "bio": "周末徒步爱好者",
    "school": "四川大学",
    "grade": "大四",
    "gender": 1,
    "interestTags": ["旅行", "徒步"],
    "verifyStatus": 2,
    "isFollow": true,
    "followerCount": 120,
    "followingCount": 56
  }
}
```

## put /api/v1/user/profile
修改个人信息
### 请求体
```json
{
  "nickname": "张三爱旅行",
  "avatarUrl" : "https://thirdwx.qlogo.cn/mmopen/vi_32",
  "bio": "探索世界的每一个角落",
  "grade": "大三",
  "school": "四川大学",
  "gender": 1,
  "interestTags": ["旅行", "摄影", "徒步"]
}
```

### 响应体
```json
{
  "code": 200,
  "message": "信息更新成功",
  "data": {
    "id": 1778234511681,
    "openid": "oU1BC1zxFD9cwp7XJfHORoTMA4bI",
    "nickname": "张三爱旅行",
    "avatarUrl": "https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132",
    "bio": "探索世界的每一个角落",
    "school": "四川大学",
    "grade": "大三",
    "gender": 1,
    "interestTags": [
    "旅行",
    "摄影",
    "徒步"
    ],
    "verifyStatus": 0,
    "status": 1,
    "deleteApplyAt": null,
    "deletedAt": null,
    "createdAt": "2026-05-08T18:01:52",
    "updatedAt": "2026-05-08T20:31:39.9361834"
  }
}
```

## post /api/v1/user/cancellation/apply
申请注销
### 响应体
```json
{
    "code": 200,
    "message": "注销申请成功，账号已进入15天冷静期",
    "data": null
}
```

## post /api/v1/user/cancellation/confirm
撤销注销申请
### 响应体
```json
{
    "code": 200,
    "message": "已成功撤销注销申请",
    "data": null
}
```

# 关注

## post /api/v1/user/{userId}/follow
关注用户

### 响应体
```json
{
  "code": 200,
  "message": "关注成功",
  "data": {
    "followerId": 1778234511681,
    "followingId": 1778234512000,
    "status": 0,
    "createdAt": "2026-05-10T10:20:00"
  }
}
```

## delete /api/v1/user/{userId}/follow
取消关注

### 响应体
```json
{
  "code": 200,
  "message": "已取消关注",
  "data": null
}
```


# 学生认证
申请学生认证
## post /api/v1/verification/student/apply
### 请求体
```json
{
  "realName": "张三",
  "studentNo": "20210001",
  "school": "XX大学",
  "proofImageUrl": "https://example.com/proof.jpg"
}
```
### 响应体
```json
{
  "code": 200,
  "message": "认证申请已提交，请等待审核",
  "data": {
    "id": 1,
    "userId": 1778234511681,
    "realName": "张三",
    "studentNo": "20210001",
    "school": "XX大学",
    "proofImageUrl": "https://example.com/proof.jpg",
    "status": 0,
    "rejectReason": null,
    "reviewerId": null,
    "reviewedAt": null,
    "createdAt": "2026-05-09T16:55:38.2673933",
    "updatedAt": "2026-05-09T16:55:38.2673933"
  }
}
```

## get /api/v1/verification/student/status
查看申请状态
### 响应体（最新一条提交申请的状态）
```json
{
    "code": 200,
    "message": "查询成功",
    "data": {
        "status": 1,
        "application": {
            "id": 2,
            "userId": 1778234511681,
            "realName": "张三",
            "studentNo": "20210001",
            "school": "XX大学",
            "proofImageUrl": "https://example.com/proof.jpg",
            "status": 0,
            "rejectReason": null,
            "reviewerId": null,
            "reviewedAt": null,
            "createdAt": "2026-05-09T17:37:25",
            "updatedAt": "2026-05-09T17:37:25"
        }
    }
}
```

# 用户搜索与列表

## get /api/v1/users/search
### 功能
根据关键词模糊搜索用户（匹配ID或昵称）。

### 请求参数
- `keyword` (string, required): 搜索关键词。

### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": [
		{
			"id": 1778234512000,
			"nickname": "旅行达人",
			"avatarUrl": "https://example.com/avatar/2000.jpg"
		}
	]
}
```

## get /api/v1/user/{userId}/followers
### 功能
获取指定用户的粉丝列表。

### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": [
		{
			"id": 1778234511681,
			"nickname": "旅行爱好者",
			"avatarUrl": "https://example.com/avatar/1681.jpg"
		}
	]
}
```

## get /api/v1/user/{userId}/following
### 功能
获取指定用户关注的用户列表。

### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": [
		{
			"id": 1778234512000,
			"nickname": "摄影大师",
			"avatarUrl": "https://example.com/avatar/2000.jpg"
		}
	]
}
```







