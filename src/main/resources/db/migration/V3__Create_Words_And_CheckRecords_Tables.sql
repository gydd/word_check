-- 创建单词库表
CREATE TABLE IF NOT EXISTS words (
    id INT AUTO_INCREMENT PRIMARY KEY,
    word VARCHAR(100) NOT NULL,
    meaning TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    difficulty VARCHAR(50) DEFAULT 'medium',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_word (word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单词库表';

-- 创建单词检查记录表
CREATE TABLE IF NOT EXISTS word_check_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    word VARCHAR(100) NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    has_reward BOOLEAN NOT NULL DEFAULT FALSE,
    reward_points INT DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_created (user_id, created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='单词检查记录表';

-- 添加一些示例单词
INSERT INTO words (word, meaning, category, difficulty) VALUES
('apple', '苹果', 'fruit', 'easy'),
('banana', '香蕉', 'fruit', 'easy'),
('accommodate', '容纳；提供住宿', 'common', 'hard'),
('receive', '收到；接收', 'common', 'medium'),
('necessary', '必要的；必需的', 'common', 'medium'),
('computer', '计算机', 'technology', 'easy'),
('smartphone', '智能手机', 'technology', 'easy'),
('algorithm', '算法', 'technology', 'hard'); 