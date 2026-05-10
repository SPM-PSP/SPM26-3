package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;

@Data
@TableName(value = "moment", autoResultMap = true)
public class Moment {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long authorId;

    private String scene;

    private String title;

    private String content;

    private String location;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> tags;

    private Integer status;

    private Integer reviewStatus;

    private Integer likeCount;

    private Integer favoriteCount;

    private Integer commentCount;

    private BigDecimal hotScore;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;
}
