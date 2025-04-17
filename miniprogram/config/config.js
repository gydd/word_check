/**
 * 小程序配置文件
 */

module.exports = {
  // API基础URL，与app.js中保持一致
  apiBaseUrl: 'http://127.0.0.1:8080',
  
  // 版本号
  version: '1.0.0',
  
  // 小程序appId
  appId: '',
  
  // 超时配置
  timeout: {
    request: 15000,  // 普通请求超时时间
    upload: 60000,   // 上传文件超时时间
    download: 60000  // 下载文件超时时间
  },
  
  // 缓存配置
  cache: {
    tokenKey: 'token',            // token存储键名
    userInfoKey: 'userInfo',      // 用户信息存储键名
    tokenExpireKey: 'tokenExpire' // token过期时间存储键名
  }
}; 