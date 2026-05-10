package org.example.palstar.dto;

import java.util.List;
import lombok.Data;

@Data
public class MomentUpdateRequest {
    private String title;
    private String content;
    private String location;
    private List<String> tags;
    private Integer status;
    private List<MomentMediaRequest> media;
}
