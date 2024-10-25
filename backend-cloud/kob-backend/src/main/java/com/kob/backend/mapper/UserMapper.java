package com.kob.backend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.kob.backend.dataobject.UserDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.springframework.stereotype.Repository;

import java.util.List;

@Mapper
@Repository
public interface UserMapper extends BaseMapper<UserDO> {
    @Select({"<script>",
            "WITH ranked_users AS (",
            "    SELECT u.*,",
            "    (SELECT COUNT(1) FROM user t",
            "     WHERE t.id != 1",
            "     AND (t.rating > u.rating",
            "          OR (t.rating = u.rating AND UNIX_TIMESTAMP(t.create_time) &lt; UNIX_TIMESTAMP(u.create_time)))",
            "    ) + 1 as rank_num",
            "    FROM user u",
            "    WHERE u.id != 1",
            "    <if test='name != null and name != \"\"'>",
            "        AND u.name LIKE CONCAT('%', #{name}, '%')",
            "    </if>",
            ")",
            "SELECT *",
            "FROM ranked_users",
            "ORDER BY rating DESC, create_time ASC",
            "LIMIT #{offset}, #{size}",
            "</script>"})
    List<UserDO> selectUserWithRank(@Param("name") String name,
                                    @Param("offset") int offset,
                                    @Param("size") int size);
}
