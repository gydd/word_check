-- 创建积分记录表
CREATE TABLE IF NOT EXISTS point_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    action ENUM('add', 'deduct') NOT NULL,
    business_id INT,
    business_type VARCHAR(50),
    remark VARCHAR(255),
    before_points INT,
    after_points INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分变动记录表';

-- 创建签到表
CREATE TABLE IF NOT EXISTS sign_in (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    continuous_days INT NOT NULL DEFAULT 1,
    points INT NOT NULL DEFAULT 0,
    sign_date DATE NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_date (user_id, sign_date),
    INDEX idx_sign_date (sign_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户签到表'; 