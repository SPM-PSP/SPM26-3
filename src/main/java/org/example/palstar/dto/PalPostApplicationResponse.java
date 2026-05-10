package org.example.palstar.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class PalPostApplicationResponse {
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
