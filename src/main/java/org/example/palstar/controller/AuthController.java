package org.example.palstar.controller;

import org.example.palstar.common.ApiResponse;
import org.example.palstar.dto.LoginResponse;
import org.example.palstar.dto.WechatLoginRequest;
import org.example.palstar.service.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private IUserService userService;

    @PostMapping("/login/wechat")
    public ApiResponse<LoginResponse> wechatLogin(@RequestBody WechatLoginRequest request) {
        try {
            LoginResponse loginResponse = userService.loginOrRegister(request);
            return ApiResponse.success("登录成功", loginResponse);
        } catch (IOException e) {
            return ApiResponse.error(500, "Failed to communicate with WeChat service");
        } catch (Exception e) {
            return ApiResponse.error(500, "Internal server error: " + e.getMessage());
        }
    }
}
