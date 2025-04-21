/**
 * 获取存储的token
 * @returns {String|null} 用户token或null
 */
export function getToken() {
  return wx.getStorageSync('token') || null;
}

/**
 * 保存token到本地存储
 * @param {String} token - 要保存的token
 */
export function saveToken(token) {
  if (token) {
    wx.setStorageSync('token', token);
  }
}

/**
 * 清除token
 */
export function clearToken() {
  wx.removeStorageSync('token');
}

/**
 * 检查用户是否已登录
 * @returns {Boolean} 是否已登录
 */
export function isLoggedIn() {
  return !!getToken();
}

/**
 * 跳转到登录页面，并保存当前页面路径
 */
export function redirectToLogin() {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  
  // 保存当前页面路径，用于登录后返回
  if (currentPage) {
    const currentPath = `/${currentPage.route}`;
    wx.setStorageSync('redirectPath', currentPath);
  }
  
  wx.navigateTo({
    url: '/pages/login/login'
  });
}

/**
 * 登录后返回到之前的页面
 */
export function redirectBack() {
  const redirectPath = wx.getStorageSync('redirectPath');
  
  if (redirectPath) {
    wx.reLaunch({
      url: redirectPath
    });
    wx.removeStorageSync('redirectPath');
  } else {
    wx.switchTab({
      url: '/pages/home/home'
    });
  }
} 