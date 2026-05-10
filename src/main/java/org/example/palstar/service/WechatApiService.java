package org.example.palstar.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.EntityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class WechatApiService {

    @Value("${wechat.appid}")
    private String appid;

    @Value("${wechat.secret}")
    private String secret;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getOpenid(String code) throws IOException {
        String url = String.format("https://api.weixin.qq.com/sns/jscode2session?appid=%s&secret=%s&js_code=%s&grant_type=authorization_code",
                appid, secret, code);

        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpGet request = new HttpGet(url);
            return httpClient.execute(request, response -> {
                String responseBody = EntityUtils.toString(response.getEntity());
                JsonNode jsonNode = objectMapper.readTree(responseBody);
                if (jsonNode.has("openid")) {
                    return jsonNode.get("openid").asText();
                } else {
                    throw new RuntimeException("Failed to get openid from WeChat: " + responseBody);
                }
            });
        }
    }
}
