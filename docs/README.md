# 单词检查小程序后端文档

## 项目介绍

单词检查小程序是一款帮助用户练习和检查英语单词拼写的应用。用户可以通过该应用练习单词拼写，获取即时反馈，累计积分，并兑换相应的奖励。

### 主要功能

- 用户系统：支持微信小程序登录，用户信息管理
- 单词检查：支持单词拼写检查，提供拼写建议
- 积分系统：记录用户获取和消费的积分，支持积分兑换功能
- 签到系统：支持用户每日签到，连续签到获得额外奖励

## 项目架构

本项目采用Node.js + Express + Sequelize + MySQL开发，主要结构如下：

```
word_check/
├── src/                 # 源代码目录
│   ├── config/          # 配置文件
│   ├── controllers/     # 控制器
│   ├── middlewares/     # 中间件
│   ├── models/          # 数据模型
│   ├── routes/          # 路由定义
│   ├── services/        # 业务逻辑服务
│   └── utils/           # 工具函数
├── docs/                # 文档目录
│   ├── api.md           # API接口文档
│   └── README.md        # 项目说明文档
├── public/              # 静态资源
├── uploads/             # 上传文件目录
├── app.js               # 应用入口
└── package.json         # 项目依赖配置
```

## 环境要求

- Node.js (>=12.0.0)
- MySQL (>=5.7)
- 微信小程序开发者工具

## 安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件并配置以下环境变量：

```
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=word_check
DB_PORT=3306
DB_DIALECT=mysql

# JWT配置
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# 微信小程序配置
WX_APPID=your_appid
WX_SECRET=your_secret
```

### 3. 初始化数据库

```bash
# 如果使用Sequelize CLI
npx sequelize-cli db:migrate

# 或者使用自定义脚本
npm run migrate
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## API文档

详细API接口文档请参考 [API文档](./api.md)。

## 开发指南

### 数据库模型

项目使用Sequelize ORM框架管理数据库模型，主要包括：

- User: 用户信息
- UserPoint: 用户积分
- PointRecord: 积分记录
- SignIn: 签到记录
- Word: 单词库
- WordCheckRecord: 单词检查记录

### 代码规范

- 使用ES6+语法
- 遵循RESTful API设计原则
- 控制器负责处理请求和响应
- 服务层处理业务逻辑
- 模型层定义数据结构和关联

## 部署说明

### 开发环境

开发环境使用nodemon实现热重载：

```bash
npm run dev
```

### 生产环境

生产环境可使用PM2进行进程管理：

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start app.js --name word-check

# 查看日志
pm2 logs word-check

# 监控应用
pm2 monit
```

## 常见问题

### 数据库连接问题

- 检查数据库服务是否启动
- 确认.env文件中的数据库配置是否正确
- 确认数据库用户权限是否足够

### 微信登录问题

- 确认appid和secret是否正确配置
- 检查小程序是否已经发布或处于开发模式
- 检查服务器域名是否已在微信小程序后台配置

## 参与贡献

欢迎贡献代码或提出建议，请遵循以下流程：

1. Fork本仓库
2. 创建新分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -m 'Add some feature'`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 创建Pull Request

## 许可证

本项目采用 MIT 许可证。 