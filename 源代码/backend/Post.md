# 结伴帖子（PalPost）

> 说明：以下为基础接口文档草案，字段可按实际表结构调整。

## post /api/v1/post
### 功能
发布结伴帖子（支持多图）。

### 请求体
```json
{
	"scene": "travel",
	"title": "五一成都三日游",
	"content": "行程随性，欢迎结伴",
	"location": "成都",
	"startTime": "2026-05-10T08:00:00",
	"expectedCount": 4,
	"genderRequirement": 0,
	"gradeRequirement": ["大一", "大二"],
	"interestRequirements": ["旅行", "摄影"],
	"coverImage": "https://example.com/post/cover.jpg",
	"imageUrls": [
		"https://example.com/post/1.jpg",
		"https://example.com/post/2.jpg"
	]
}
```

### 响应体
```json
{
	"code": 200,
	"message": "发布成功",
	"data": {
		"id": 1001,
		"authorId": 1778234511681,
		"scene": "travel",
		"title": "五一成都三日游",
		"content": "行程随性，欢迎结伴",
		"location": "成都",
		"startTime": "2026-05-10T08:00:00",
		"expectedCount": 4,
		"currentCount": 1,
		"genderRequirement": 0,
		"gradeRequirement": ["大一", "大二"],
		"interestRequirements": ["旅行", "摄影"],
		"coverImage": "https://example.com/post/cover.jpg",
		"imageUrls": [
			"https://example.com/post/1.jpg",
			"https://example.com/post/2.jpg"
		],
		"status": 0,
		"isPinned": 0,
		"reviewStatus": 0,
		"createdAt": "2026-05-09T10:00:00",
		"updatedAt": "2026-05-09T10:00:00"
	}
}
```

## get /api/v1/post
### 功能
获取帖子列表（可用于首页流）。

### 请求参数
- authorId（可选）: 按发布者筛选帖子。
- keyword（可选）: 标题模糊查询。
- interest（可选）: 按兴趣要求关键词筛选。

### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": [
		{
			"id": 1001,
			"authorId": 1778234511681,
			"scene": "travel",
			"title": "五一成都三日游",
			"content": "行程随性，欢迎结伴",
			"location": "成都",
			"startTime": "2026-05-10T08:00:00",
			"expectedCount": 4,
			"currentCount": 1,
			"genderRequirement": 0,
			"status": 0,
			"reviewStatus": 1,
			"coverImage": "https://example.com/post/cover.jpg",
			"imageUrls": ["https://example.com/post/1.jpg"],
			"createdAt": "2026-05-09T10:00:00"
		}
	]
}
```

## get /api/v1/post/{postId}
### 功能
获取帖子详情。

### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": {
		"id": 1001,
		"authorId": 1778234511681,
		"scene": "travel",
		"title": "五一成都三日游",
		"content": "行程随性，欢迎结伴",
		"location": "成都",
		"startTime": "2026-05-10T08:00:00",
		"expectedCount": 4,
		"currentCount": 1,
		"genderRequirement": 0,
		"gradeRequirement": ["大一", "大二"],
		"interestRequirements": ["旅行", "摄影"],
		"coverImage": "https://example.com/post/cover.jpg",
		"imageUrls": [
			"https://example.com/post/1.jpg",
			"https://example.com/post/2.jpg"
		],
		"status": 0,
		"isPinned": 0,
		"reviewStatus": 1,
		"createdAt": "2026-05-09T10:00:00",
		"updatedAt": "2026-05-09T10:00:00"
	}
}
```

## put /api/v1/post/{postId}
### 功能
修改帖子内容。

### 请求体
```json
{
	"scene": "travel",
	"title": "五一成都三日游（更新）",
	"content": "行程更新，时间调整",
	"location": "成都",
	"startTime": "2026-05-10T09:00:00",
	"expectedCount": 5,
	"genderRequirement": 0,
	"gradeRequirement": ["大一", "大二"],
	"interestRequirements": ["旅行", "摄影"],
	"coverImage": "https://example.com/post/cover.jpg",
	"imageUrls": [
		"https://example.com/post/1.jpg",
		"https://example.com/post/2.jpg"
	]
}
```

### 响应体
```json
{
	"code": 200,
	"message": "更新成功",
	"data": {
		"id": 1001,
		"authorId": 1778234511681,
		"scene": "travel",
		"title": "五一成都三日游（更新）",
		"content": "行程更新，时间调整",
		"location": "成都",
		"startTime": "2026-05-10T09:00:00",
		"expectedCount": 5,
		"currentCount": 1,
		"genderRequirement": 0,
		"gradeRequirement": ["大一", "大二"],
		"interestRequirements": ["旅行", "摄影"],
		"coverImage": "https://example.com/post/cover.jpg",
		"imageUrls": [
			"https://example.com/post/1.jpg",
			"https://example.com/post/2.jpg"
		],
		"status": 0,
		"isPinned": 0,
		"reviewStatus": 1,
		"createdAt": "2026-05-09T10:00:00",
		"updatedAt": "2026-05-09T10:30:00"
	}
}
```

## delete /api/v1/post/{postId}
### 功能
删除帖子（软删除）。

### 响应体
```json
{
	"code": 200,
	"message": "删除成功",
	"data": null
}
```

## post /api/v1/post/{postId}/pin
### 功能
置顶帖子。

### 请求体
```json
{
	"isPinned": 1
}
```

### 响应体
```json
{
	"code": 200,
	"message": "置顶成功",
	"data": {
		"id": 1001,
		"isPinned": 1,
		"updatedAt": "2026-05-09T10:40:00"
	}
}
```

## post /api/v1/post/{postId}/finish
### 功能
作者主动结束帖子（更新状态为已结束）。
### 请求体
```json
{
	"status": 2
}
```
### 响应体
```json
{
	"code": 200,
	"message": "已结束",
	"data": {
		"id": 1001,
		"status": 2,
		"updatedAt": "2026-05-09T10:50:00"
	}
}
```


# 结伴申请（Post Application）

## post /api/v1/post/{postId}/apply
### 功能
申请加入结伴。

### 请求体
```json
{
	"message": "我也想加入，可一起规划路线"
}
```

### 响应体
```json
{
	"code": 200,
	"message": "申请已提交",
	"data": {
		"id": 5001,
		"postId": 1001,
		"applicantId": 1778234511681,
		"message": "我也想加入，可一起规划路线",
		"status": 0,
		"reviewedBy": null,
		"reviewedAt": null,
		"createdAt": "2026-05-09T10:10:00",
		"updatedAt": "2026-05-09T10:10:00"
	}
}
```

## get /api/v1/post/{postId}/applications
### 功能
群主查看该帖子的申请列表。

### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": [
		{
			"id": 5001,
			"postId": 1001,
			"applicantId": 1778234511681,
			"message": "我也想加入，可一起规划路线",
			"status": 0,
			"reviewedBy": null,
			"reviewedAt": null,
			"createdAt": "2026-05-09T10:10:00",
			"updatedAt": "2026-05-09T10:10:00"
		}
	]
}
```

## get /api/v1/applications/me
### 功能
获取当前用户的所有申请列表。

### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": [
		{
			"id": 5001,
			"postId": 1001,
			"applicantId": 1778234511681,
			"message": "我也想加入，可一起规划路线",
			"status": 0,
			"reviewedBy": null,
			"reviewedAt": null,
			"createdAt": "2026-05-09T10:10:00",
			"updatedAt": "2026-05-09T10:10:00"
		}
	]
}
```

## post /api/v1/post/{postId}/applications/{applicationId}/review
### 功能
群主审核申请（通过/拒绝）。

### 请求体
```json
{
	"status": 1,
	"rejectReason": null
}
```

### 响应体
```json
{
	"code": 200,
	"message": "审核成功",
	"data": {
		"id": 5001,
		"postId": 1001,
		"applicantId": 1778234511681,
		"status": 1,
		"rejectReason": null,
		"reviewedBy": "1778234511681",
		"reviewedAt": "2026-05-09T10:20:00",
		"updatedAt": "2026-05-09T10:20:00"
	}
}
```

## post /api/v1/post/{postId}/applications/{applicationId}/cancel
### 功能
申请人取消申请（仅限待审核）。

### 响应体
```json
{
	"code": 200,
	"message": "已取消申请",
	"data": {
		"id": 5001,
		"postId": 1001,
		"applicantId": 1778234511681,
		"status": 3,
		"updatedAt": "2026-05-09T10:25:00"
	}
}
```

# 多图上传（COS）

## /api/v1/cos/upload
### 功能
获取上传凭证，前端使用凭证上传多张图片到 COS，拿到永久 URL 列表后再调用发帖接口。

### 上传流程
1. 调用 /api/v1/cos/upload 获取临时凭证。
2. 前端直传多张图片到 COS。
3. 前端将图片 URL 列表传给 /api/v1/post。
