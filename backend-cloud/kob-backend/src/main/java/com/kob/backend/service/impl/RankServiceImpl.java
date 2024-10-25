package com.kob.backend.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.kob.backend.common.PageMap;
import com.kob.backend.common.PageQuery;
import com.kob.backend.controller.rank.vo.RankRespVO;
import com.kob.backend.controller.record.vo.RecordSearchVO;
import com.kob.backend.convert.UserConverter;
import com.kob.backend.dataobject.UserDO;
import com.kob.backend.service.RankService;
import com.kob.backend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.annotation.Resource;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RankServiceImpl implements RankService {
    private static final String RANKING_KEY = "user:ranking";
    private static final String TOTAL_COUNT_KEY = "user:ranking:total";
    private static final long CACHE_EXPIRE_TIME = 3600; // 1小时

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    @Resource
    private UserService userService;

    @Override
    public PageMap<RankRespVO> getRankingList(PageQuery pageQuery, RecordSearchVO searchVO) {
        String nameFilter = searchVO.getName();

        // 如果有名称筛选，直接走数据库查询
        if (StringUtils.hasText(nameFilter)) {
            return getListFromDB(pageQuery, searchVO);
        }

        // 检查缓存是否存在
        Boolean hasKey = redisTemplate.hasKey(RANKING_KEY);
        if (Boolean.FALSE.equals(hasKey)) {
            return getListFromDB(pageQuery, searchVO);
        }

        // 获取分页数据
        int start = (pageQuery.getPage() - 1) * pageQuery.getPageSize();
        int end = start + pageQuery.getPageSize() - 1;
        Set<Object> pageRange = redisTemplate.opsForZSet().reverseRange(RANKING_KEY, start, end);

        if (pageRange == null || pageRange.isEmpty()) {
            return getListFromDB(pageQuery, searchVO);
        }

        // 获取总排名用于计算实际排名
        Set<Object> allRankings = redisTemplate.opsForZSet().reverseRange(RANKING_KEY, 0, -1);
        Map<Integer, Integer> rankMap = new HashMap<>();
        int rank = 1;
        for (Object userId : allRankings) {
            rankMap.put((Integer) userId, rank++);
        }

        // 处理分页数据
        List<RankRespVO> result = new ArrayList<>();
        for (Object userId : pageRange) {
            UserDO user = userService.getById((Integer) userId);
            if (user != null) {
                RankRespVO rankVO = UserConverter.INSTANCE.do2RankVO(user);
                rankVO.setRankNum(rankMap.get((Integer) userId));
                result.add(rankVO);
            }
        }

        // 获取总数
        Object totalObj = redisTemplate.opsForValue().get(TOTAL_COUNT_KEY);
        long total = totalObj != null ? Long.parseLong(totalObj.toString()) : userService.count();

        return PageMap.data(total, result);
    }

    private PageMap<RankRespVO> getListFromDB(PageQuery pageQuery, RecordSearchVO searchVO) {
        int offset = (pageQuery.getPage() - 1) * pageQuery.getPageSize();
        List<UserDO> users = userService.selectUserWithRank(
                searchVO.getName(),
                offset,
                pageQuery.getPageSize()
        );

        if (users.isEmpty()) {
            return PageMap.empty();
        }

        List<RankRespVO> data = users.stream()
                .map(user -> {
                    RankRespVO rankVO = UserConverter.INSTANCE.do2RankVO(user);
                    rankVO.setRankNum(user.getRankNum());
                    return rankVO;
                })
                .collect(Collectors.toList());

        long total = userService.count(Wrappers.<UserDO>lambdaQuery()
                .ne(UserDO::getId, 1)
                .like(StringUtils.hasText(searchVO.getName()),
                        UserDO::getName,
                        searchVO.getName()));

        return PageMap.data(total, data);
    }

    @Scheduled(fixedRate = 3600000)
    public void refreshRankingCache() {
        List<UserDO> users = userService.list(
                Wrappers.<UserDO>lambdaQuery()
                        .ne(UserDO::getId, 1)
                        .orderByDesc(UserDO::getRating)
                        .orderByAsc(UserDO::getCreateTime)  // 添加创建时间升序排序
        );

        redisTemplate.delete(RANKING_KEY);
        redisTemplate.delete(TOTAL_COUNT_KEY);

        if (!users.isEmpty()) {
            for (UserDO user : users) {
                // 使用复合分数：rating * 1000000000000 + (Long.MAX_VALUE - createTime.getTime())
                // 这样可以保证相同rating的情况下，创建时间早的排在前面
                long createTimeScore = Long.MAX_VALUE - user.getCreateTime().getTime();
                double score = user.getRating() * 1000000000000.0 + createTimeScore;
                redisTemplate.opsForZSet().add(RANKING_KEY, user.getId(), score);
            }
            redisTemplate.opsForValue().set(TOTAL_COUNT_KEY, Long.valueOf(users.size()),
                    CACHE_EXPIRE_TIME, TimeUnit.SECONDS);
            redisTemplate.expire(RANKING_KEY, CACHE_EXPIRE_TIME, TimeUnit.SECONDS);
        }
    }

    public void updateUserRating(Integer userId, Integer newRating) {
        UserDO user = userService.getById(userId);
        if (user != null) {
            userService.update(
                    Wrappers.<UserDO>lambdaUpdate()
                            .eq(UserDO::getId, userId)
                            .set(UserDO::getRating, newRating)
            );

            // 更新缓存时也使用复合分数
            long createTimeScore = Long.MAX_VALUE - user.getCreateTime().getTime();
            double score = newRating * 1000000000000.0 + createTimeScore;
            redisTemplate.opsForZSet().add(RANKING_KEY, userId, score);
        }
    }

    public int calculateNewRating(int playerRating, int opponentRating, boolean won) {
        double expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400.0));
        double actualScore = won ? 1.0 : 0.0;
        return (int) Math.round(playerRating + 32 * (actualScore - expectedScore));
    }
}
