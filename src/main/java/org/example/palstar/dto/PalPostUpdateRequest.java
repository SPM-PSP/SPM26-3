package org.example.palstar.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;

@Data
public class PalPostUpdateRequest {
    private String scene;
    private String title;
    private String content;
    private String location;
    private LocalDateTime startTime;
    private Integer expectedCount;
    private Integer genderRequirement;
    private List<String> gradeRequirement;
    private List<String> interestRequirements;
    private String coverImage;
    private List<String> imageUrls;
}
