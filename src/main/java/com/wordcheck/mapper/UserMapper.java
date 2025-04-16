package com.wordcheck.mapper;

import com.wordcheck.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 用户数据访问接口
 */
@Mapper
public interface UserMapper {
    /**
     * 根据ID查询用户
     *
     * @param id 用户ID
     * @return 用户对象
     */
    User findById(@Param("id") Integer id);
    
    /**
     * 根据微信openid查询用户
     *
     * @param openid 微信openid
     * @return 用户对象
     */
    User findByOpenid(@Param("openid") String openid);
    
    /**
     * 插入新用户
     *
     * @param user 用户对象
     * @return 影响行数
     */
    int insert(User user);
    
    /**
     * 更新用户信息
     *
     * @param user 用户对象
     * @return 影响行数
     */
    int update(User user);
} 