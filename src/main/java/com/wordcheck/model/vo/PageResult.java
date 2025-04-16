package com.wordcheck.model.vo;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

/**
 * 分页查询结果封装类
 * @param <T> 分页数据类型
 */
@Data
public class PageResult<T> implements Serializable {
    
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
    private Integer size;
    
    /**
     * 总页数
     */
    private Integer totalPages;
    
    /**
     * 数据记录列表
     */
    private List<T> records;
    
    /**
     * 计算总页数
     */
    public void calculateTotalPages() {
        if (this.total == null || this.size == null || this.size <= 0) {
            this.totalPages = 0;
        } else {
            this.totalPages = (int) Math.ceil((double) this.total / this.size);
        }
    }
}