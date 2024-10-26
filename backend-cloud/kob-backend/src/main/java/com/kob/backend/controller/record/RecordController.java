package com.kob.backend.controller.record;

import com.kob.backend.common.DeleteQuery;
import com.kob.backend.common.PageMap;
import com.kob.backend.common.PageQuery;
import com.kob.backend.common.Result;
import com.kob.backend.controller.record.vo.RecordRespVO;
import com.kob.backend.controller.record.vo.RecordSearchVO;
import com.kob.backend.convert.RecordConverter;
import com.kob.backend.dataobject.RecordDO;
import com.kob.backend.service.RecordService;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.validation.Valid;
import java.util.Objects;

@RestController
@RequestMapping("/api/record")
public class RecordController {
    @Resource
    private RecordService recordService;

    @GetMapping("/list")
    public Result<PageMap<RecordRespVO>> getList(PageQuery pageQuery, RecordSearchVO searchVO) {
        return Result.success(recordService.getList(pageQuery, searchVO));
    }

    @DeleteMapping("/delete")
    public Result<?> deleteRecord(@Valid DeleteQuery query) {
        String errorMessage = recordService.delete(query);
        if (!Objects.isNull(errorMessage))
            return Result.error(errorMessage);
        return Result.success("对局删除成功");
    }

    @GetMapping("/getById")
    public Result<RecordRespVO> getById(@RequestParam Integer id) {
        RecordDO record = recordService.getById(id);
        if (!Objects.isNull(record)) {
            return  Result.success(RecordConverter.INSTANCE.do2vo(record));
        }
        return Result.success(null);
    }
}
