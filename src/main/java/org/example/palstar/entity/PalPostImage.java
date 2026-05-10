package org.example.palstar.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("pal_post_image")
public class PalPostImage {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long postId;

    private String imageUrl;

    private Integer sortNo;

    private LocalDateTime createdAt;
}
