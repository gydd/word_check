package com.wordcheck.service.impl;

import com.wordcheck.service.UserPointService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.UUID;

/**
 * 用户积分服务实现类
 */
@Slf4j
@Service
public class UserPointServiceImpl implements UserPointService {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Override
    public int getUserPoints(Integer userId) {
        if (userId == null || userId <= 0) {
            return 0;
        }
        
        try {
            String sql = "SELECT points FROM user WHERE id = ?";
            Integer points = jdbcTemplate.queryForObject(sql, Integer.class, userId);
            return points != null ? points : 0;
        } catch (Exception e) {
            log.error("获取用户积分异常", e);
            return 0;
        }
    }
    
    @Override
    @Transactional
    public boolean addPoints(Integer userId, int points, String reason) {
        if (userId == null || userId <= 0 || points <= 0) {
            return false;
        }
        
        try {
            // 更新用户积分
            String updateSql = "UPDATE user SET points = points + ? WHERE id = ?";
            int updatedRows = jdbcTemplate.update(updateSql, points, userId);
            
            if (updatedRows > 0) {
                // 记录积分变动日志
                return recordPointsChange(userId, points, true, reason);
            }
            return false;
        } catch (Exception e) {
            log.error("增加用户积分异常", e);
            return false;
        }
    }
    
    @Override
    @Transactional
    public boolean deductPoints(Integer userId, int points, String reason) {
        if (userId == null || userId <= 0 || points <= 0) {
            return false;
        }
        
        try {
            // 检查用户积分是否足够
            if (!checkPointsEnough(userId, points)) {
                log.warn("用户积分不足，无法扣减, userId: {}, 需要: {}", userId, points);
                return false;
            }
            
            // 更新用户积分
            String updateSql = "UPDATE user SET points = points - ? WHERE id = ? AND points >= ?";
            int updatedRows = jdbcTemplate.update(updateSql, points, userId, points);
            
            if (updatedRows > 0) {
                // 记录积分变动日志
                return recordPointsChange(userId, points, false, reason);
            }
            return false;
        } catch (Exception e) {
            log.error("扣减用户积分异常", e);
            return false;
        }
    }
    
    @Override
    public boolean checkPointsEnough(Integer userId, int points) {
        if (userId == null || userId <= 0 || points <= 0) {
            return false;
        }
        
        try {
            String sql = "SELECT points >= ? FROM user WHERE id = ?";
            Boolean enough = jdbcTemplate.queryForObject(sql, Boolean.class, points, userId);
            return Boolean.TRUE.equals(enough);
        } catch (Exception e) {
            log.error("检查用户积分是否足够异常", e);
            return false;
        }
    }
    
    /**
     * 记录积分变动日志
     * @param userId 用户ID
     * @param points 积分数量
     * @param isIncrease 是否是增加积分
     * @param reason 变动原因
     * @return 是否记录成功
     */
    private boolean recordPointsChange(Integer userId, int points, boolean isIncrease, String reason) {
        try {
            String id = UUID.randomUUID().toString().replace("-", "");
            String sql = "INSERT INTO point_log (id, user_id, points, change_type, reason, create_time) " +
                    "VALUES (?, ?, ?, ?, ?, ?)";
            
            int changeType = isIncrease ? 1 : 2; // 1=增加, 2=减少
            jdbcTemplate.update(sql, id, userId, points, changeType, reason, new Date());
            return true;
        } catch (Exception e) {
            log.error("记录积分变动日志异常", e);
            return false;
        }
    }
} 