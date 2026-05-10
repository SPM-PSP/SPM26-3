package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("pal_application")
public class PalApplication {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long postId;

    private Long applicantId;

    private String message;

    private Integer status;

    private String reviewedBy;

    private String rejectReason;

    private LocalDateTime reviewedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
