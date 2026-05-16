package org.example.palstar.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.ResultMap;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;
import org.example.palstar.dto.UserPublicProfileResponse;
import org.example.palstar.entity.User;

@Mapper
public interface UserMapper extends BaseMapper<User> {
	@Select(
		"SELECT u.id, u.nickname, u.avatar_url "
			+ "FROM user_follow uf "
			+ "JOIN `user` u ON u.id = uf.follower_id "
			+ "WHERE uf.following_id = #{userId} AND uf.status = 0 "
			+ "ORDER BY uf.created_at DESC"
	)
	@Results(id = "userPublicProfileMap", value = {
		@Result(property = "id", column = "id"),
		@Result(property = "nickname", column = "nickname"),
		@Result(property = "avatarUrl", column = "avatar_url")
	})
	List<UserPublicProfileResponse> findFollowers(Long userId);

	@Select(
		"SELECT u.id, u.nickname, u.avatar_url "
			+ "FROM user_follow uf "
			+ "JOIN `user` u ON u.id = uf.following_id "
			+ "WHERE uf.follower_id = #{userId} AND uf.status = 0 "
			+ "ORDER BY uf.created_at DESC"
	)
	@ResultMap("userPublicProfileMap")
	List<UserPublicProfileResponse> findFollowing(Long userId);
}
