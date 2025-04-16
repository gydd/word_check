# API 文档

## 概述

本项目采用 RESTful API 设计规范，使用 Java + Spring Boot 框架实现后端服务。API 基础路径为 `/api/v1`。

## 通用响应格式

所有 API 返回统一的 JSON 格式：

```json
{
  "code": 200,           // 状态码：200成功，400请求错误，401未授权，403禁止访问，500服务器错误
  "message": "success",  // 状态描述
  "data": {}             // 响应数据
}
```

## 错误处理

当发生错误时，响应格式如下：

```json
{
  "code": 400,                   // 错误状态码
  "message": "参数错误",          // 错误描述
  "data": null                   // 无数据返回
}
```

## 身份认证

大部分 API 需要进行身份认证，通过 HTTP 请求头中的 `Authorization` 字段传递 JWT 令牌：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

未提供有效令牌的请求将返回 401 状态码。

## API 清单

### 1. 用户模块

#### 1.1 微信登录

**请求**

- 方法: `POST`
- 路径: `/api/v1/auth/wx-login`
- 参数: 
  ```json
  {
    "code": "wx_auth_code"  // 微信授权码
  }
  ```

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userInfo": {
      "id": 1,
      "openid": "wx_openid",
      "nickname": "用户昵称",
      "avatarUrl": "头像URL",
      "gender": 1,
      "points": 100,
      "level": 1,
      "levelName": "初学者"
    }
  }
}
```

#### 1.2 获取用户信息

**请求**

- 方法: `GET`
- 路径: `/api/v1/user/info`
- 需要认证: 是

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "openid": "wx_openid",
    "nickname": "用户昵称",
    "avatarUrl": "头像URL",
    "gender": 1,
    "points": 100,
    "level": 1,
    "levelName": "初学者",
    "nextLevelPoints": 200,
    "checkCount": 50,
    "correctCount": 40,
    "accuracy": "80%"
  }
}
```

#### 1.3 更新用户信息

**请求**

- 方法: `PUT`
- 路径: `/api/v1/user/info`
- 需要认证: 是
- 参数:
  ```json
  {
    "nickname": "新昵称",
    "avatarUrl": "新头像URL",
    "gender": 1
  }
  ```

**响应**

```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": 1,
    "nickname": "新昵称",
    "avatarUrl": "新头像URL",
    "gender": 1
  }
}
```

### 2. 积分模块

#### 2.1 获取用户积分

**请求**

- 方法: `GET`
- 路径: `/api/v1/points`
- 需要认证: 是

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "currentPoints": 100,
    "totalEarned": 150,
    "totalSpent": 50,
    "level": 1,
    "levelName": "初学者",
    "nextLevelPoints": 200
  }
}
```

#### 2.2 获取积分记录

**请求**

- 方法: `GET`
- 路径: `/api/v1/points/records`
- 需要认证: 是
- 查询参数:
  - `page`: 页码，默认1
  - `pageSize`: 每页数量，默认10
  - `type`: 类型筛选，可选值：all, earn, spend，默认all

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 25,
    "pageSize": 10,
    "currentPage": 1,
    "totalPages": 3,
    "records": [
      {
        "id": 1,
        "points": 10,
        "reason": "每日签到",
        "type": "sign_in",
        "action": "add",
        "beforePoints": 90,
        "afterPoints": 100,
        "createdAt": "2023-06-01 08:00:00"
      },
      // ...更多记录
    ]
  }
}
```

### 3. 签到模块

#### 3.1 签到

**请求**

- 方法: `POST`
- 路径: `/api/v1/sign-in`
- 需要认证: 是

**响应**

```json
{
  "code": 200,
  "message": "签到成功",
  "data": {
    "points": 10,                 // 获得积分
    "continuousDays": 3,          // 连续签到天数
    "signDate": "2023-06-01",     // 签到日期
    "currentPoints": 100,         // 当前总积分
    "totalSignDays": 20           // 累计签到天数
  }
}
```

#### 3.2 获取签到状态

**请求**

- 方法: `GET`
- 路径: `/api/v1/sign-in/status`
- 需要认证: 是

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "todaySigned": true,          // 今日是否已签到
    "continuousDays": 3,          // 连续签到天数
    "totalSignDays": 20,          // 累计签到天数
    "thisWeekSigned": [           // 本周签到情况，数组索引0为周一
      true, true, true, false, false, false, false
    ],
    "thisMonthSigned": [          // 本月签到情况，数组索引0为1号
      true, true, true, ... 
    ]
  }
}
```

### 4. 单词检查模块

#### 4.1 检查单词拼写

**请求**

- 方法: `POST`
- 路径: `/api/v1/word-check`
- 需要认证: 是
- 参数:
  ```json
  {
    "word": "apple"  // 待检查的单词
  }
  ```

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "word": "apple",
    "isCorrect": true,           // 拼写是否正确
    "correctWord": "apple",      // 正确拼写（如果错误则返回正确单词）
    "rewarded": true,            // 是否奖励积分
    "rewardPoints": 2,           // 奖励积分数量
    "currentPoints": 102,        // 当前总积分
    "suggestions": []            // 如果拼写错误，返回建议单词列表
  }
}
```

如果拼写错误：

```json
{
  "code": 200,
  "message": "拼写错误",
  "data": {
    "word": "appel",
    "isCorrect": false,
    "correctWord": "apple",
    "rewarded": false,
    "rewardPoints": 0,
    "currentPoints": 100,
    "suggestions": ["apple", "appeal", "append"]
  }
}
```

#### 4.2 获取检查历史

**请求**

- 方法: `GET`
- 路径: `/api/v1/word-check/history`
- 需要认证: 是
- 查询参数:
  - `page`: 页码，默认1
  - `pageSize`: 每页数量，默认10
  - `isCorrect`: 筛选类型，可选值：all, correct, incorrect，默认all

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "total": 35,
    "pageSize": 10,
    "currentPage": 1,
    "totalPages": 4,
    "records": [
      {
        "id": 1,
        "word": "apple",
        "isCorrect": true,
        "rewarded": true,
        "rewardPoints": 2,
        "checkTime": "2023-06-01 10:15:30"
      },
      // ...更多记录
    ]
  }
}
```

#### 4.3 获取检查统计

**请求**

- 方法: `GET`
- 路径: `/api/v1/word-check/stats`
- 需要认证: 是

**响应**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "totalChecks": 86,          // 总检查次数
    "correctChecks": 70,        // 正确次数
    "accuracy": "81.4%",        // 正确率
    "todayChecks": 12,          // 今日检查次数
    "todayCorrect": 10,         // 今日正确次数
    "todayAccuracy": "83.3%",   // 今日正确率
    "weeklyStats": [            // 近7天每日统计，数组索引0为今天
      {"date": "06-01", "checks": 12, "correct": 10},
      {"date": "05-31", "checks": 15, "correct": 12},
      // ...更多数据
    ],
    "mostCheckedWords": [       // 最常检查的单词
      {"word": "apple", "count": 5},
      {"word": "banana", "count": 4},
      // ...更多数据
    ],
    "mostIncorrectWords": [     // 最常拼错的单词
      {"word": "receive", "count": 3},
      {"word": "accommodate", "count": 2},
      // ...更多数据
    ]
  }
}
```

### 5. 管理员接口

> 注意：以下接口需要管理员权限

#### 5.1 添加单词库

**请求**

- 方法: `POST`
- 路径: `/api/v1/admin/words`
- 需要认证: 是（管理员）
- 参数:
  ```json
  {
    "word": "accommodate",
    "meaning": "容纳；提供住宿",
    "category": "common",
    "difficulty": "hard"
  }
  ```

**响应**

```json
{
  "code": 200,
  "message": "添加成功",
  "data": {
    "id": 123,
    "word": "accommodate",
    "meaning": "容纳；提供住宿",
    "category": "common",
    "difficulty": "hard"
  }
}
```

#### 5.2 导入单词库

**请求**

- 方法: `POST`
- 路径: `/api/v1/admin/words/import`
- 需要认证: 是（管理员）
- 内容类型: `multipart/form-data`
- 参数: 
  - `file`: 包含单词的CSV文件

**响应**

```json
{
  "code": 200,
  "message": "导入成功",
  "data": {
    "totalImported": 100,
    "successCount": 98,
    "failedCount": 2,
    "failedWords": ["already-exist-1", "already-exist-2"]
  }
}
```

## 后端实现示例

以下是一个使用Spring Boot实现的API示例（以用户积分查询为例）：

### Controller层实现

```java
package com.wordcheck.controller;

import com.wordcheck.common.ApiResponse;
import com.wordcheck.model.dto.PointsDTO;
import com.wordcheck.model.dto.PointsRecordDTO;
import com.wordcheck.service.PointService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/points")
@Api(tags = "用户积分接口")
public class PointController {

    @Autowired
    private PointService pointService;

    @GetMapping("")
    @ApiOperation("获取用户积分")
    public ApiResponse<PointsDTO> getUserPoints(HttpServletRequest request) {
        Integer userId = (Integer) request.getAttribute("userId");
        PointsDTO pointsInfo = pointService.getUserPoints(userId);
        return ApiResponse.success(pointsInfo);
    }

    @GetMapping("/records")
    @ApiOperation("获取积分记录")
    public ApiResponse<PointsRecordDTO> getPointsRecords(
            HttpServletRequest request,
            @ApiParam("页码") @RequestParam(defaultValue = "1") int page,
            @ApiParam("每页记录数") @RequestParam(defaultValue = "10") int pageSize,
            @ApiParam("类型:all,earn,spend") @RequestParam(defaultValue = "all") String type
    ) {
        Integer userId = (Integer) request.getAttribute("userId");
        
        // 验证参数
        if (page < 1) {
            return ApiResponse.error(400, "页码必须大于0");
        }
        
        if (pageSize < 1 || pageSize > 100) {
            return ApiResponse.error(400, "每页记录数必须在1-100之间");
        }
        
        PointsRecordDTO records = pointService.getPointsRecords(userId, page, pageSize, type);
        return ApiResponse.success(records);
    }
}
```

### Service层实现

```java
package com.wordcheck.service.impl;

import com.wordcheck.mapper.PointRecordMapper;
import com.wordcheck.mapper.UserPointMapper;
import com.wordcheck.model.PointRecord;
import com.wordcheck.model.UserPoint;
import com.wordcheck.model.dto.PointsDTO;
import com.wordcheck.model.dto.PointsRecordDTO;
import com.wordcheck.service.PointService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PointServiceImpl implements PointService {

    @Autowired
    private UserPointMapper userPointMapper;
    
    @Autowired
    private PointRecordMapper pointRecordMapper;

    @Override
    public PointsDTO getUserPoints(Integer userId) {
        UserPoint userPoint = userPointMapper.findByUserId(userId);
        
        // 如果用户积分记录不存在，创建一个
        if (userPoint == null) {
            userPoint = new UserPoint();
            userPoint.setUserId(userId);
            userPoint.setCurrentPoints(0);
            userPoint.setTotalEarned(0);
            userPoint.setTotalSpent(0);
            userPoint.setLevel(1);
            userPoint.setLevelName("初学者");
            userPoint.setNextLevelPoints(200);
            userPointMapper.insert(userPoint);
        }
        
        PointsDTO dto = new PointsDTO();
        dto.setCurrentPoints(userPoint.getCurrentPoints());
        dto.setTotalEarned(userPoint.getTotalEarned());
        dto.setTotalSpent(userPoint.getTotalSpent());
        dto.setLevel(userPoint.getLevel());
        dto.setLevelName(userPoint.getLevelName());
        dto.setNextLevelPoints(userPoint.getNextLevelPoints());
        
        return dto;
    }

    @Override
    public PointsRecordDTO getPointsRecords(Integer userId, int page, int pageSize, String type) {
        // 计算分页参数
        int offset = (page - 1) * pageSize;
        
        // 查询总记录数
        int total = pointRecordMapper.countByUserIdAndType(userId, type);
        
        // 查询记录列表
        List<PointRecord> records = pointRecordMapper.findByUserIdAndType(userId, type, offset, pageSize);
        
        // 构建返回对象
        PointsRecordDTO dto = new PointsRecordDTO();
        dto.setTotal(total);
        dto.setPageSize(pageSize);
        dto.setCurrentPage(page);
        dto.setTotalPages((int) Math.ceil((double) total / pageSize));
        dto.setRecords(records);
        
        return dto;
    }
}
```

### 通用响应类

```java
package com.wordcheck.common;

import lombok.Data;

@Data
public class ApiResponse<T> {
    private int code;
    private String message;
    private T data;
    
    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(200);
        response.setMessage("success");
        response.setData(data);
        return response;
    }
    
    public static <T> ApiResponse<T> success(String message, T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(200);
        response.setMessage(message);
        response.setData(data);
        return response;
    }
    
    public static <T> ApiResponse<T> error(int code, String message) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(code);
        response.setMessage(message);
        response.setData(null);
        return response;
    }
}
``` 