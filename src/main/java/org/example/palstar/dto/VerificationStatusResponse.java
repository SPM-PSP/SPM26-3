package org.example.palstar.dto;

import lombok.Data;
import org.example.palstar.entity.StudentVerification;

@Data
public class VerificationStatusResponse {
    private Integer status;
    private StudentVerification application;
}
