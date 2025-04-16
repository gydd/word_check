/**
 * 常用工具函数
 */

/**
 * 格式化时间
 * @param {Date} date 日期对象
 * @param {String} format 格式字符串，如 'YYYY-MM-DD HH:mm:ss'
 * @return {String} 格式化后的时间字符串
 */
const formatTime = (date, format = 'YYYY-MM-DD HH:mm:ss') => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  let result = format
    .replace('YYYY', year)
    .replace('MM', formatNumber(month))
    .replace('DD', formatNumber(day))
    .replace('HH', formatNumber(hour))
    .replace('mm', formatNumber(minute))
    .replace('ss', formatNumber(second))

  return result
}

/**
 * 数字补零
 * @param {Number} n 数字
 * @return {String} 补零后的字符串
 */
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/**
 * 格式化文件大小
 * @param {Number} size 文件大小（字节）
 * @return {String} 格式化后的文件大小
 */
const formatFileSize = (size) => {
  if (size < 1024) {
    return size + 'B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + 'KB'
  } else if (size < 1024 * 1024 * 1024) {
    return (size / (1024 * 1024)).toFixed(2) + 'MB'
  } else {
    return (size / (1024 * 1024 * 1024)).toFixed(2) + 'GB'
  }
}

/**
 * 获取文件扩展名
 * @param {String} fileName 文件名
 * @return {String} 文件扩展名
 */
const getFileExtension = (fileName) => {
  return fileName.substring(fileName.lastIndexOf('.') + 1)
}

/**
 * 对象深拷贝
 * @param {Object} obj 要拷贝的对象
 * @return {Object} 拷贝后的新对象
 */
const deepClone = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj
  }
  
  const result = Array.isArray(obj) ? [] : {}
  
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = deepClone(obj[key])
    }
  }
  
  return result
}

/**
 * 节流函数
 * @param {Function} fn 要执行的函数
 * @param {Number} delay 延迟时间（毫秒）
 * @return {Function} 节流后的函数
 */
const throttle = (fn, delay) => {
  let timer = null
  let lastTime = 0
  
  return function(...args) {
    const now = Date.now()
    const remaining = delay - (now - lastTime)
    
    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      
      lastTime = now
      fn.apply(this, args)
    } else if (!timer) {
      timer = setTimeout(() => {
        lastTime = Date.now()
        timer = null
        fn.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * 防抖函数
 * @param {Function} fn 要执行的函数
 * @param {Number} delay 延迟时间（毫秒）
 * @return {Function} 防抖后的函数
 */
const debounce = (fn, delay) => {
  let timer = null
  
  return function(...args) {
    if (timer) {
      clearTimeout(timer)
    }
    
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

module.exports = {
  formatTime,
  formatNumber,
  formatFileSize,
  getFileExtension,
  deepClone,
  throttle,
  debounce
} 