package org.example.palstar.dto;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class MomentLikeResponse {
    private Long momentId;
    private Long userId;
    private LocalDateTime createdAt;
}
