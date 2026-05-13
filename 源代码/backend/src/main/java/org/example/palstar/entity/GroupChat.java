package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("group_chat")
public class GroupChat {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long postId;

    private Long ownerId;

    private String name;

    private Integer status;

    private LocalDateTime createdAt;

    private LocalDateTime dissolvedAt;
}
