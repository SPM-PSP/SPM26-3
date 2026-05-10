package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("student_verification")
public class StudentVerification {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String realName;

    private String studentNo;

    private String school;

    private String proofImageUrl;

    private Integer status;

    private String rejectReason;

    private Long reviewerId;

    private LocalDateTime reviewedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
