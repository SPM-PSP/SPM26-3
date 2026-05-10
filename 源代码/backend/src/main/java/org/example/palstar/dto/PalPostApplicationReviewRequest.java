package org.example.palstar.dto;

import lombok.Data;

@Data
public class PalPostApplicationReviewRequest {
    private Integer status;
    private String rejectReason;
}
