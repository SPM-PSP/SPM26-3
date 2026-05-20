# 群聊（Group Chat）

> 说明：以下为群聊模块接口文档草案，字段按 `group_chat`、`group_member`、`group_message` 表设计。群聊由系统在结伴帖发布后自动创建，无需前端主动调用创建接口。审批通过后系统自动将申请人加入已有群聊。

## post /api/v1/groups/{groupId}/messages
### 功能
发送群消息（I-G-002）。发送者必须是当前群成员且未退出。

### 路径参数
- groupId：群聊 ID

### 请求体
```json
{
    "msgType": 0,
    "content": "大家好！",
    "mediaUrl": null
}
```

### 说明
msgType 0：文字，1：图片，2：语音，3：视频。

### 响应体
```json
{
    "code": 200,
    "message": "发送成功",
        "data": {
        "id": 1,
        "groupId": 1,
        "senderId": 2,
        "msgType": 0,
        "content": "大家好！",
        "mediaUrl": null,
        "createdAt": "2026-05-13T10:00:00"
    }
}
```

## get /api/v1/users/me/groups
### 功能
获取我加入的群列表（I-G-003）。返回当前用户所有未退出、未解散的群聊，包含每个群的当前成员数。

### 说明
查询时过滤掉 `status = 1` 的已解散群聊，以及 `left_at` 不为空的已退出记录。

### 响应体
```json
{
    "code": 200,
    "message": "查询成功",
    "data": [
        {
        "id": 1,
        "name": "【结伴】五一成都三日游",
        "postId": 1,
        "ownerId": 1,
        "memberCount": 2,
        "createdAt": "2026-05-13T10:00:00"
        }
    ]
}
```

## delete /api/v1/groups/{groupId}/members/me
### 功能
退群或解散群（I-G-004）。群主调用则解散群聊，普通成员调用则退出群聊。

### 路径参数
- groupId：群聊 ID

### 说明
- 群主调用：group_chat 表 status 更新为 1，dissolved_at 记录解散时间。
- 普通成员调用：group_member 表 left_at 记录退出时间。

### 响应体
```json
{
    "code": 200,
    "message": "操作成功",
    "data": null
}
```

## get /api/v1/groups/{groupId}/messages
### 功能
拉取群历史消息，按时间倒序分页返回。当前用户必须是群成员且未退出。

### 路径参数
- groupId：群聊 ID

### 请求参数
- page（可选，默认 1）：页码
- size（可选，默认 20）：每页数量

### 响应体
```json
{
"code": 200,
"message": "查询成功",
"data": [
    {
        "id": 1,
        "groupId": 1,
        "senderId": 2,
        "msgType": 0,
        "content": "大家好！",
        "mediaUrl": null,
        "createdAt": "2026-05-13T10:00:00"
        }
    ]
}
```

## put /api/v1/groups/{groupId}/name
### 功能
修改群聊名称。仅群主可操作。

### 路径参数
- groupId：群聊 ID

### 请求体
```json
{
    "groupName": "新的群名"
}
```

### 响应体
```json
{
    "code": 200,
    "message": "Group name updated",
    "data": null
}
```

## get /api/v1/groups/{groupId}/members
### 功能
查询群成员列表，返回每位成员的用户ID、昵称、头像、角色、加入方式和加入时间。

### 路径参数
- groupId：群聊 ID

### 说明
- role 0：普通成员，1：管理员，2：群主。
- joinSource 0：申请通过，1：被邀请，2：直接创建。
- 过滤掉 `left_at` 不为空的已退出成员。

### 响应体
```json
{
    "code": 200,
    "message": "Success",
    "data": [
    {
        "userId": 1,
        "nickname": "UserA",
        "avatarUrl": "https://placeholder.com/a.jpg",
        "role": 2,
        "joinSource": 2,
        "joinedAt": "2026-05-13T10:00:00"
        },
        {
        "userId": 2,
        "nickname": "UserB",
        "avatarUrl": "https://placeholder.com/b.jpg",
        "role": 0,
        "joinSource": 0,
        "joinedAt": "2026-05-13T10:05:00"
        }
    ]
}
```

## get /api/v1/groups/{groupId}/member-count
### 功能
查询当前群的成员数量。群不存在或已解散时返回错误。

### 路径参数
- groupId：群聊 ID

### 响应体
```json
{
    "code": 200,
    "message": "Success",
    "data": {
    "groupId": 1,
    "memberCount": 2
    }
}
```

## post /api/v1/groups/{groupId}/members
### 功能
群主或管理员邀请用户加入群聊。被邀请用户不能已是群成员。

### 路径参数
- groupId：群聊 ID

### 请求体
```json
{
    "invitedUserId": 3
}
```

### 说明
邀请加入的成员 joinSource 记录为 1（被邀请）。

### 响应体
```json
{
    "code": 200,
    "message": "邀请成功",
    "data": null
}
```

## put /api/v1/groups/{groupId}/members/{targetUserId}/role
### 功能
群主将指定群成员设置为管理员。不能修改群主自身角色，不能重复设置已是管理员的成员。

### 路径参数
- groupId：群聊 ID
- targetUserId：目标用户 ID

### 说明
- 仅群主可操作。
- role 设置为 1（管理员）。

### 响应体
```json
{
    "code": 200,
    "message": "设置管理员成功",
    "data": null
}
```
