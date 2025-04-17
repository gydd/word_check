package com.wordcheck.service.impl;

import com.wordcheck.enums.PointActionEnum;
import com.wordcheck.enums.PointTypeEnum;
import com.wordcheck.mapper.SignInMapper;
import com.wordcheck.model.SignIn;
import com.wordcheck.model.dto.SignInResponseDTO;
import com.wordcheck.model.dto.SignInStatusDTO;
import com.wordcheck.service.PointService;
import com.wordcheck.service.SignInService;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;

/**
 * 签到服务实现类
 */
@Slf4j
@Service
public class SignInServiceImpl implements SignInService {

    @Autowired
    private SignInMapper signInMapper;
    
    @Autowired
    private PointService pointService;
    
    /**
     * 用户签到
     *
     * @param userId 用户ID
     * @return 签到结果
     */
    @Override
    @Transactional
    public SignInResponseDTO signIn(Integer userId) {
        log.info("用户签到, userId: {}", userId);
        
        LocalDate today = LocalDate.now();
        
        // 检查今日是否已签到
        SignIn existingSignIn = signInMapper.findByUserIdAndDate(userId, today);
        if (existingSignIn != null) {
            log.info("用户今日已签到, userId: {}", userId);
            
            // 返回已签到错误信息
            throw new IllegalStateException("今日已签到，请明天再来");
        }
        
        // 获取用户最近一次签到记录
        SignIn lastSignIn = signInMapper.findLastByUserId(userId);
        
        // 计算连续签到天数
        int continuousDays = 1; // 默认为1天
        if (lastSignIn != null) {
            LocalDate lastSignDate = lastSignIn.getSignDate();
            LocalDate yesterday = today.minusDays(1);
            
            // 如果最后一次签到是昨天，则连续签到天数+1
            if (lastSignDate.equals(yesterday)) {
                continuousDays = lastSignIn.getContinuousDays() + 1;
            }
        }
        
        // 计算签到获得的积分
        int points = calculateSignInPoints(continuousDays);
        
        // 创建签到记录
        SignIn signIn = new SignIn();
        signIn.setUserId(userId);
        signIn.setContinuousDays(continuousDays);
        signIn.setPoints(points);
        signIn.setSignDate(today);
        
        // 保存签到记录
        signInMapper.insert(signIn);
        
        // 增加用户积分
        pointService.addPoints(userId, points, "每日签到奖励", 
                PointTypeEnum.SIGN_IN, PointActionEnum.ADD, 
                signIn.getId(), "sign_in", "连续签到" + continuousDays + "天");
        
        // 构建响应
        SignInResponseDTO response = new SignInResponseDTO();
        response.setPoints(points);
        response.setContinuousDays(continuousDays);
        response.setSignDate(today);
        response.setCurrentPoints(pointService.getUserAvailablePoints(userId));
        response.setTotalSignDays(signInMapper.countByUserId(userId));
        
        log.info("用户签到成功, userId: {}, 连续签到: {}天, 获得积分: {}", 
                userId, continuousDays, points);
        
        return response;
    }
    
    /**
     * 获取用户签到状态
     *
     * @param userId 用户ID
     * @return 签到状态
     */
    @Override
    public SignInStatusDTO getSignInStatus(Integer userId) {
        log.info("获取用户签到状态, userId: {}", userId);
        
        LocalDate today = LocalDate.now();
        SignInStatusDTO status = new SignInStatusDTO();
        
        // 检查今日是否已签到
        SignIn todaySignIn = signInMapper.findByUserIdAndDate(userId, today);
        status.setTodaySigned(todaySignIn != null);
        
        // 获取连续签到天数
        SignIn lastSignIn = signInMapper.findLastByUserId(userId);
        
        if (lastSignIn != null) {
            // 如果最后一次签到是今天，则使用该记录的连续天数
            if (lastSignIn.getSignDate().equals(today)) {
                status.setContinuousDays(lastSignIn.getContinuousDays());
            } 
            // 如果最后一次签到是昨天，则连续天数是该记录的连续天数
            else if (lastSignIn.getSignDate().equals(today.minusDays(1))) {
                status.setContinuousDays(lastSignIn.getContinuousDays());
            }
            // 如果最后一次签到是更早日期，则连续签到重置为0
            else {
                status.setContinuousDays(0);
            }
        } else {
            status.setContinuousDays(0);
        }
        
        // 获取总签到天数
        int totalDays = signInMapper.countByUserId(userId);
        status.setTotalSignDays(totalDays);
        
        // 获取本周签到情况
        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate sunday = today.with(TemporalAdjusters.nextOrSame(DayOfWeek.SUNDAY));
        List<SignIn> weekSignIns = signInMapper.findByUserIdAndDateRange(userId, monday, sunday);
        
        List<Boolean> weekSignStatus = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = monday.plusDays(i);
            boolean signed = weekSignIns.stream()
                    .anyMatch(s -> s.getSignDate().equals(date));
            weekSignStatus.add(signed);
        }
        status.setThisWeekSigned(weekSignStatus);
        
        // 获取本月签到情况
        LocalDate firstDayOfMonth = today.withDayOfMonth(1);
        LocalDate lastDayOfMonth = today.with(TemporalAdjusters.lastDayOfMonth());
        List<SignIn> monthSignIns = signInMapper.findByUserIdAndMonth(
                userId, today.getYear(), today.getMonthValue());
        
        List<Boolean> monthSignStatus = new ArrayList<>();
        for (int i = 1; i <= lastDayOfMonth.getDayOfMonth(); i++) {
            LocalDate date = LocalDate.of(today.getYear(), today.getMonth(), i);
            boolean signed = monthSignIns.stream()
                    .anyMatch(s -> s.getSignDate().equals(date));
            monthSignStatus.add(signed);
        }
        status.setThisMonthSigned(monthSignStatus);
        
        log.info("获取用户签到状态成功, userId: {}, 今日是否已签到: {}, 连续签到: {}天, 总签到: {}天",
                userId, status.getTodaySigned(), status.getContinuousDays(), status.getTotalSignDays());
        
        return status;
    }
    
    /**
     * 计算签到获得的积分
     * 规则：
     * - 基础积分：5分
     * - 连续签到奖励：
     *   - 连续7天：额外10分
     *   - 连续14天：额外15分
     *   - 连续21天：额外20分
     *   - 连续30天：额外30分
     *
     * @param continuousDays 连续签到天数
     * @return 获得的积分
     */
    private int calculateSignInPoints(int continuousDays) {
        int basePoints = 5;
        int bonusPoints = 0;
        
        if (continuousDays >= 30) {
            bonusPoints = 30;
        } else if (continuousDays >= 21) {
            bonusPoints = 20;
        } else if (continuousDays >= 14) {
            bonusPoints = 15;
        } else if (continuousDays >= 7) {
            bonusPoints = 10;
        }
        
        return basePoints + bonusPoints;
    }
} 