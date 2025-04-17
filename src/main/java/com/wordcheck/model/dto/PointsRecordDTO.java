package com.wordcheck.model.dto;

import com.wordcheck.enums.PointActionEnum;
import com.wordcheck.enums.PointTypeEnum;
import com.wordcheck.model.PointRecord;
import lombok.Data;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 积分记录DTO
 */
@Data
public class PointsRecordDTO {
    /**
     * 总记录数
     */
    private int total;
    
    /**
     * 当前页码
     */
    private int currentPage;
    
    /**
     * 每页记录数
     */
    private int pageSize;
    
    /**
     * 总页数
     */
    private int totalPages;
    
    /**
     * 记录列表
     */
    private List<Map<String, Object>> records;
    
    /**
     * 将PointRecord列表转换为Map列表并设置到records字段
     *
     * @param pointRecords PointRecord对象列表
     */
    public void setPointRecords(List<PointRecord> pointRecords) {
        if (pointRecords == null) {
            this.records = new ArrayList<>();
            return;
        }
        
        List<Map<String, Object>> recordMaps = new ArrayList<>();
        for (PointRecord record : pointRecords) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", record.getId());
            map.put("userId", record.getUserId());
            map.put("points", record.getPoints());
            map.put("reason", record.getReason());
            map.put("type", record.getType());
            map.put("action", record.getAction());
            map.put("businessId", record.getBusinessId());
            map.put("businessType", record.getBusinessType());
            map.put("remark", record.getRemark());
            map.put("beforePoints", record.getBeforePoints());
            map.put("afterPoints", record.getAfterPoints());
            map.put("createdAt", record.getCreatedAt());
            map.put("updatedAt", record.getUpdatedAt());
            
            // 添加枚举类型的描述信息
            try {
                PointTypeEnum typeEnum = PointTypeEnum.valueOf(record.getType());
                map.put("typeDesc", typeEnum.getDescription());
            } catch (Exception e) {
                map.put("typeDesc", "未知类型");
            }
            
            try {
                PointActionEnum actionEnum = PointActionEnum.valueOf(record.getAction());
                map.put("actionDesc", actionEnum.getDescription());
            } catch (Exception e) {
                map.put("actionDesc", "未知动作");
            }
            
            recordMaps.add(map);
        }
        
        this.records = recordMaps;
    }
} 