package org.example.palstar.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;
import org.example.palstar.dto.MyCommentResponse;
import org.example.palstar.dto.MyLikedMomentResponse;
import org.example.palstar.entity.Moment;

@Mapper
public interface MomentMapper extends BaseMapper<Moment> {
	@Select(
		"SELECT m.id, m.title, m.like_count, u.id AS author_id, u.nickname AS author_nickname, "
			+ "u.avatar_url AS author_avatar_url, mm.media_url AS cover_url "
			+ "FROM moment_like ml "
			+ "JOIN moment m ON m.id = ml.moment_id "
			+ "LEFT JOIN moment_media mm ON mm.moment_id = m.id AND mm.sort_no = (" 
			+ "SELECT MIN(sort_no) FROM moment_media WHERE moment_id = m.id) "
			+ "JOIN user u ON u.id = m.author_id "
			+ "WHERE ml.user_id = #{userId} "
			+ "AND m.deleted_at IS NULL "
			+ "AND (m.status IS NULL OR m.status != 2) "
			+ "ORDER BY ml.created_at DESC"
	)
	@Results(id = "myLikedMomentMap", value = {
		@Result(property = "id", column = "id"),
		@Result(property = "title", column = "title"),
		@Result(property = "coverUrl", column = "cover_url"),
		@Result(property = "likeCount", column = "like_count"),
		@Result(property = "author.id", column = "author_id"),
		@Result(property = "author.nickname", column = "author_nickname"),
		@Result(property = "author.avatarUrl", column = "author_avatar_url")
	})
	List<MyLikedMomentResponse> findLikedMomentsByUserId(Long userId);

	@Select(
		"SELECT m.id, m.title, m.like_count, u.id AS author_id, u.nickname AS author_nickname, "
			+ "u.avatar_url AS author_avatar_url, mm.media_url AS cover_url "
			+ "FROM moment_favorite mf "
			+ "JOIN moment m ON m.id = mf.moment_id "
			+ "LEFT JOIN moment_media mm ON mm.moment_id = m.id AND mm.sort_no = (" 
			+ "SELECT MIN(sort_no) FROM moment_media WHERE moment_id = m.id) "
			+ "JOIN user u ON u.id = m.author_id "
			+ "WHERE mf.user_id = #{userId} "
			+ "AND m.deleted_at IS NULL "
			+ "AND (m.status IS NULL OR m.status != 2) "
			+ "ORDER BY mf.created_at DESC"
	)
	@Results(id = "myFavoritedMomentMap", value = {
		@Result(property = "id", column = "id"),
		@Result(property = "title", column = "title"),
		@Result(property = "coverUrl", column = "cover_url"),
		@Result(property = "likeCount", column = "like_count"),
		@Result(property = "author.id", column = "author_id"),
		@Result(property = "author.nickname", column = "author_nickname"),
		@Result(property = "author.avatarUrl", column = "author_avatar_url")
	})
	List<MyLikedMomentResponse> findFavoritedMomentsByUserId(Long userId);

	@Select(
		"SELECT mc.id, mc.content, mc.created_at, m.id AS moment_id, m.title AS moment_title "
			+ "FROM moment_comment mc "
			+ "JOIN moment m ON m.id = mc.moment_id "
			+ "WHERE mc.user_id = #{userId} "
			+ "AND mc.status = 0 "
			+ "AND m.deleted_at IS NULL "
			+ "AND (m.status IS NULL OR m.status != 2) "
			+ "ORDER BY mc.created_at DESC"
	)
	@Results(id = "myCommentMap", value = {
		@Result(property = "id", column = "id"),
		@Result(property = "content", column = "content"),
		@Result(property = "createdAt", column = "created_at"),
		@Result(property = "moment.id", column = "moment_id"),
		@Result(property = "moment.title", column = "moment_title")
	})
	List<MyCommentResponse> findCommentsByUserId(Long userId);
}
