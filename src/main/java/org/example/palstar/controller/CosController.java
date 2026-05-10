package org.example.palstar.controller;

import com.tencentcloudapi.sts.v20180813.models.GetFederationTokenResponse;
import org.example.palstar.common.ApiResponse;
import org.example.palstar.service.CosService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/cos")
public class CosController {

    @Autowired
    private CosService cosService;

    @GetMapping("/upload")
    public ApiResponse<GetFederationTokenResponse> getStsCredentials() {
        try {
            GetFederationTokenResponse credentials = cosService.getStsCredentials();
            return ApiResponse.success(credentials);
        } catch (Exception e) {
            return ApiResponse.error(500, "获取上传凭证失败: " + e.getMessage());
        }
    }
}
