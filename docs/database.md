# 数据库设计文档

## 数据库概述

本项目使用MySQL数据库，通过Sequelize ORM框架进行数据库操作。主要包含用户系统、单词检查系统和积分系统三大模块。

## 数据库表结构

### 1. users（用户表）

存储用户基本信息。

| 字段名 | 类型 | 允许空值 | 默认值 | 说明 |
| ------ | ---- | -------- | ------ | ---- |
| id | INTEGER | 否 | 自增 | 用户ID，主键 |
| openid | VARCHAR(100) | 否 | 无 | 微信用户唯一标识 |
| phone | VARCHAR(20) | 是 | NULL | 手机号 |
| nickname | VARCHAR(50) | 是 | NULL | 用户昵称 |
| avatar_url | VARCHAR(255) | 是 | NULL | 头像URL |
| gender | TINYINT | 是 | 0 | 性别：0未知，1男，2女 |
| status | TINYINT | 否 | 1 | 状态：0禁用，1启用 |
| created_at | DATETIME | 否 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 否 | CURRENT_TIMESTAMP | 更新时间 |

### 2. user_points（用户积分表）

记录用户积分信息。

| 字段名 | 类型 | 允许空值 | 默认值 | 说明 |
| ------ | ---- | -------- | ------ | ---- |
| user_id | INTEGER | 否 | 无 | 用户ID，主键 |
| current_points | INTEGER | 否 | 0 | 当前可用积分 |
| total_earned | INTEGER | 否 | 0 | 历史总获取积分 |
| total_spent | INTEGER | 否 | 0 | 历史总消费积分 |
| level | INTEGER | 否 | 1 | 积分等级 |
| level_name | VARCHAR(50) | 是 | NULL | 等级名称 |
| next_level_points | INTEGER | 是 | NULL | 下一等级所需积分 |
| last_updated | DATETIME | 否 | CURRENT_TIMESTAMP | 最后更新时间 |
| created_at | DATETIME | 否 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 否 | CURRENT_TIMESTAMP | 更新时间 |

### 3. point_records（积分记录表）

记录用户积分变动历史。

| 字段名 | 类型 | 允许空值 | 默认值 | 说明 |
| ------ | ---- | -------- | ------ | ---- |
| id | INTEGER | 否 | 自增 | 记录ID，主键 |
| user_id | INTEGER | 否 | 无 | 用户ID |
| points | INTEGER | 否 | 无 | 积分变动数量 |
| reason | VARCHAR(100) | 否 | 无 | 积分变动原因 |
| type | VARCHAR(50) | 否 | 无 | 积分类型 |
| action | ENUM | 否 | 无 | 变动动作：add/deduct |
| business_id | INTEGER | 是 | NULL | 关联业务ID |
| business_type | VARCHAR(50) | 是 | NULL | 关联业务类型 |
| remark | VARCHAR(255) | 是 | NULL | 备注说明 |
| before_points | INTEGER | 是 | NULL | 变动前积分 |
| after_points | INTEGER | 是 | NULL | 变动后积分 |
| created_at | DATETIME | 否 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 否 | CURRENT_TIMESTAMP | 更新时间 |

### 4. sign_in（签到表）

记录用户签到信息。

| 字段名 | 类型 | 允许空值 | 默认值 | 说明 |
| ------ | ---- | -------- | ------ | ---- |
| id | INTEGER | 否 | 自增 | 签到ID，主键 |
| user_id | INTEGER | 否 | 无 | 用户ID |
| continuous_days | INTEGER | 否 | 1 | 连续签到天数 |
| points | INTEGER | 否 | 0 | 本次签到获得的积分 |
| sign_date | DATE | 否 | 无 | 签到日期 |
| created_at | DATETIME | 否 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 否 | CURRENT_TIMESTAMP | 更新时间 |

### 5. words（单词库表）

存储标准单词库。

| 字段名 | 类型 | 允许空值 | 默认值 | 说明 |
| ------ | ---- | -------- | ------ | ---- |
| id | INTEGER | 否 | 自增 | 单词ID，主键 |
| word | VARCHAR(100) | 否 | 无 | 单词 |
| meaning | TEXT | 否 | 无 | 单词含义 |
| category | VARCHAR(50) | 是 | 'general' | 单词分类 |
| difficulty | VARCHAR(50) | 是 | 'medium' | 难度级别 |
| created_at | DATETIME | 否 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 否 | CURRENT_TIMESTAMP | 更新时间 |

### 6. word_check_records（单词检查记录表）

记录用户单词检查历史。

| 字段名 | 类型 | 允许空值 | 默认值 | 说明 |
| ------ | ---- | -------- | ------ | ---- |
| id | INTEGER | 否 | 自增 | 记录ID，主键 |
| user_id | INTEGER | 否 | 无 | 用户ID |
| word | VARCHAR(100) | 否 | 无 | 用户输入的单词 |
| is_correct | BOOLEAN | 否 | false | 是否拼写正确 |
| has_reward | BOOLEAN | 否 | false | 是否已奖励积分 |
| created_at | DATETIME | 否 | CURRENT_TIMESTAMP | 创建时间 |
| updated_at | DATETIME | 否 | CURRENT_TIMESTAMP | 更新时间 |

## 数据库关系图

```
+---------+       +-------------+       +---------------+
|  users  |------>| user_points |------>| point_records |
+---------+       +-------------+       +---------------+
    |                   
    |                   
    v                   
+----------+       +--------------------+
| sign_in  |       | word_check_records |
+----------+       +--------------------+
                           ^
                           |
                           |
                      +---------+
                      |  words  |
                      +---------+
```

## 数据库索引

为提高查询性能，设置了以下索引：

1. users表：
   - openid: UNIQUE INDEX

2. sign_in表：
   - user_id + sign_date: UNIQUE INDEX
   - sign_date: INDEX

3. word_check_records表：
   - user_id + created_at: INDEX

4. point_records表：
   - user_id + created_at: INDEX

## 数据库关联关系

1. 用户与用户积分：一对一关系
   - users.id -> user_points.user_id

2. 用户与积分记录：一对多关系
   - users.id -> point_records.user_id

3. 用户与签到记录：一对多关系
   - users.id -> sign_in.user_id

4. 用户与单词检查记录：一对多关系
   - users.id -> word_check_records.user_id

## 数据库迁移脚本

初始化数据库结构使用Sequelize迁移脚本，位于`src/migrations`目录下。执行以下命令可创建所有表结构：

```bash
npx sequelize-cli db:migrate
```

## 数据库种子数据

初始单词库和默认配置等种子数据，位于`src/seeders`目录下。执行以下命令可导入种子数据：

```bash
npx sequelize-cli db:seed:all
``` 