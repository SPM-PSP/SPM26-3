package org.example.palstar.dto;

import lombok.Data;

@Data
public class StudentVerificationRequest {
    private String realName;
    private String studentNo;
    private String school;
    private String proofImageUrl;
}
