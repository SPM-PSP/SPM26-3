package org.example.palstar.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "tencent.cos")
public class TencentCosConfig {
    private String secretId;
    private String secretKey;
    private String region;
    private String bucket;
    private int durationSeconds;
}
