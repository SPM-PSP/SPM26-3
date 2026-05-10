package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;

@Data
@TableName(value = "pal_post", autoResultMap = true)
public class PalPost {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long authorId;

    private String scene;

    private String title;

    private String content;

    private String location;

    private LocalDateTime startTime;

    private Integer expectedCount;

    private Integer currentCount;

    private Integer genderRequirement;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> gradeRequirement;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> interestRequirements;

    private Integer status;

    private Integer isPinned;

    private Integer reviewStatus;

    private String coverImage;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}
