package com.wordcheck.service;

import com.wordcheck.model.PointRecord;
import com.wordcheck.model.UserPoint;
import com.wordcheck.enums.PointActionEnum;
import com.wordcheck.enums.PointTypeEnum;
import com.wordcheck.model.dto.PointsDTO;
import com.wordcheck.model.dto.PointsRecordDTO;
import com.wordcheck.model.vo.PageResult;
import com.wordcheck.model.vo.PointRecordVO;
import com.wordcheck.model.vo.PointStatisticsVO;

import java.util.List;

/**
 * 积分服务接口
 * 提供积分管理的核心功能
 */
public interface PointService {

    /**
     * 获取用户可用积分
     *
     * @param userId 用户ID
     * @return 用户可用积分
     */
    Integer getUserAvailablePoints(Integer userId);

    /**
     * 增加用户积分
     *
     * @param userId      用户ID
     * @param points      积分数量
     * @param reason      原因
     * @param type        积分类型
     * @param businessId  业务ID
     * @param businessType 业务类型
     * @param remark      备注
     * @return 操作后的积分记录ID
     */
    Long increasePoints(Integer userId, Integer points, String reason, String type, 
                        Integer businessId, String businessType, String remark);

    /**
     * 减少用户积分
     *
     * @param userId      用户ID
     * @param points      积分数量
     * @param reason      原因
     * @param type        积分类型
     * @param businessId  业务ID
     * @param businessType 业务类型
     * @param remark      备注
     * @return 操作后的积分记录ID
     */
    Long decreasePoints(Integer userId, Integer points, String reason, String type, 
                        Integer businessId, String businessType, String remark);

    /**
     * 冻结用户积分
     *
     * @param userId      用户ID
     * @param points      积分数量
     * @param reason      原因
     * @param businessId  业务ID
     * @param businessType 业务类型
     * @param remark      备注
     * @return 操作后的积分记录ID
     */
    Long freezePoints(Integer userId, Integer points, String reason, 
                      Integer businessId, String businessType, String remark);

    /**
     * 解冻用户积分
     *
     * @param userId      用户ID
     * @param points      积分数量
     * @param reason      原因
     * @param businessId  业务ID
     * @param businessType 业务类型
     * @param remark      备注
     * @return 操作后的积分记录ID
     */
    Long unfreezePoints(Integer userId, Integer points, String reason, 
                        Integer businessId, String businessType, String remark);

    /**
     * 获取用户积分记录
     *
     * @param userId   用户ID
     * @param page     页码
     * @param pageSize 每页记录数
     * @return 积分记录列表
     */
    List<PointRecordVO> getUserPointRecords(Integer userId, Integer page, Integer pageSize);

    /**
     * 获取用户积分统计信息
     *
     * @param userId    用户ID
     * @param startDate 开始日期（可选）
     * @param endDate   结束日期（可选）
     * @return 积分统计信息
     */
    PointStatisticsVO getUserPointStatistics(Integer userId, String startDate, String endDate);

    /**
     * 获取用户积分
     * 
     * @param userId 用户ID
     * @return 用户积分信息
     */
    UserPoint getUserPoints(Integer userId);
    
    /**
     * 获取用户积分DTO
     *
     * @param userId 用户ID
     * @return 用户积分DTO
     */
    PointsDTO getUserPointsDTO(Integer userId);
    
    /**
     * 获取用户积分记录DTO
     *
     * @param userId   用户ID
     * @param page     页码
     * @param pageSize 每页记录数
     * @param type     记录类型，可选值：all-全部，earn-获取，spend-消费
     * @return 积分记录DTO
     */
    PointsRecordDTO getPointsRecords(Integer userId, Integer page, Integer pageSize, String type);
    
    /**
     * 初始化用户积分
     * 
     * @param userId 用户ID
     * @return 初始化的用户积分对象
     */
    UserPoint initUserPoints(Integer userId);
    
    /**
     * 添加用户积分
     * 
     * @param userId      用户ID
     * @param points      积分数量
     * @param reason      积分变动原因
     * @param type        积分类型
     * @param action      积分动作
     * @param businessId  业务ID
     * @param businessType 业务类型
     * @param remark      备注
     * @return 更新后的用户积分
     */
    UserPoint addPoints(Integer userId, Integer points, String reason, 
                      PointTypeEnum type, PointActionEnum action, 
                      Integer businessId, String businessType, String remark);
    
    /**
     * 扣减用户积分
     * 
     * @param userId      用户ID
     * @param points      积分数量
     * @param reason      积分变动原因
     * @param type        积分类型
     * @param action      积分动作
     * @param businessId  业务ID
     * @param businessType 业务类型
     * @param remark      备注
     * @return 更新后的用户积分
     */
    UserPoint deductPoints(Integer userId, Integer points, String reason, 
                         PointTypeEnum type, PointActionEnum action, 
                         Integer businessId, String businessType, String remark);
    
    /**
     * 获取用户积分记录
     * 
     * @param userId 用户ID
     * @param page   页码
     * @param size   每页大小
     * @return 分页的积分记录
     */
    PageResult<PointRecord> getPointRecords(Integer userId, Integer page, Integer size);
    
    /**
     * 更新用户等级
     * 
     * @param userId 用户ID
     * @return 更新后的用户积分
     */
    UserPoint updateUserLevel(Integer userId);
    
    /**
     * 根据累计积分计算用户等级
     * 
     * @param cumulativePoints 累计积分
     * @return 用户等级
     */
    int calculateUserLevel(Integer cumulativePoints);
    
    /**
     * 简化版扣减用户积分方法（针对API调用）
     *
     * @param userId 用户ID
     * @param points 扣减的积分数量
     * @param reason 扣减原因
     * @return 更新后的用户积分DTO
     */
    PointsDTO deductPoints(Integer userId, Integer points, String reason);
} 