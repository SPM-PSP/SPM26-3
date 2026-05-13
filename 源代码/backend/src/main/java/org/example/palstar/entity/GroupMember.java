package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("group_member")
public class GroupMember {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long groupId;

    private Long userId;

    private Integer role;

    private Integer joinSource;

    private LocalDateTime joinedAt;

    private LocalDateTime leftAt;
}
