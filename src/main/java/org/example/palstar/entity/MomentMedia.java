package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("moment_media")
public class MomentMedia {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long momentId;

    private Integer mediaType;

    private String mediaUrl;

    private Integer sortNo;

    private LocalDateTime createdAt;
}
