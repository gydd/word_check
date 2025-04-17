package com.wordcheck.service.impl;

import com.wordcheck.model.PointRecord;
import com.wordcheck.model.UserPoint;
import com.wordcheck.enums.PointActionEnum;
import com.wordcheck.enums.PointTypeEnum;
import com.wordcheck.mapper.PointRecordMapper;
import com.wordcheck.mapper.UserPointMapper;
import com.wordcheck.model.dto.PointsDTO;
import com.wordcheck.model.dto.PointsRecordDTO;
import com.wordcheck.model.vo.PointRecordVO;
import com.wordcheck.model.vo.PointStatisticsVO;
import com.wordcheck.service.PointService;
import com.wordcheck.model.vo.PageResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

/**
 * 积分服务实现类
 */
@Service
public class PointServiceImpl implements PointService {

    private static final Logger logger = LoggerFactory.getLogger(PointServiceImpl.class);

    @Autowired
    private UserPointMapper userPointMapper;

    @Autowired
    private PointRecordMapper pointRecordMapper;

    /**
     * 获取用户积分
     *
     * @param userId 用户ID
     * @return 用户积分信息
     */
    @Override
    public UserPoint getUserPoints(Integer userId) {
        logger.info("获取用户积分信息, userId: {}", userId);
        return userPointMapper.findByUserId(userId);
    }

    /**
     * 获取用户积分DTO
     *
     * @param userId 用户ID
     * @return 用户积分DTO
     */
    @Override
    public PointsDTO getUserPointsDTO(Integer userId) {
        logger.info("获取用户积分DTO, userId: {}", userId);
        
        UserPoint userPoint = getUserPoints(userId);
        
        // 如果用户积分不存在，则初始化
        if (userPoint == null) {
            logger.info("用户积分不存在，进行初始化, userId: {}", userId);
            userPoint = initUserPoints(userId);
        }
        
        // 将UserPoint转换为PointsDTO
        PointsDTO pointsDTO = new PointsDTO();
        pointsDTO.setCurrentPoints(userPoint.getCurrentPoints());
        pointsDTO.setTotalEarned(userPoint.getTotalEarned());
        pointsDTO.setTotalSpent(userPoint.getTotalSpent());
        pointsDTO.setLevel(userPoint.getLevel());
        pointsDTO.setLevelName(userPoint.getLevelName());
        pointsDTO.setNextLevelPoints(userPoint.getNextLevelPoints());
        
        return pointsDTO;
    }

    /**
     * 获取用户积分记录DTO
     *
     * @param userId   用户ID
     * @param page     页码
     * @param pageSize 每页记录数
     * @param type     记录类型，可选值：all-全部，earn-获取，spend-消费
     * @return 积分记录DTO
     */
    @Override
    public PointsRecordDTO getPointsRecords(Integer userId, Integer page, Integer pageSize, String type) {
        logger.info("获取用户积分记录, userId: {}, page: {}, pageSize: {}, type: {}", userId, page, pageSize, type);
        
        // 参数校验
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("用户ID无效");
        }
        
        if (page == null || page <= 0) {
            page = 1;
        }
        
        if (pageSize == null || pageSize <= 0) {
            pageSize = 10;
        }
        
        if (type == null) {
            type = "all";
        }
        
        // 计算分页参数
        int offset = (page - 1) * pageSize;
        
        // 查询总记录数
        int total = pointRecordMapper.countByUserIdAndType(userId, type);
        
        // 计算总页数
        int totalPages = (total + pageSize - 1) / pageSize;
        
        // 查询记录列表
        List<PointRecord> pointRecords = pointRecordMapper.findByUserIdAndType(userId, type, offset, pageSize);
        
        // 构建返回对象
        PointsRecordDTO recordsDTO = new PointsRecordDTO();
        recordsDTO.setTotal(total);
        recordsDTO.setCurrentPage(page);
        recordsDTO.setPageSize(pageSize);
        recordsDTO.setTotalPages(totalPages);
        recordsDTO.setPointRecords(pointRecords); // 使用新的方法
        
        return recordsDTO;
    }

    /**
     * 初始化用户积分
     *
     * @param userId 用户ID
     * @return 初始化的用户积分对象
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserPoint initUserPoints(Integer userId) {
        logger.info("初始化用户积分, userId: {}", userId);
        
        // 检查是否已存在
        UserPoint existPoint = userPointMapper.findByUserId(userId);
        if (existPoint != null) {
            logger.info("用户积分已存在，无需初始化, userId: {}", userId);
            return existPoint;
        }
        
        // 创建新用户积分记录
        UserPoint userPoint = new UserPoint();
        userPoint.setUserId(userId);
        userPoint.setCurrentPoints(0);
        userPoint.setTotalEarned(0);
        userPoint.setTotalSpent(0);
        userPoint.setLevel(1);
        userPoint.setLevelName("初学者");
        userPoint.setNextLevelPoints(200);
        
        userPointMapper.insert(userPoint);
        logger.info("用户积分初始化成功, userId: {}", userId);
        
        return userPoint;
    }

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
    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserPoint addPoints(Integer userId, Integer points, String reason, 
                              PointTypeEnum type, PointActionEnum action, 
                              Integer businessId, String businessType, String remark) {
        if (points <= 0) {
            logger.warn("添加积分数量必须大于0, userId: {}, points: {}", userId, points);
            throw new IllegalArgumentException("添加积分数量必须大于0");
        }
        
        return changePoints(userId, points, reason, type, action, businessId, businessType, remark);
    }

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
    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserPoint deductPoints(Integer userId, Integer points, String reason, 
                                 PointTypeEnum type, PointActionEnum action, 
                                 Integer businessId, String businessType, String remark) {
        if (points <= 0) {
            logger.warn("扣减积分数量必须大于0, userId: {}, points: {}", userId, points);
            throw new IllegalArgumentException("扣减积分数量必须大于0");
        }
        
        UserPoint userPoint = userPointMapper.findByUserId(userId);
        if (userPoint == null) {
            logger.warn("用户积分不存在, userId: {}", userId);
            throw new IllegalArgumentException("用户积分不存在");
        }
        
        if (userPoint.getCurrentPoints() < points) {
            logger.warn("用户积分不足, userId: {}, 当前积分: {}, 需扣减积分: {}", 
                    userId, userPoint.getCurrentPoints(), points);
            throw new IllegalArgumentException("用户积分不足");
        }
        
        return changePoints(userId, -points, reason, type, action, businessId, businessType, remark);
    }

    /**
     * 修改用户积分（内部方法）
     */
    private UserPoint changePoints(Integer userId, Integer points, String reason, 
                                  PointTypeEnum type, PointActionEnum action, 
                                  Integer businessId, String businessType, String remark) {
        // 获取用户积分，如果不存在则初始化
        UserPoint userPoint = userPointMapper.findByUserId(userId);
        if (userPoint == null) {
            userPoint = initUserPoints(userId);
        }
        
        // 记录变更前积分
        int beforePoints = userPoint.getCurrentPoints();
        
        // 更新积分
        int newPoints = beforePoints + points;
        int newTotalEarned = userPoint.getTotalEarned();
        int newTotalSpent = userPoint.getTotalSpent();
        
        // 根据积分变动更新总获取和总消费
        if (points > 0) {
            newTotalEarned += points;
        } else {
            newTotalSpent -= points;  // points是负数，所以用减法
        }
        
        userPoint.setCurrentPoints(newPoints);
        userPoint.setTotalEarned(newTotalEarned);
        userPoint.setTotalSpent(newTotalSpent);
        
        // 更新用户积分
        userPointMapper.update(userPoint);
        
        // 记录积分变动
        PointRecord record = new PointRecord();
        record.setUserId(userId);
        record.setPoints(points);
        record.setReason(reason);
        record.setType(type.name());
        record.setAction(action.name());
        record.setBusinessId(businessId);
        record.setBusinessType(businessType);
        record.setRemark(remark);
        record.setBeforePoints(beforePoints);
        record.setAfterPoints(newPoints);
        
        pointRecordMapper.insert(record);
        
        logger.info("用户积分变更成功, userId: {}, 变更积分: {}, 变更前: {}, 变更后: {}, 原因: {}", 
                userId, points, beforePoints, newPoints, reason);
        
        return userPoint;
    }

    /**
     * 获取用户积分记录
     *
     * @param userId 用户ID
     * @param page   页码
     * @param size   每页大小
     * @return 分页的积分记录
     */
    @Override
    public PageResult<PointRecord> getPointRecords(Integer userId, Integer page, Integer size) {
        logger.info("获取用户积分记录, userId: {}, page: {}, size: {}", userId, page, size);
        
        // 计算分页参数
        int offset = (page - 1) * size;
        
        // 查询总记录数
        int total = pointRecordMapper.countByUserId(userId);
        
        // 查询记录列表
        List<PointRecord> records = pointRecordMapper.selectByUserIdWithPagination(userId, offset, size);
        
        // 返回分页结果
        PageResult<PointRecord> result = new PageResult<>();
        result.setTotal(total);
        result.setPage(page);
        result.setSize(size);
        result.setRecords(records);
        result.calculateTotalPages();
        
        return result;
    }

    /**
     * 更新用户等级
     *
     * @param userId 用户ID
     * @return 更新后的用户积分
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public UserPoint updateUserLevel(Integer userId) {
        UserPoint userPoint = userPointMapper.findByUserId(userId);
        if (userPoint == null) {
            return null;
        }
        
        int totalPoints = userPoint.getTotalEarned();
        int newLevel = calculateUserLevel(totalPoints);
        
        if (newLevel != userPoint.getLevel()) {
            userPoint.setLevel(newLevel);
            
            // 根据级别设置名称和下一级所需积分
            switch (newLevel) {
                case 1:
                    userPoint.setLevelName("初学者");
                    userPoint.setNextLevelPoints(200);
                    break;
                case 2:
                    userPoint.setLevelName("进阶学者");
                    userPoint.setNextLevelPoints(500);
                    break;
                case 3:
                    userPoint.setLevelName("高级学者");
                    userPoint.setNextLevelPoints(1000);
                    break;
                case 4:
                    userPoint.setLevelName("专家");
                    userPoint.setNextLevelPoints(2000);
                    break;
                case 5:
                    userPoint.setLevelName("大师");
                    userPoint.setNextLevelPoints(null);  // 最高级别，没有下一级
                    break;
                default:
                    userPoint.setLevelName("未知等级");
                    userPoint.setNextLevelPoints(null);
            }
            
            userPointMapper.update(userPoint);
            logger.info("用户等级更新成功, userId: {}, 新等级: {}", userId, newLevel);
        }
        
        return userPoint;
    }

    /**
     * 根据累计积分计算用户等级
     *
     * @param totalPoints 累计积分
     * @return 用户等级
     */
    @Override
    public int calculateUserLevel(Integer totalPoints) {
        if (totalPoints < 200) {
            return 1;  // 初学者
        } else if (totalPoints < 500) {
            return 2;  // 进阶学者
        } else if (totalPoints < 1000) {
            return 3;  // 高级学者
        } else if (totalPoints < 2000) {
            return 4;  // 专家
        } else {
            return 5;  // 大师
        }
    }

    // 其他未实现的接口方法，根据需要实现

    @Override
    public Integer getUserAvailablePoints(Integer userId) {
        UserPoint userPoint = getUserPoints(userId);
        return userPoint != null ? userPoint.getCurrentPoints() : 0;
    }

    @Override
    public Long increasePoints(Integer userId, Integer points, String reason, String type, Integer businessId, String businessType, String remark) {
        // 将字符串类型转换为枚举
        PointTypeEnum typeEnum = PointTypeEnum.valueOf(type.toUpperCase());
        PointActionEnum actionEnum = PointActionEnum.SYSTEM_GRANT; // 默认系统赠送

        UserPoint userPoint = addPoints(userId, points, reason, typeEnum, actionEnum, businessId, businessType, remark);
        
        // 返回记录ID，这里简化处理，实际应该返回新插入的记录ID
        return userPoint != null ? 1L : null;
    }

    @Override
    public Long decreasePoints(Integer userId, Integer points, String reason, String type, Integer businessId, String businessType, String remark) {
        // 将字符串类型转换为枚举
        PointTypeEnum typeEnum = PointTypeEnum.valueOf(type.toUpperCase());
        PointActionEnum actionEnum = PointActionEnum.OTHER; // 默认其他

        UserPoint userPoint = deductPoints(userId, points, reason, typeEnum, actionEnum, businessId, businessType, remark);
        
        // 返回记录ID，这里简化处理，实际应该返回新插入的记录ID
        return userPoint != null ? 1L : null;
    }

    @Override
    public Long freezePoints(Integer userId, Integer points, String reason, Integer businessId, String businessType, String remark) {
        // 实现冻结积分功能
        // 暂未实现，返回null
        return null;
    }

    @Override
    public Long unfreezePoints(Integer userId, Integer points, String reason, Integer businessId, String businessType, String remark) {
        // 实现解冻积分功能
        // 暂未实现，返回null
        return null;
    }

    @Override
    public List<PointRecordVO> getUserPointRecords(Integer userId, Integer page, Integer pageSize) {
        // 实现获取用户积分记录列表
        // 暂未实现，返回null
        return null;
    }

    @Override
    public PointStatisticsVO getUserPointStatistics(Integer userId, String startDate, String endDate) {
        // 实现获取用户积分统计信息
        // 暂未实现，返回null
        return null;
    }
} 