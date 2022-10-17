package com.kob.backend.controller.record;

import java.util.Objects;

import javax.annotation.Resource;
import javax.validation.Valid;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.kob.backend.biz.record.RecordBiz;
import com.kob.backend.common.DeleteQuery;
import com.kob.backend.common.PageMap;
import com.kob.backend.common.PageQuery;
import com.kob.backend.common.Result;
import com.kob.backend.controller.record.vo.RecordRespVO;

@RestController
@RequestMapping("/record")
public class RecordController {
    @Resource
    private RecordBiz recordBiz;

    @GetMapping("/list")
    public Result<PageMap<RecordRespVO>> getList(PageQuery pageQuery) {
        return Result.success(recordBiz.getList(pageQuery));
    }

    @DeleteMapping("/delete")
    public Result<?> deleteRecord(@Valid DeleteQuery query) {
        String errorMessage = recordBiz.delete(query);
        if (!Objects.isNull(errorMessage))
            return Result.error(errorMessage);
        return Result.success("对局删除成功");
    }
}
