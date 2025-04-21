// history.js
const app = getApp();
import { getHistoryList, deleteHistory } from '../../api/historyApi';
import { showToast, showModal } from '../../utils/uiUtil';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    loading: true,        // 是否正在加载数据
    loadingMore: false,   // 是否正在加载更多数据
    isEmpty: false,       // 是否为空列表
    isAllLoaded: false,   // 是否已加载全部数据
    currentPage: 1,       // 当前页码
    pageSize: 10,         // 每页记录数
    totalPages: 1,        // 总页数
    historyList: [],      // 记录列表
    statusMap: {
      'SUCCESS': '成功',
      'FAILED': '失败',
      'PENDING': '处理中'
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.loadHistoryRecords();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 每次进入页面时刷新数据
    this.setData({
      currentPage: 1,
      historyList: []
    }, () => {
      this.loadHistoryRecords();
    });
  },

  /**
   * 获取历史记录
   */
  loadHistoryRecords: function(callback) {
    const { currentPage, pageSize } = this.data;
    
    this.setData({ loading: true });
    
    getHistoryList({
      page: currentPage,
      pageSize: pageSize
    }).then(res => {
      if (res.error === 0) {
        const { list, total, totalPages } = res.body;
        
        // 格式化记录数据
        const formattedRecords = list.map(record => {
          return {
            ...record,
            // 格式化时间 YYYY-MM-DD HH:MM
            createTime: this.formatDate(record.createTime),
            // 格式化状态
            statusText: this.getStatusText(record.status),
            statusClass: this.getStatusClass(record.status)
          };
        });
        
        this.setData({
          loading: false,
          historyList: formattedRecords,
          isEmpty: formattedRecords.length === 0,
          totalPages: totalPages || Math.ceil(total / pageSize),
          isAllLoaded: currentPage >= (totalPages || Math.ceil(total / pageSize))
        });
        
        if (callback && typeof callback === 'function') {
          callback();
        }
      } else {
        showToast('加载历史记录失败：' + (res.message || '未知错误'));
        this.setData({
          loading: false,
          isEmpty: true
        });
        
        if (callback && typeof callback === 'function') {
          callback();
        }
      }
    }).catch(err => {
      console.error('加载历史记录失败', err);
      showToast('加载历史记录失败，请检查网络连接');
      this.setData({
        loading: false,
        isEmpty: true
      });
      
      if (callback && typeof callback === 'function') {
        callback();
      }
    });
  },

  /**
   * 删除历史记录
   */
  deleteRecord: function(e) {
    const { id, index } = e.currentTarget.dataset;
    
    showModal({
      title: '确认删除',
      content: '确定要删除这条历史记录吗？删除后无法恢复。',
      showCancel: true
    }).then(res => {
      if (res.confirm) {
        deleteHistory(id).then(res => {
          if (res.error === 0) {
            // 从当前列表中移除已删除的记录
            const { historyList } = this.data;
            historyList.splice(index, 1);
            
            this.setData({
              historyList,
              isEmpty: historyList.length === 0
            });
            
            showToast('删除成功', 'success');
          } else {
            showToast('删除失败：' + (res.message || '未知错误'));
          }
        }).catch(err => {
          console.error('删除记录失败', err);
          showToast('删除失败，请检查网络连接');
        });
      }
    });
  },

  /**
   * 查看记录详情
   */
  viewRecordDetail: function(e) {
    const { id } = e.currentTarget.dataset;
    
    wx.navigateTo({
      url: `/miniprogram/pages/result/result?id=${id}&from=history`
    });
  },

  /**
   * 发起新检测
   */
  navigateToCheck: function() {
    wx.switchTab({
      url: '/miniprogram/pages/home/home'
    });
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh: function() {
    this.setData({
      currentPage: 1,
      historyList: [],
      isAllLoaded: false
    }, () => {
      this.loadHistoryRecords(() => {
        wx.stopPullDownRefresh();
      });
    });
  },

  /**
   * 上拉加载更多
   */
  onReachBottom: function() {
    if (!this.data.isAllLoaded && !this.data.loadingMore) {
      this.loadMoreRecords();
    }
  },

  /**
   * 加载更多记录
   */
  loadMoreRecords: function() {
    if (this.data.loadingMore || this.data.isAllLoaded) return;
    
    const { currentPage, pageSize, historyList } = this.data;
    const nextPage = currentPage + 1;
    
    this.setData({ loadingMore: true });
    
    getHistoryList({
      page: nextPage,
      pageSize: pageSize
    }).then(res => {
      if (res.error === 0) {
        const { list: newRecords, total, totalPages } = res.body;
        
        // 格式化记录数据
        const formattedRecords = newRecords.map(record => {
          return {
            ...record,
            // 格式化时间 YYYY-MM-DD HH:MM
            createTime: this.formatDate(record.createTime),
            // 格式化状态
            statusText: this.getStatusText(record.status),
            statusClass: this.getStatusClass(record.status)
          };
        });
        
        // 合并记录
        const updatedRecords = [...historyList, ...formattedRecords];
        
        this.setData({
          loadingMore: false,
          currentPage: nextPage,
          historyList: updatedRecords,
          isAllLoaded: nextPage >= (totalPages || Math.ceil(total / pageSize))
        });
      } else {
        showToast('加载更多记录失败：' + (res.message || '未知错误'));
        this.setData({
          loadingMore: false
        });
      }
    }).catch(err => {
      console.error('加载更多记录失败', err);
      showToast('加载更多记录失败，请检查网络连接');
      this.setData({
        loadingMore: false
      });
    });
  },

  /**
   * 获取状态文本
   */
  getStatusText: function(status) {
    const statusMap = {
      'SUCCESS': '成功',
      'FAILED': '失败',
      'PENDING': '处理中'
    };
    return statusMap[status] || '未知';
  },

  /**
   * 获取状态样式类
   */
  getStatusClass: function(status) {
    const classMap = {
      'SUCCESS': 'status-success',
      'FAILED': 'status-failed',
      'PENDING': 'status-pending'
    };
    return classMap[status] || '';
  },

  /**
   * 格式化日期
   */
  formatDate: function(dateStr) {
    if (!dateStr) return '';
    
    // 判断是否为字符串，如果是则转为Date对象
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    
    if (isNaN(date.getTime())) return dateStr; // 如果日期无效则返回原始字符串
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  }
}); 