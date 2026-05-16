# 动态（Moment）

> 说明：以下为基础接口文档草案，字段按 `moment`、`moment_media`、`moment_like`、`moment_favorite`、`moment_comment` 表设计。

## post /api/v1/moment
### 功能
发布动态（支持图/视频）。

### 请求体
```json
{
	"scene": "moment",
	"title": "周末徒步",
	"content": "天气不错，爬山走起",
	"location": "成都",
	"tags": ["徒步", "周末"],
	"status": 0,
	"media": [
		{
			"mediaType": 0,
			"mediaUrl": "https://example.com/moment/1.jpg",
			"sortNo": 0
		},
		{
			"mediaType": 1,
			"mediaUrl": "https://example.com/moment/2.mp4",
			"sortNo": 1
		}
	]
}
```

### 响应体
```json
{
	"code": 200,
	"message": "发布成功",
	"data": {
		"id": 2001,
		"authorId": 1778234511681,
		"scene": "moment",
		"title": "周末徒步",
		"content": "天气不错，爬山走起",
		"location": "成都",
		"tags": ["徒步", "周末"],
		"status": 0,
		"reviewStatus": 0,
		"likeCount": 0,
		"favoriteCount": 0,
		"commentCount": 0,
		"hotScore": 0,
		"media": [
			{
				"id": 9001,
				"mediaType": 0,
				"mediaUrl": "https://example.com/moment/1.jpg",
				"sortNo": 0
			}
		],
		"createdAt": "2026-05-09T10:00:00",
		"updatedAt": "2026-05-09T10:00:00"
	}
}
```

## get /api/v1/moment
### 功能
获取动态列表。

### 请求参数
- authorId（可选）: 按发布者筛选动态。
- sort（可选）: 排序方式，latest（默认）| hot。
- keyword（可选）: 标题模糊查询。
- tag（可选）: 按标签关键词筛选。

### 说明
查询时默认过滤掉 `status = 2` 的动态。

### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": [
		{
			"id": 2001,
			"authorId": 1778234511681,
			"scene": "moment",
			"title": "周末徒步",
			"content": "天气不错，爬山走起",
			"location": "成都",
			"tags": ["徒步"],
			"status": 0,
			"reviewStatus": 1,
			"likeCount": 12,
			"favoriteCount": 5,
			"commentCount": 3,
			"hotScore": 18.6,
			"createdAt": "2026-05-09T10:00:00"
		}
	]
}
```

## get /api/v1/moment/{momentId}
### 功能
获取动态详情。


### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": {
		"id": 2001,
		"authorId": 1778234511681,
		"scene": "moment",
		"title": "周末徒步",
		"content": "天气不错，爬山走起",
		"location": "成都",
		"tags": ["徒步"],
		"status": 0,
		"reviewStatus": 1,
		"likeCount": 12,
		"favoriteCount": 5,
		"commentCount": 3,
		"hotScore": 18.6,
		"isLiked": true,
		"isFavorited": false,
		"isFollow": true,
		"followerCount": 120,
		"followingCount": 56,
		"media": [
			{
				"id": 9001,
				"mediaType": 0,
				"mediaUrl": "https://example.com/moment/1.jpg",
				"sortNo": 0
			}
		],
		"createdAt": "2026-05-09T10:00:00",
		"updatedAt": "2026-05-09T10:00:00"
	}
}
```

## delete /api/v1/moment/{momentId}
### 功能
删除动态（软删除）。

### 响应体
```json
{
	"code": 200,
	"message": "删除成功",
	"data": null
}
```

## put /api/v1/moment/{momentId}
### 功能
编辑动态内容。

### 请求体
```json
{
	"title": "周末徒步（更新）",
	"content": "天气不错，爬山走起，补充一张图",
	"location": "成都",
	"tags": ["徒步", "周末"],
    "status": 0,
	"media": [
		{
			"mediaType": 0,
			"mediaUrl": "https://example.com/moment/1.jpg",
			"sortNo": 0
		},
		{
			"mediaType": 0,
			"mediaUrl": "https://example.com/moment/3.jpg",
			"sortNo": 1
		}
	]
}
```

### 响应体
```json
{
	"code": 200,
	"message": "更新成功",
	"data": {
		"id": 2001,
		"authorId": 1778234511681,
		"scene": "moment",
		"title": "周末徒步（更新）",
		"content": "天气不错，爬山走起，补充一张图",
		"location": "成都",
		"tags": ["徒步", "周末"],
		"status": 0,
		"reviewStatus": 0,
		"likeCount": 12,
		"favoriteCount": 5,
		"commentCount": 3,
		"hotScore": 18.6,
		"media": [
			{
				"id": 9001,
				"mediaType": 0,
				"mediaUrl": "https://example.com/moment/1.jpg",
				"sortNo": 0
			},
			{
				"id": 9003,
				"mediaType": 0,
				"mediaUrl": "https://example.com/moment/3.jpg",
				"sortNo": 1
			}
		],
		"createdAt": "2026-05-09T10:00:00",
		"updatedAt": "2026-05-10T09:00:00"
	}
}
```

# 点赞

## post /api/v1/moment/{momentId}/like
### 功能
点赞动态。

### 响应体
```json
{
	"code": 200,
	"message": "点赞成功",
	"data": {
		"momentId": 2001,
		"userId": 1778234511681,
		"createdAt": "2026-05-09T10:20:00"
	}
}
```

## delete /api/v1/moment/{momentId}/like
### 功能
取消点赞。

### 响应体
```json
{
	"code": 200,
	"message": "已取消点赞",
	"data": null
}
```

# 收藏

## post /api/v1/moment/{momentId}/favorite
### 功能
收藏动态。

### 响应体
```json
{
	"code": 200,
	"message": "收藏成功",
	"data": {
		"momentId": 2001,
		"userId": 1778234511681,
		"createdAt": "2026-05-09T10:30:00"
	}
}
```

## delete /api/v1/moment/{momentId}/favorite
### 功能
取消收藏。

### 响应体
```json
{
	"code": 200,
	"message": "已取消收藏",
	"data": null
}
```

# 评论

## post /api/v1/moment/{momentId}/comment
### 功能
发表评论或回复评论。

### 请求体
```json
{
	"content": "很棒的行程！",
	"parentId": null,
	"replyToId": null
}
```

### 响应体
```json
{
	"code": 200,
	"message": "评论成功",
	"data": {
		"id": 3001,
		"momentId": 2001,
		"userId": 1778234511681,
		"parentId": null,
		"replyToId": null,
		"content": "很棒的行程！",
		"status": 0,
		"createdAt": "2026-05-09T10:40:00",
		"updatedAt": "2026-05-09T10:40:00"
	}
}
```

## get /api/v1/moment/{momentId}/comment
### 功能
获取动态评论列表。

### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": [
		{
			"id": 3001,
			"momentId": 2001,
			"userId": 1778234511681,
			"parentId": null,
			"replyToId": null,
			"content": "很棒的行程！",
			"status": 0,
			"createdAt": "2026-05-09T10:40:00",
			"updatedAt": "2026-05-09T10:40:00"
		}
	]
}
```

## delete /api/v1/moment/comment/{commentId}
### 功能
删除评论（软删除）。

### 响应体
```json
{
	"code": 200,
	"message": "删除成功",
	"data": null
}
```

# 多媒体上传（COS）

## /api/v1/cos/upload
### 功能
获取上传凭证，前端使用凭证上传图片或视频到 COS，拿到永久 URL 列表后再调用发布动态接口.

# 个人列表 (My Lists)

## get /api/v1/moments/me/likes
### 功能
获取我点赞的动态列表。

### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": [
		{
			"id": 2001,
			"title": "周末徒步",
			"coverUrl": "https://example.com/moment/1.jpg",
			"likeCount": 12,
			"author": {
				"id": 1778234511681,
				"nickname": "徒步爱好者",
				"avatarUrl": "https://example.com/avatar/1681.jpg"
			}
		}
	]
}
```

## get /api/v1/moments/me/favorites
### 功能
获取我收藏的动态列表。

### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": [
		{
			"id": 2002,
			"title": "城市夜景",
			"coverUrl": "https://example.com/moment/city.jpg",
			"likeCount": 150,
			"author": {
				"id": 1778234512000,
				"nickname": "摄影大师",
				"avatarUrl": "https://example.com/avatar/2000.jpg"
			}
		}
	]
}
```

## get /api/v1/moments/me/comments
### 功能
获取我发布的评论列表。

### 响应体
```json
{
	"code": 200,
	"message": "查询成功",
	"data": [
		{
			"id": 3001,
			"content": "很棒的行程！",
			"createdAt": "2026-05-09T10:40:00",
			"moment": {
				"id": 2001,
				"title": "周末徒步"
			}
		}
	]
}
```
