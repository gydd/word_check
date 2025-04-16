package com.wordcheck.model.dto;

import com.wordcheck.model.PointRecord;
import lombok.Data;

import java.util.List;

/**
 * 积分记录数据传输对象
 */
@Data
public class PointsRecordDTO {
    /**
     * 总记录数
     */
    private Integer total;
    
    /**
     * 每页记录数
     */
    private Integer pageSize;
    
    /**
     * 当前页码
     */
    private Integer currentPage;
    
    /**
     * 总页数
     */
    private Integer totalPages;
    
    /**
     * 积分记录列表
     */
    private List<PointRecord> records;
} 