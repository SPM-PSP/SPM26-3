package org.example.palstar.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;
import org.example.palstar.entity.User;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
