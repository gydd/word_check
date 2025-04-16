package com.wordcheck.model.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

import com.wordcheck.model.PointRecord;

/**
 * 积分记录数据传输对象
 */
@Data
public class PointRecordDTO implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 总记录数
     */
    private Integer total;
    
    /**
     * 当前页码
     */
    private Integer page;
    
    /**
     * 每页记录数
     */
    private Integer pageSize;
    
    /**
     * 总页数
     */
    private Integer totalPages;
    
    /**
     * 记录列表
     */
    private List<PointRecord> records;
} 