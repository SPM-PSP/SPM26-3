package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName(value = "user", autoResultMap = true)
public class User {

    @TableId(type = IdType.INPUT)
    private Long id;

    private String openid;

    private String nickname;

    private String avatarUrl;

    private String bio;

    private String school;

    private String grade;

    private Integer gender;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> interestTags;

    private Integer verifyStatus;

    private Integer status;

    private LocalDateTime deleteApplyAt;

    private LocalDateTime deletedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
