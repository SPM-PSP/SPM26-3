package org.example.palstar.dto;

import lombok.Data;

@Data
public class MomentMediaResponse {
    private Long id;
    private Integer mediaType;
    private String mediaUrl;
    private Integer sortNo;
}
