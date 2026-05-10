-- =====================================================
-- 1. 用户表
-- =====================================================
CREATE TABLE `user` (
    `id` BIGINT PRIMARY KEY COMMENT '用户唯一ID',
    `openid` VARCHAR(64) NOT NULL UNIQUE COMMENT '微信openid',
    `nickname` VARCHAR(64) NOT NULL COMMENT '昵称',
    `avatar_url` VARCHAR(512) NOT NULL COMMENT '头像URL',
    `bio` VARCHAR(255) DEFAULT '' COMMENT '个人简介',
    `school` VARCHAR(128) DEFAULT NULL COMMENT '学校',
    `grade` VARCHAR(16) DEFAULT NULL COMMENT '年级',
    `gender` TINYINT DEFAULT 0 COMMENT '性别 0未知 1男 2女',
    `interest_tags` JSON DEFAULT ('[]') COMMENT '兴趣标签',
    `verify_status` TINYINT DEFAULT 0 COMMENT '认证状态 0未认证 1审核中 2已认证 3失败',
    `status` TINYINT DEFAULT 1 COMMENT '账号状态 1正常 2封禁 3注销申请中',
    `delete_apply_at` DATETIME DEFAULT NULL COMMENT '申请注销时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '软删除时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX `idx_openid` (`openid`),
    INDEX `idx_status` (`status`),
    INDEX `idx_verify_status` (`verify_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';


-- =====================================================
-- 2. 学生认证表
-- =====================================================
CREATE TABLE `student_verification` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '认证记录ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `real_name` VARCHAR(32) NOT NULL COMMENT '真实姓名',
    `student_no` VARCHAR(32) NOT NULL COMMENT '学号',
    `school` VARCHAR(128) NOT NULL COMMENT '学校',
    `proof_image_url` VARCHAR(512) NOT NULL COMMENT '证明材料URL',
    `status` TINYINT DEFAULT 0 COMMENT '状态 0待审核 1通过 2拒绝',
    `reject_reason` VARCHAR(255) DEFAULT NULL COMMENT '拒绝理由',
    `reviewer_id` BIGINT DEFAULT NULL COMMENT '审核员ID',
    `reviewed_at` DATETIME DEFAULT NULL COMMENT '审核时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生认证表';


-- =====================================================
-- 3. 结伴帖主表
-- =====================================================
CREATE TABLE `pal_post` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '帖子ID',
    `author_id` BIGINT NOT NULL COMMENT '发布者ID',
    `scene` VARCHAR(32) NOT NULL COMMENT '场景 travel/food/sports/study/ride',
    `title` VARCHAR(80) NOT NULL COMMENT '标题',
    `content` VARCHAR(500) NOT NULL COMMENT '内容',
    `location` VARCHAR(128) NOT NULL COMMENT '地点',
    `start_time` DATETIME NOT NULL COMMENT '开始时间',
    `expected_count` INT DEFAULT 1 COMMENT '期望总人数',
    `current_count` INT DEFAULT 1 COMMENT '当前已加入人数',
    `gender_requirement` TINYINT DEFAULT 0 COMMENT '性别要求 0不限 1男 2女',
    `grade_requirement` JSON DEFAULT ('[]') COMMENT '年级要求',
    `interest_requirements` JSON DEFAULT ('[]') COMMENT '兴趣要求',
    `status` TINYINT DEFAULT 0 COMMENT '帖子状态 0招募中 1已满员 2已结束 3已取消',
    `is_pinned` TINYINT DEFAULT 0 COMMENT '是否置顶 0否 1是',
    `review_status` TINYINT DEFAULT 0 COMMENT '审核状态 0待审核 1通过 2拒绝',
    `cover_image` VARCHAR(512) DEFAULT NULL COMMENT '封面图',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '软删除时间',

    INDEX `idx_author_id` (`author_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_review_status` (`review_status`),
    INDEX `idx_start_time` (`start_time`),
    INDEX `idx_scene` (`scene`),
    FOREIGN KEY (`author_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='结伴帖';


-- =====================================================
-- 4. 结伴帖图片表
-- =====================================================
CREATE TABLE `pal_post_image` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '图片ID',
    `post_id` BIGINT NOT NULL COMMENT '帖子ID',
    `image_url` VARCHAR(512) NOT NULL COMMENT '图片URL',
    `sort_no` INT DEFAULT 0 COMMENT '排序序号',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',

    INDEX `idx_post_id` (`post_id`),
    FOREIGN KEY (`post_id`) REFERENCES `pal_post`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='结伴帖图片';


-- =====================================================
-- 5. 结伴申请
-- =====================================================
CREATE TABLE `pal_application` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '申请ID',
    `post_id` BIGINT NOT NULL COMMENT '帖子ID',
    `applicant_id` BIGINT NOT NULL COMMENT '申请人ID',
    `message` VARCHAR(255) DEFAULT NULL COMMENT '申请留言',
    `status` TINYINT DEFAULT 0 COMMENT '状态 0待审核 1通过 2拒绝 3已取消',
    `reviewed_by` VARCHAR(64) DEFAULT NULL COMMENT '审核人ID',
    `reject_reason` VARCHAR(255) DEFAULT NULL COMMENT '拒绝理由',
    `reviewed_at` DATETIME DEFAULT NULL COMMENT '审核时间',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_applicant_id` (`applicant_id`),
    INDEX `idx_status` (`status`),
    UNIQUE KEY `uk_post_applicant` (`post_id`, `applicant_id`),
    FOREIGN KEY (`post_id`) REFERENCES `pal_post`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`applicant_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='结伴申请';


-- =====================================================
-- 6. 群聊表
-- =====================================================
CREATE TABLE `group_chat` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '群聊ID',
    `post_id` BIGINT NOT NULL UNIQUE COMMENT '关联帖子ID',
    `owner_id` BIGINT NOT NULL COMMENT '群主ID',
    `name` VARCHAR(64) NOT NULL COMMENT '群聊名称',
    `status` TINYINT DEFAULT 0 COMMENT '状态 0正常 1已解散',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `dissolved_at` DATETIME DEFAULT NULL COMMENT '解散时间',

    INDEX `idx_post_id` (`post_id`),
    INDEX `idx_owner_id` (`owner_id`),
    FOREIGN KEY (`post_id`) REFERENCES `pal_post`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`owner_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群聊';


-- =====================================================
-- 7. 群聊成员表
-- =====================================================
CREATE TABLE `group_member` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '成员记录ID',
    `group_id` BIGINT NOT NULL COMMENT '群聊ID',
    `user_id` BIGINT NOT NULL COMMENT '用户ID',
    `role` TINYINT DEFAULT 0 COMMENT '角色 0普通成员 1管理员 2群主',
    `join_source` TINYINT DEFAULT 0 COMMENT '加入来源 0申请通过 1被邀请 2直接创建',
    `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    `left_at` DATETIME DEFAULT NULL COMMENT '退出时间',

    UNIQUE KEY `uk_group_user` (`group_id`, `user_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_group_id` (`group_id`),
    FOREIGN KEY (`group_id`) REFERENCES `group_chat`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群成员表';

-- =====================================================
-- 8. 动态表
-- =====================================================
CREATE TABLE `moment` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '动态ID',
    `author_id` BIGINT NOT NULL COMMENT '发布者ID',
    `scene` VARCHAR(32) DEFAULT 'moment' COMMENT '场景',
    `title` VARCHAR(100) DEFAULT NULL COMMENT '标题',
    `content` TEXT COMMENT '内容',
    `location` VARCHAR(128) DEFAULT NULL COMMENT '位置',
    `tags` JSON DEFAULT ('[]') COMMENT '标签',
    `status` TINYINT DEFAULT 0 COMMENT '状态 0正常 1仅自己 2删除',
    `review_status` TINYINT DEFAULT 0 COMMENT '审核 0待审 1通过 2拒绝',
    `like_count` INT DEFAULT 0 COMMENT '点赞数',
    `favorite_count` INT DEFAULT 0 COMMENT '收藏数',
    `comment_count` INT DEFAULT 0 COMMENT '评论数',
    `hot_score` DECIMAL(10,2) DEFAULT 0 COMMENT '热度分',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发布时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',

    INDEX `idx_author_id` (`author_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_review_status` (`review_status`),
    INDEX `idx_hot_score` (`hot_score`),
    INDEX `idx_created_at` (`created_at`),
    FOREIGN KEY (`author_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动态表';


-- =====================================================
-- 9. 动态多媒体表
-- =====================================================
CREATE TABLE `moment_media` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '媒体ID',
    `moment_id` BIGINT NOT NULL COMMENT '动态ID',
    `media_type` TINYINT DEFAULT 0 COMMENT '类型 0图片 1视频',
    `media_url` VARCHAR(512) NOT NULL COMMENT '媒体URL',
    `sort_no` INT DEFAULT 0 COMMENT '排序',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX `idx_moment_id` (`moment_id`),
    FOREIGN KEY (`moment_id`) REFERENCES `moment`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='动态媒体';


-- =====================================================
-- 10. 点赞表
-- =====================================================
CREATE TABLE `moment_like` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `moment_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY `uk_moment_user` (`moment_id`, `user_id`),
    INDEX `idx_user_id` (`user_id`),
    FOREIGN KEY (`moment_id`) REFERENCES `moment`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞';


-- =====================================================
-- 11. 收藏表
-- =====================================================
CREATE TABLE `moment_favorite` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `moment_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY `uk_moment_user` (`moment_id`, `user_id`),
    INDEX `idx_user_id` (`user_id`),
    FOREIGN KEY (`moment_id`) REFERENCES `moment`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏';


-- =====================================================
-- 12. 评论表
-- =====================================================
CREATE TABLE `moment_comment` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `moment_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    `parent_id` BIGINT DEFAULT NULL COMMENT '父评论ID',
    `reply_to_id`BIGINT DEFAULT NULL COMMENT '回复给谁',
    `content` TEXT NOT NULL,
    `status` TINYINT DEFAULT 0 COMMENT '0正常 1删除 2违规',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX `idx_moment_id` (`moment_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_parent_id` (`parent_id`),
    FOREIGN KEY (`moment_id`) REFERENCES `moment`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论';


-- =====================================================
-- 13. 关注表
-- =====================================================
CREATE TABLE `user_follow` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT,
    `follower_id` BIGINT NOT NULL COMMENT '关注者ID',
    `following_id` BIGINT NOT NULL COMMENT '被关注者ID',
    `status` TINYINT DEFAULT 0 COMMENT '0正常 1取消',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY `uk_follow` (`follower_id`, `following_id`),
    INDEX `idx_follower` (`follower_id`),
    INDEX `idx_following` (`following_id`),
    FOREIGN KEY (`follower_id`) REFERENCES `user`(`id`),
    FOREIGN KEY (`following_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户关注';

-- =====================================================
-- 14. 群聊消息表
-- =====================================================
CREATE TABLE `group_message` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '消息ID',
    `group_id` BIGINT NOT NULL COMMENT '群聊ID',
    `sender_id` BIGINT NOT NULL COMMENT '发送者ID',
    `msg_type` TINYINT DEFAULT 0 COMMENT '消息类型 0文字 1图片 2语音 3视频 4系统消息',
    `content` TEXT COMMENT '消息内容（文本消息时使用）',
    `media_url` VARCHAR(512) DEFAULT NULL COMMENT '媒体URL（图片/语音/视频时使用）',
    `status` TINYINT DEFAULT 0 COMMENT '状态 0正常 1撤回 2已删除',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',

    INDEX `idx_group_id` (`group_id`),
    INDEX `idx_sender_id` (`sender_id`),
    INDEX `idx_created_at` (`created_at`),
    FOREIGN KEY (`group_id`) REFERENCES `group_chat`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='群消息表';
