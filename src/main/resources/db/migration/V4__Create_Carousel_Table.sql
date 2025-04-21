-- 创建轮播图表
CREATE TABLE IF NOT EXISTS `t_carousel` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `image_url` varchar(255) NOT NULL COMMENT '图片URL',
  `title` varchar(100) DEFAULT NULL COMMENT '轮播图标题',
  `description` varchar(255) DEFAULT NULL COMMENT '轮播图描述',
  `link_type` varchar(20) NOT NULL DEFAULT 'page' COMMENT '链接类型：page-小程序页面，web-网页，miniprogram-其他小程序',
  `link_url` varchar(255) DEFAULT NULL COMMENT '跳转链接',
  `app_id` varchar(50) DEFAULT NULL COMMENT '小程序appId(link_type为miniprogram时必填)',
  `sort` int(11) NOT NULL DEFAULT 0 COMMENT '排序(越小越靠前)',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status_sort` (`status`, `sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='轮播图表';

-- 插入默认轮播图数据(使用INSERT IGNORE避免重复插入错误)
INSERT IGNORE INTO `t_carousel` (`image_url`, `title`, `description`, `link_type`, `link_url`, `sort`, `status`) VALUES 
('/static/images/cat_banner.png', '单词检查服务', '高效准确的英语单词纠错', 'page', '/pages/upload/upload', 1, 1),
('/static/images/banner1.jpg', '积分奖励活动', '每日签到获取积分', 'page', '/pages/points/points', 2, 1),
('/static/images/banner2.jpg', '历史记录查询', '查看你的检查记录', 'page', '/pages/result/result', 3, 1); 