package org.example.palstar.service;

import com.google.gson.Gson;
import com.tencentcloudapi.common.Credential;
import com.tencentcloudapi.common.exception.TencentCloudSDKException;
import com.tencentcloudapi.sts.v20180813.StsClient;
import com.tencentcloudapi.sts.v20180813.models.GetFederationTokenRequest;
import com.tencentcloudapi.sts.v20180813.models.GetFederationTokenResponse;
import org.example.palstar.config.TencentCosConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CosService {

    @Autowired
    private TencentCosConfig cosConfig;

    public GetFederationTokenResponse getStsCredentials() {
        try {
            // 1. 创建认证凭证
            Credential cred = new Credential(cosConfig.getSecretId(), cosConfig.getSecretKey());

            // 2. 创建 STS 客户端
            StsClient client = new StsClient(cred, cosConfig.getRegion());

            // 3. 创建请求对象
            GetFederationTokenRequest req = new GetFederationTokenRequest();
            req.setName("palstar-user-upload");

            // 4. 构建 Policy（修正后的写法）
            Map<String, Object> policy = new HashMap<>();
            policy.put("version", "2.0");

            // 构建 statement 数组
            List<Map<String, Object>> statements = new ArrayList<>();
            Map<String, Object> statement = new HashMap<>();
            statement.put("action", new String[]{
                    "name/cos:PutObject",
                    "name/cos:PostObject"
            });
            statement.put("effect", "allow");

            // 构建 resource（从 bucket 名中提取 APPID）
            String bucketName = cosConfig.getBucket();
            // bucket 格式：myapp-1250000000，最后的数字部分是 APPID
            String appId = bucketName.substring(bucketName.lastIndexOf("-") + 1);
            String resource = String.format(
                    "qcs::cos:%s:uid/%s:%s/*",
                    cosConfig.getRegion(),
                    appId,
                    bucketName
            );
            statement.put("resource", new String[]{resource});

            statements.add(statement);
            policy.put("statement", statements);

            // 转换为 JSON 字符串
            String policyJson = new Gson().toJson(policy);
            req.setPolicy(policyJson);

            // 5. 设置有效期（秒）
            req.setDurationSeconds((long) cosConfig.getDurationSeconds());

            // 6. 调用并返回结果
            return client.GetFederationToken(req);

        } catch (TencentCloudSDKException e) {
            throw new RuntimeException("Failed to get STS credentials from Tencent Cloud", e);
        }
    }
}
