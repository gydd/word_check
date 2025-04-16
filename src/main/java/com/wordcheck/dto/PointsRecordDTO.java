package com.wordcheck.dto;

import com.wordcheck.model.PointRecord;
import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * 积分记录DTO
 */
@Data
public class PointsRecordDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
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
     * 记录列表
     */
    private List<PointRecord> records;
}