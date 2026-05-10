package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("user_follow")
public class UserFollow {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long followerId;

    private Long followingId;

    private Integer status;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
