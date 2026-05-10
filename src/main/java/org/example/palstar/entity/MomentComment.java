package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("moment_comment")
public class MomentComment {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long momentId;

    private Long userId;

    private Long parentId;

    private Long replyToId;

    private String content;

    private Integer status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
