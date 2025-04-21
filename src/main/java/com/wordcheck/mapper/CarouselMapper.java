package com.wordcheck.mapper;

import com.wordcheck.model.Carousel;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/**
 * 轮播图Mapper接口
 */
@Mapper
public interface CarouselMapper {
    
    /**
     * 查询所有启用状态的轮播图(考虑时间范围)
     * @return 轮播图列表
     */
    @Select("SELECT * FROM t_carousel WHERE status = 1 " +
            "AND (start_time IS NULL OR start_time <= NOW()) " +
            "AND (end_time IS NULL OR end_time >= NOW()) " +
            "ORDER BY sort ASC, id ASC")
    List<Carousel> selectActiveCarousels();
    
    /**
     * 根据ID查询轮播图
     * @param id 轮播图ID
     * @return 轮播图信息
     */
    @Select("SELECT * FROM t_carousel WHERE id = #{id}")
    Carousel selectById(Long id);
    
    /**
     * 查询所有轮播图
     * @return 轮播图列表
     */
    @Select("SELECT * FROM t_carousel ORDER BY sort ASC, id ASC")
    List<Carousel> selectAll();
    
    /**
     * 更新轮播图查看次数
     * @param id 轮播图ID
     * @return 影响行数
     */
    @Update("UPDATE t_carousel SET view_count = view_count + 1 WHERE id = #{id}")
    int incrementViewCount(@Param("id") Long id);
    
    /**
     * 更新轮播图点击次数
     * @param id 轮播图ID
     * @return 影响行数
     */
    @Update("UPDATE t_carousel SET click_count = click_count + 1 WHERE id = #{id}")
    int incrementClickCount(@Param("id") Long id);
} 