package org.example.palstar.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Data;

@Data
public class PalPostResponse {
    private Long id;
    private Long authorId;
    private String scene;
    private String title;
    private String content;
    private String location;
    private LocalDateTime startTime;
    private Integer expectedCount;
    private Integer currentCount;
    private Integer genderRequirement;
    private List<String> gradeRequirement;
    private List<String> interestRequirements;
    private Integer status;
    private Integer isPinned;
    private Integer reviewStatus;
    private String coverImage;
    private List<String> imageUrls;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
