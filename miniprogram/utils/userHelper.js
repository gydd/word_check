// userHelper.js - 用户头像处理工具

// 引入配置
const config = require('../config/config');

// 默认头像路径
const DEFAULT_AVATAR = config.resources.defaultAvatar;

// 缓存相关常量
const AVATAR_CACHE_PREFIX = 'avatar_cache_';
const AVATAR_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时
const DEBOUNCE_INTERVAL = 2000; // 防抖时间间隔（毫秒）

// 用于防抖的映射
const pendingValidations = new Map();

/**
 * 验证URL格式是否有效
 * @param {string} url 要验证的URL
 * @returns {boolean} 是否为有效URL
 */
function isValidUrl(url) {
  if (!url) return false;
  // 简单的URL格式验证
  return /^(http|https):\/\/[^ "]+$/.test(url) || url.startsWith('/static/');
}

/**
 * 获取头像缓存
 * @param {string} avatarUrl 头像URL
 * @returns {Object|null} 缓存对象或null（如果不存在或过期）
 */
function getAvatarCache(avatarUrl) {
  if (!avatarUrl) return null;
  
  try {
    const key = AVATAR_CACHE_PREFIX + _hashUrl(avatarUrl);
    const cacheStr = wx.getStorageSync(key);
    
    if (!cacheStr) return null;
    
    const cache = JSON.parse(cacheStr);
    
    // 检查缓存是否过期
    if (cache.expiry && Date.now() > cache.expiry) {
      // 过期了，删除缓存
      wx.removeStorageSync(key);
      return null;
    }
    
    return cache;
  } catch (err) {
    console.error('获取头像缓存出错:', err);
    return null;
  }
}

/**
 * 设置头像缓存
 * @param {string} avatarUrl 原始头像URL
 * @param {string} validatedUrl 验证后的头像URL
 * @param {boolean} isValid 头像是否有效
 */
function setAvatarCache(avatarUrl, validatedUrl, isValid) {
  if (!avatarUrl) return;
  
  try {
    const key = AVATAR_CACHE_PREFIX + _hashUrl(avatarUrl);
    const cache = {
      originalUrl: avatarUrl,
      validatedUrl: validatedUrl || DEFAULT_AVATAR,
      isValid: !!isValid,
      timestamp: Date.now(),
      expiry: Date.now() + AVATAR_CACHE_DURATION
    };
    
    wx.setStorageSync(key, JSON.stringify(cache));
  } catch (err) {
    console.error('设置头像缓存出错:', err);
  }
}

/**
 * 清理所有过期的头像缓存
 */
function cleanExpiredAvatarCache() {
  try {
    const now = Date.now();
    const keys = wx.getStorageInfoSync().keys;
    
    keys.forEach(key => {
      if (key.startsWith(AVATAR_CACHE_PREFIX)) {
        const cacheStr = wx.getStorageSync(key);
        if (cacheStr) {
          try {
            const cache = JSON.parse(cacheStr);
            if (cache.expiry && now > cache.expiry) {
              wx.removeStorageSync(key);
            }
          } catch (e) {
            // 缓存数据无效，直接删除
            wx.removeStorageSync(key);
          }
        }
      }
    });
  } catch (err) {
    console.error('清理过期头像缓存出错:', err);
  }
}

/**
 * 清除特定头像的缓存
 * @param {string} avatarUrl 头像URL
 */
function clearAvatarCache(avatarUrl) {
  if (!avatarUrl) return;
  
  try {
    const key = AVATAR_CACHE_PREFIX + _hashUrl(avatarUrl);
    wx.removeStorageSync(key);
  } catch (err) {
    console.error('清除头像缓存出错:', err);
  }
}

/**
 * 清除所有头像缓存
 */
function clearAllAvatarCache() {
  try {
    const keys = wx.getStorageInfoSync().keys;
    
    keys.forEach(key => {
      if (key.startsWith(AVATAR_CACHE_PREFIX)) {
        wx.removeStorageSync(key);
      }
    });
  } catch (err) {
    console.error('清除所有头像缓存出错:', err);
  }
}

/**
 * 简单的URL哈希函数，用于缓存键
 * @param {string} url 要哈希的URL
 * @returns {string} 哈希结果
 * @private
 */
function _hashUrl(url) {
  if (!url) return '';
  
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  return hash.toString(16); // 转换为16进制字符串
}

/**
 * 同步验证和修复用户头像
 * @param {Object} userInfo 用户信息对象
 * @returns {Object} 修复后的用户信息对象
 */
function validateUserAvatar(userInfo) {
  if (!userInfo) return null;

  const clonedUserInfo = {...userInfo};
  
  // 检查是否有头像
  if (!clonedUserInfo.avatarUrl) {
    clonedUserInfo.avatarUrl = DEFAULT_AVATAR;
    return clonedUserInfo;
  }
  
  // 检查缓存
  const cache = getAvatarCache(clonedUserInfo.avatarUrl);
  if (cache) {
    // 使用缓存的验证结果
    clonedUserInfo.avatarUrl = cache.isValid ? cache.originalUrl : cache.validatedUrl;
    return clonedUserInfo;
  }
  
  // 本地路径无需验证
  if (clonedUserInfo.avatarUrl.startsWith('/static/')) {
    return clonedUserInfo;
  }
  
  // 简单验证URL格式
  if (!isValidUrl(clonedUserInfo.avatarUrl)) {
    clonedUserInfo.avatarUrl = DEFAULT_AVATAR;
    // 记录无效URL到缓存
    setAvatarCache(userInfo.avatarUrl, DEFAULT_AVATAR, false);
  }
  
  return clonedUserInfo;
}

/**
 * 异步验证头像URL
 * @param {string} avatarUrl 要验证的头像URL
 * @returns {Promise<string>} 返回有效的头像URL或默认头像
 */
function validateAvatarAsync(avatarUrl) {
  return new Promise((resolve, reject) => {
    if (!avatarUrl) {
      resolve(DEFAULT_AVATAR);
      return;
    }
    
    // 检查是否是本地路径
    if (avatarUrl.startsWith('/static/')) {
      resolve(avatarUrl);
      return;
    }
    
    // 检查缓存
    const cache = getAvatarCache(avatarUrl);
    if (cache) {
      resolve(cache.isValid ? cache.originalUrl : cache.validatedUrl);
      return;
    }
    
    // 检查是否有正在进行的验证
    if (pendingValidations.has(avatarUrl)) {
      const existing = pendingValidations.get(avatarUrl);
      
      // 复用现有验证
      existing.promises.push({ resolve, reject });
      return;
    }
    
    // 创建新的验证
    const validation = {
      url: avatarUrl,
      promises: [{ resolve, reject }],
      timer: setTimeout(() => {
        // 验证超时，从映射中移除
        pendingValidations.delete(avatarUrl);
      }, DEBOUNCE_INTERVAL)
    };
    
    pendingValidations.set(avatarUrl, validation);
    
    // 执行实际验证
    _performAvatarValidation(avatarUrl);
  });
}

/**
 * 执行实际的头像验证
 * @param {string} avatarUrl 要验证的头像URL
 * @private
 */
function _performAvatarValidation(avatarUrl) {
  // 下载图片验证可访问性
  wx.downloadFile({
    url: avatarUrl,
    success: res => {
      const validation = pendingValidations.get(avatarUrl);
      if (!validation) return;
      
      const statusCode = res.statusCode;
      const tempFilePath = res.tempFilePath;
      
      clearTimeout(validation.timer);
      
      const isValid = statusCode === 200 && tempFilePath;
      const resultUrl = isValid ? avatarUrl : DEFAULT_AVATAR;
      
      // 设置缓存
      setAvatarCache(avatarUrl, resultUrl, isValid);
      
      // 解决所有等待的Promise
      validation.promises.forEach(p => p.resolve(resultUrl));
      
      // 从映射中移除
      pendingValidations.delete(avatarUrl);
    },
    fail: err => {
      const validation = pendingValidations.get(avatarUrl);
      if (!validation) return;
      
      clearTimeout(validation.timer);
      
      console.warn('头像验证失败:', avatarUrl, err);
      
      // 设置为无效
      setAvatarCache(avatarUrl, DEFAULT_AVATAR, false);
      
      // 解决所有等待的Promise
      validation.promises.forEach(p => p.resolve(DEFAULT_AVATAR));
      
      // 从映射中移除
      pendingValidations.delete(avatarUrl);
    }
  });
}

/**
 * 处理头像加载错误
 * @param {Object} userInfo 用户信息对象
 * @param {Function} callback 回调函数，接收修复后的用户信息
 * @returns {Object} 修复后的用户信息对象
 */
function handleAvatarError(userInfo, callback) {
  if (!userInfo) return null;
  
  const updatedUserInfo = {...userInfo};
  
  // 标记头像为无效
  if (updatedUserInfo.avatarUrl && updatedUserInfo.avatarUrl !== DEFAULT_AVATAR) {
    setAvatarCache(updatedUserInfo.avatarUrl, DEFAULT_AVATAR, false);
  }
  
  // 设置为默认头像
  updatedUserInfo.avatarUrl = DEFAULT_AVATAR;
  
  // 如果提供了回调，执行回调
  if (typeof callback === 'function') {
    callback(updatedUserInfo);
  }
  
  return updatedUserInfo;
}

/**
 * 预加载头像
 * @param {string} avatarUrl 头像URL
 * @returns {Promise<string>} 返回有效的头像URL或默认头像
 */
function preloadAvatar(avatarUrl) {
  if (!avatarUrl) return Promise.resolve(DEFAULT_AVATAR);
  
  // 检查是否本地路径
  if (avatarUrl.startsWith('/static/')) {
    return Promise.resolve(avatarUrl);
  }
  
  // 检查缓存
  const cache = getAvatarCache(avatarUrl);
  if (cache) {
    return Promise.resolve(cache.isValid ? cache.originalUrl : cache.validatedUrl);
  }
  
  // 异步验证
  return validateAvatarAsync(avatarUrl);
}

// 初始时清理过期缓存
cleanExpiredAvatarCache();

module.exports = {
  DEFAULT_AVATAR,
  validateUserAvatar,
  validateAvatarAsync,
  handleAvatarError,
  preloadAvatar,
  getAvatarCache,
  setAvatarCache,
  clearAvatarCache,
  clearAllAvatarCache,
  cleanExpiredAvatarCache,
  isValidUrl
}; 