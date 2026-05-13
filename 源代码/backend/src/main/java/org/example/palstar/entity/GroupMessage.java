package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("group_message")
public class GroupMessage {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long groupId;

    private Long senderId;

    private Integer msgType;

    private String content;

    private String mediaUrl;

    private Integer status;

    private LocalDateTime createdAt;
}
