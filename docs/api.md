# 单词检查小程序 API 接口文档

## 通用说明

- 基础URL: `http://your-server-address/api`
- 请求格式: JSON
- 认证方式: Bearer Token (JWT)
- 请求头:
  ```
  Authorization: Bearer {token}
  Content-Type: application/json
  ```
- 响应格式:
  ```json
  {
    "error": 0,  // 0表示成功，其他值表示错误
    "body": {},  // 响应数据
    "message": "" // 提示信息
  }
  ```

## 1. 用户接口

### 1.1 微信登录
- **URL**: `/user/login`
- **方法**: POST
- **请求参数**:
  ```json
  {
    "code": "微信登录code"
  }
  ```
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "token": "jwt_token_here",
      "userInfo": {
        "id": 1,
        "phone": "13800138000",
        "nickname": "用户昵称",
        "avatarUrl": "头像地址",
        "hasPhone": true
      }
    },
    "message": "登录成功"
  }
  ```

### 1.2 获取用户信息
- **URL**: `/user/info`
- **方法**: GET
- **请求参数**: 无
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "id": 1,
      "phone": "13800138000",
      "nickname": "用户昵称",
      "avatarUrl": "头像地址",
      "gender": 1,
      "points": 100
    },
    "message": ""
  }
  ```

### 1.3 更新用户信息
- **URL**: `/user/update`
- **方法**: POST
- **请求参数**:
  ```json
  {
    "nickname": "新昵称",
    "avatarUrl": "新头像地址",
    "gender": 1
  }
  ```
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "id": 1,
      "phone": "13800138000",
      "nickname": "新昵称",
      "avatarUrl": "新头像地址",
      "gender": 1
    },
    "message": "更新成功"
  }
  ```

### 1.4 绑定手机号
- **URL**: `/user/bind-phone`
- **方法**: POST
- **请求参数**:
  ```json
  {
    "phone": "13800138000"
  }
  ```
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "id": 1,
      "phone": "13800138000",
      "nickname": "用户昵称",
      "avatarUrl": "头像地址"
    },
    "message": "绑定成功"
  }
  ```

## 2. 单词检查接口

### 2.1 检查单词拼写
- **URL**: `/word-check/check`
- **方法**: POST
- **请求参数**:
  ```json
  {
    "word": "apple"
  }
  ```
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "correct": true,
      "standardWord": "apple",
      "meaning": "苹果",
      "message": "拼写正确",
      "points": 5
    },
    "message": ""
  }
  ```

### 2.2 获取单词检查记录
- **URL**: `/word-check/records`
- **方法**: GET
- **请求参数**:
  ```
  ?page=1&pageSize=10
  ```
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "total": 50,
      "list": [
        {
          "id": 1,
          "word": "apple",
          "is_correct": true,
          "created_at": "2023-05-10T08:30:00Z"
        }
      ],
      "page": 1,
      "pageSize": 10,
      "totalPages": 5
    },
    "message": ""
  }
  ```

### 2.3 获取单词检查统计
- **URL**: `/word-check/statistics`
- **方法**: GET
- **请求参数**: 无
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "totalChecks": 100,
      "correctChecks": 80,
      "accuracy": 80.00,
      "todayChecks": 10,
      "todayCorrectChecks": 8,
      "todayAccuracy": 80.00,
      "recentChecks": []
    },
    "message": ""
  }
  ```

### 2.4 获取单词建议
- **URL**: `/word-check/suggestions`
- **方法**: GET
- **请求参数**: 
  ```
  ?word=app
  ```
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": ["apple", "application", "append", "approach"],
    "message": ""
  }
  ```

## 3. 积分系统接口

### 3.1 获取用户积分
- **URL**: `/points`
- **方法**: GET
- **请求参数**: 无
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "userId": 1,
      "currentPoints": 100,
      "totalEarned": 150,
      "totalSpent": 50,
      "level": 2,
      "levelName": "中级会员",
      "nextLevelPoints": 500,
      "lastUpdated": "2023-05-10T08:30:00Z"
    },
    "message": ""
  }
  ```

### 3.2 获取积分记录
- **URL**: `/points/records`
- **方法**: GET
- **请求参数**:
  ```
  ?page=1&pageSize=10&type=signin&action=add
  ```
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "total": 30,
      "page": 1,
      "pageSize": 10,
      "totalPages": 3,
      "records": [
        {
          "id": 1,
          "userId": 1,
          "points": 5,
          "reason": "签到奖励",
          "type": "signin",
          "action": "add",
          "businessId": null,
          "businessType": null,
          "remark": "",
          "createdAt": "2023-05-10T08:30:00Z"
        }
      ]
    },
    "message": ""
  }
  ```

### 3.3 积分兑换
- **URL**: `/points/exchange`
- **方法**: POST
- **请求参数**:
  ```json
  {
    "amount": 10,
    "count": 1
  }
  ```
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "points": 90,
      "availableEssays": 1,
      "exchanged": 1
    },
    "message": "兑换成功"
  }
  ```

## 4. 签到系统接口

### 4.1 用户签到
- **URL**: `/signin`
- **方法**: POST
- **请求参数**: 无
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "success": true,
      "data": {
        "id": 1,
        "continuousDays": 3,
        "points": 5,
        "signDate": "2023-05-10"
      },
      "message": "签到成功"
    },
    "message": ""
  }
  ```

### 4.2 获取签到记录
- **URL**: `/signin/records`
- **方法**: GET
- **请求参数**:
  ```
  ?page=1&pageSize=10
  ```
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "total": 30,
      "list": [
        {
          "id": 1,
          "sign_date": "2023-05-10",
          "continuous_days": 3,
          "points": 5
        }
      ],
      "page": 1,
      "pageSize": 10,
      "totalPages": 3
    },
    "message": ""
  }
  ```

### 4.3 获取月度签到情况
- **URL**: `/signin/monthly`
- **方法**: GET
- **请求参数**: 无
- **响应示例**:
  ```json
  {
    "error": 0,
    "body": {
      "year": 2023,
      "month": 5,
      "signInDays": [
        { "date": "2023-05-01", "points": 5 },
        { "date": "2023-05-02", "points": 5 },
        { "date": "2023-05-03", "points": 5 }
      ],
      "totalDays": 3,
      "currentStreak": 3
    },
    "message": ""
  }
  ```

## 5. 错误码说明

- 0: 成功
- 400: 参数错误
- 401: 未授权(需要登录)
- 403: 权限不足
- 404: 资源不存在
- 409: 资源冲突
- 500: 服务器内部错误

## 6. 开发环境与测试

- 开发环境API地址: `http://127.0.0.1:8080`
- 测试环境API地址: `http://127.0.0.1:8080`
- 生产环境API地址: `http://127.0.0.1:8080`

请确保在请求时设置正确的Content-Type和Authorization头信息。 