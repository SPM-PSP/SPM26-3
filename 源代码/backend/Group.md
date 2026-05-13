# 群聊（Group Chat）

> 说明：以下为群聊模块接口文档草案，字段按 `group_chat`、`group_member`、`group_message` 表设计。群聊由系统在结伴申请通过后自动创建（I-G-001），无需前端主动调用创建接口。

## post /api/v1/groups/{groupId}/messages
### 功能
发送群消息（I-G-002）。发送者必须是当前群成员且未退出。

### 路径参数
- groupId：群聊 ID

### 请求体
{
    "msgType": 0,
    "content": "大家好！",
    "mediaUrl": null
}

### 说明
msgType 0：文字，1：图片，2：语音，3：视频。

### 响应体
{
    "code": 200,
    "message": "Message sent",
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

## get /api/v1/users/me/groups
### 功能
获取我加入的群列表（I-G-003）。返回当前用户所有未退出、未解散的群聊。

### 说明
查询时过滤掉 `status = 1` 的已解散群聊，以及 `left_at` 不为空的已退出记录。

### 响应体
{
    "code": 200,
    "message": "Success",
    "data": [
        {
        "id": 1,
        "name": "【结伴】study 2026-05-20",
        "postId": 1,
        "ownerId": 1,
        "memberCount": 2,
        "createdAt": "2026-05-13T10:00:00"
        }
    ]
}

## delete /api/v1/groups/{groupId}/members/me
### 功能
退群或解散群（I-G-004）。群主调用则解散群聊，普通成员调用则退出群聊。

### 路径参数
- groupId：群聊 ID

### 说明
- 群主调用：group_chat 表 status 更新为 1，dissolved_at 记录解散时间。
- 普通成员调用：group_member 表 left_at 记录退出时间。

### 响应体
{
    "code": 200,
    "message": "Success",
    "data": null
}

## get /api/v1/groups/{groupId}/messages
### 功能
拉取群历史消息（I-M-003），按时间倒序分页返回。

### 路径参数
- groupId：群聊 ID

### 请求参数
- page（可选，默认 1）：页码
- size（可选，默认 20）：每页数量

### 说明
查询时过滤掉 `status = 1` 的已撤回消息和 `status = 2` 的已删除消息。

### 响应体
{
    "code": 200,
    "message": "Success",
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