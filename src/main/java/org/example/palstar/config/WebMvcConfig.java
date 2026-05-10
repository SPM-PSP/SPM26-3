package org.example.palstar.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.example.palstar.interceptor.AuthInterceptor;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new AuthInterceptor())
                .addPathPatterns("/api/v1/**") // 拦截所有v1版本的API
                .excludePathPatterns("/api/v1/auth/login/wechat"); // 排除登录接口
    }
}
