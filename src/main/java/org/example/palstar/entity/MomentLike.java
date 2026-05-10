package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("moment_like")
public class MomentLike {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long momentId;

    private Long userId;

    private LocalDateTime createdAt;
}
