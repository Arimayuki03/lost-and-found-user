<template>
  <!-- 该组件用于展示用户发布的失物和招领信息，并提供筛选和排序功能 -->
  <view class="my-publish-container">
    <!-- 切换标签 -->
    <view class="tabs">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'lost' }"
        @tap="switchTab('lost')"
      >
        我的失物
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'found' }"
        @tap="switchTab('found')"
      >
        我的招领
      </view>
    </view>
    
    <!-- 筛选和排序 -->
    <view class="filter-sort-container">
      <!-- 筛选按钮 -->
      <view class="filter-btn" @tap="showFilterOptions">
        <view class="btn-content">
          <text>筛选</text>
          <text class="icon">▼</text>
        </view>
      </view>
      
      <!-- 排序按钮 -->
      <view class="sort-btn" @tap="showSortOptions">
        <view class="btn-content">
          <text>排序</text>
          <text class="icon">▼</text>
        </view>
      </view>
      
      <!-- 当前筛选条件显示 -->
      <view class="current-filter" v-if="hasActiveFilters">
        <view class="filter-status-btn">
          <view class="btn-content">
            <text>已筛选</text>
          </view>
        </view>
        <view class="clear-filter-btn" @tap="clearFilters">
          <view class="btn-content">
            <text>清除</text>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 筛选选项弹出层 -->
    <view class="filter-popup" v-if="showFilter">
      <view class="filter-popup-mask" @tap="hideFilterOptions"></view>
      <view class="filter-popup-content">
        <view class="filter-title">筛选条件</view>
        
        <!-- 完成状态筛选 -->
        <view class="filter-section">
          <view class="filter-section-title">完成状态</view>
          <view class="filter-options">
            <view 
              class="filter-option" 
              :class="{ active: filters.completionStatus === 'all' }"
              @tap="setCompletionFilter('all')"
            >全部</view>
            <view 
              class="filter-option" 
              :class="{ active: filters.completionStatus === 'completed' }"
              @tap="setCompletionFilter('completed')"
            >已完成</view>
            <view 
              class="filter-option" 
              :class="{ active: filters.completionStatus === 'incompleted' }"
              @tap="setCompletionFilter('incompleted')"
            >未完成</view>
          </view>
        </view>
        
        <!-- 审核状态筛选 -->
        <view class="filter-section">
          <view class="filter-section-title">审核状态</view>
          <view class="filter-options">
            <view 
              class="filter-option" 
              :class="{ active: filters.reviewStatus === 'all' }"
              @tap="setReviewFilter('all')"
            >全部</view>
            <view 
              class="filter-option" 
              :class="{ active: filters.reviewStatus === 'reviewed' }"
              @tap="setReviewFilter('reviewed')"
            >已审核</view>
            <view 
              class="filter-option" 
              :class="{ active: filters.reviewStatus === 'under-review' }"
              @tap="setReviewFilter('under-review')"
            >审核中</view>
          </view>
        </view>
        
        <!-- 确认按钮 -->
        <view class="filter-actions">
          <view class="filter-btn cancel" @tap="hideFilterOptions">取消</view>
          <view class="filter-btn confirm" @tap="applyFilters">确认</view>
        </view>
      </view>
    </view>
    
    <!-- 排序选项弹出层 -->
    <view class="sort-popup" v-if="showSort">
      <view class="sort-popup-mask" @tap="hideSortOptions"></view>
      <view class="sort-popup-content">
        <view class="sort-title">排序方式</view>
        <view 
          class="sort-option" 
          :class="{ active: sortOption === 'time-desc' }"
          @tap="setSortOption('time-desc')"
        >
          <text>最新发布</text>
          <text class="check-icon" v-if="sortOption === 'time-desc'">✓</text>
        </view>
        <view 
          class="sort-option" 
          :class="{ active: sortOption === 'time-asc' }"
          @tap="setSortOption('time-asc')"
        >
          <text>最早发布</text>
          <text class="check-icon" v-if="sortOption === 'time-asc'">✓</text>
        </view>
      </view>
    </view>
    
    <!-- 物品列表 -->
    <scroll-view 
      class="item-list" 
      scroll-y 
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 失物列表 -->
      <view v-if="activeTab === 'lost' && lostItems.length > 0">
        <view 
          class="item-card" 
          v-for="(item, index) in lostItems" 
          :key="index"
          @tap="goToDetail(item.id, 'lost')"
        >
          <image class="item-image" :src="item.image_url || (item.images && item.images[0]) || '/static/logo.png'" mode="aspectFill"></image>
          <view class="item-info">
            <view class="item-header">
              <text class="item-name">{{ item.name }}</text>
              <view class="status-container">
                <view class="item-status" :class="getStatusClass(item.is_completed ? 'closed' : 'open')">
                  {{ getStatusText(item.is_completed ? 'closed' : 'open') }}
                </view>
                <view v-if="item.is_under_review" class="review-status under-review">
                  审核中
                </view>
                <view v-else class="review-status reviewed">
                  已审核
                </view>
              </view>
            </view>
            <text class="item-desc">{{ item.description }}</text>
            <view class="item-footer">
              <view class="time-container">
                <text class="item-time">{{ formatDate(item.created_at) }}</text>
                <text class="relative-time">{{ $utils.relativeTime(item.created_at) }}</text>
              </view>
            </view>
            <view class="item-actions">
              <view 
                class="action-btn edit-btn" 
                :class="{'disabled-btn': item.is_under_review}"
                @tap.stop="item.is_under_review ? showReviewStatusTip() : editItem(item.id, 'lost')"
              >编辑</view>
              <view 
                class="action-btn delete-btn" 
                :class="{'disabled-btn': item.is_under_review}"
                @tap.stop="item.is_under_review ? showReviewStatusTip() : deleteItem(item.id, 'lost')"
              >删除</view>
              <view 
                class="action-btn status-btn" 
                :class="{'disabled-btn': item.is_under_review}"
                @tap.stop="item.is_under_review ? showReviewStatusTip() : changeStatus(item.id, 'lost', !item.is_completed)"
              >
                {{ item.is_completed ? '重新发布' : '标记已找到' }}
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 招领列表 -->
      <view v-if="activeTab === 'found' && foundItems.length > 0">
        <view 
          class="item-card" 
          v-for="(item, index) in foundItems" 
          :key="index"
          @tap="goToDetail(item.id, 'found')"
        >
          <image class="item-image" :src="item.image_url || (item.images && item.images[0]) || '/static/logo.png'" mode="aspectFill"></image>
          <view class="item-info">
            <view class="item-header">
              <text class="item-name">{{ item.name }}</text>
              <view class="status-container">
                <view class="item-status" :class="getStatusClass(item.is_completed ? 'closed' : 'open')">
                  {{ getStatusText(item.is_completed ? 'closed' : 'open') }}
                </view>
                <view v-if="item.is_under_review" class="review-status under-review">
                  审核中
                </view>
                <view v-else class="review-status reviewed">
                  已审核
                </view>
              </view>
            </view>
            <text class="item-desc">{{ item.description }}</text>
            <view class="item-footer">
              <view class="time-container">
                <text class="item-time">{{ formatDate(item.created_at) }}</text>
                <text class="relative-time">{{ $utils.relativeTime(item.created_at) }}</text>
              </view>
            </view>
            <view class="item-actions">
              <view 
                class="action-btn edit-btn" 
                :class="{'disabled-btn': item.is_under_review}"
                @tap.stop="item.is_under_review ? showReviewStatusTip() : editItem(item.id, 'found')"
              >编辑</view>
              <view 
                class="action-btn delete-btn" 
                :class="{'disabled-btn': item.is_under_review}"
                @tap.stop="item.is_under_review ? showReviewStatusTip() : deleteItem(item.id, 'found')"
              >删除</view>
              <view 
                class="action-btn status-btn" 
                :class="{'disabled-btn': item.is_under_review}"
                @tap.stop="item.is_under_review ? showReviewStatusTip() : changeStatus(item.id, 'found', !item.is_completed)"
              >
                {{ item.is_completed ? '重新发布' : '标记已归还' }}
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="(activeTab === 'lost' && lostItems.length === 0) || (activeTab === 'found' && foundItems.length === 0)">
        <image class="empty-image" src="/static/logo.png" mode="aspectFit"></image>
        <text class="empty-text">{{ activeTab === 'lost' ? '暂无失物信息' : '暂无招领信息' }}</text>
        <view class="publish-btn" @tap="goToPublish">去发布</view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { checkLogin, goToLogin } from '../../utils/common';

/**
 * 我的发布页面
 * 用于管理用户发布的失物和招领信息
 */
export default {
  data() {
    return {
      activeTab: 'lost',
      lostItems: [],
      foundItems: [],
      isRefreshing: false,
      // 筛选和排序相关
      showFilter: false,
      showSort: false,
      filters: {
        completionStatus: 'all', // all, completed, incompleted
        reviewStatus: 'all' // all, reviewed, under-review
      },
      sortOption: 'time-desc', // time-desc, time-asc
      // 原始数据（未筛选）
      originalLostItems: [],
      originalFoundItems: []
    };
  },
  
  computed: {
    // 判断是否有激活的筛选条件
    hasActiveFilters() {
      return this.filters.completionStatus !== 'all' || this.filters.reviewStatus !== 'all';
    },
    
    // 获取当前显示的物品列表
    currentItems() {
      return this.activeTab === 'lost' ? this.lostItems : this.foundItems;
    }
  },
  
  onLoad(options) {
    // 检查登录状态，未登录则跳转登录页
    if (!checkLogin()) {
      goToLogin();
      return;
    }

    // 设置初始标签（如果有传入类型参数）
    if (options.type) {
      this.activeTab = options.type;
    }

    // 标记首次显示，onShow 中跳过，避免 onLoad+onShow 背靠背双份加载
    this._isFirstShow = true;

    // 加载数据
    this.loadData();
  },

  onShow() {
    // 未登录时不发起注定 401 的请求
    if (!checkLogin()) return;

    // 首次显示由 onLoad 负责加载
    if (this._isFirstShow) {
      this._isFirstShow = false;
      return;
    }

    // 页面显示时刷新数据
    this.loadData();
  },
  
  methods: {
    /**
     * 加载数据
     * 根据当前活动标签加载失物或招领列表
     */
    async loadData() {
      uni.showLoading({
        title: '加载中...'
      });
      
      try {
        if (this.activeTab === 'lost') {
          // 获取我的失物列表
          const res = await this.$api.lostItem.getMyList();
          this.originalLostItems = res.items || [];
          // 应用筛选和排序
          this.applyFiltersAndSort();
        } else {
          // 获取我的招领列表
          const res = await this.$api.foundItem.getMyList();
          this.originalFoundItems = res.items || [];
          // 应用筛选和排序
          this.applyFiltersAndSort();
        }
        
        uni.hideLoading();
      } catch (error) {
        uni.hideLoading();
        uni.showToast({
          title: '加载失败，请稍后再试',
          icon: 'none'
        });
      }
    },
    
    /**
     * 应用筛选和排序
     * 根据当前的筛选条件和排序选项处理数据
     */
    applyFiltersAndSort() {
      let items = this.activeTab === 'lost' ? [...this.originalLostItems] : [...this.originalFoundItems];
      
      // 应用完成状态筛选
      if (this.filters.completionStatus !== 'all') {
        const isCompleted = this.filters.completionStatus === 'completed';
        items = items.filter(item => item.is_completed === isCompleted);
      }
      
      // 应用审核状态筛选
      if (this.filters.reviewStatus !== 'all') {
        const isUnderReview = this.filters.reviewStatus === 'under-review';
        items = items.filter(item => item.is_under_review === isUnderReview);
      }
      
      // 应用排序
      items.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        
        if (this.sortOption === 'time-desc') {
          return dateB - dateA; // 最新发布在前
        } else {
          return dateA - dateB; // 最早发布在前
        }
      });
      
      // 更新显示的列表
      if (this.activeTab === 'lost') {
        this.lostItems = items;
      } else {
        this.foundItems = items;
      }
    },
    
    // 筛选相关方法
    showFilterOptions() {
      this.showFilter = true;
      this.showSort = false;
    },
    
    hideFilterOptions() {
      this.showFilter = false;
    },
    
    showSortOptions() {
      this.showSort = true;
      this.showFilter = false;
    },
    
    hideSortOptions() {
      this.showSort = false;
    },
    
    setCompletionFilter(status) {
      this.filters.completionStatus = status;
    },
    
    setReviewFilter(status) {
      this.filters.reviewStatus = status;
    },
    
    setSortOption(option) {
      this.sortOption = option;
      this.applyFiltersAndSort();
      this.hideSortOptions();
    },
    
    applyFilters() {
      this.applyFiltersAndSort();
      this.hideFilterOptions();
    },
    
    clearFilters() {
      this.filters.completionStatus = 'all';
      this.filters.reviewStatus = 'all';
      this.applyFiltersAndSort();
    },
    
    /**
     * 切换标签（失物/招领）
     * @param {String} tab 目标标签
     */
    switchTab(tab) {
      if (this.activeTab !== tab) {
        this.activeTab = tab;
        this.loadData();
      }
    },
    
    /**
     * 下拉刷新处理
     */
    async onRefresh() {
      this.isRefreshing = true;
      await this.loadData();
      this.isRefreshing = false;
    },
    
    /**
     * 获取状态样式类
     * @param {String} status 状态值
     * @returns {String} 对应的CSS类名
     */
    getStatusClass(status) {
      return {
        'open': 'status-open',
        'closed': 'status-closed'
      }[status] || 'status-open';
    },
    
    /**
     * 获取状态文本
     * @param {String} status 状态值
     * @returns {String} 对应的状态文本
     */
    getStatusText(status) {
      return {
        'open': this.activeTab === 'lost' ? '寻找中' : '招领中',
        'closed': this.activeTab === 'lost' ? '已找到' : '已归还'
      }[status] || '寻找中';
    },
    
    /**
     * 跳转到物品详情页
     * @param {String|Number} id 物品ID
     * @param {String} type 物品类型（lost/found）
     */
    goToDetail(id, type) {
      uni.navigateTo({
        url: `/pages/detail/detail?id=${id}&type=${type}&from=myPublish`
      });
    },
    
    /**
     * 编辑物品
     * @param {String|Number} id 物品ID
     * @param {String} type 物品类型（lost/found）
     */
    editItem(id, type) {
      // 首先检查物品是否处于审核状态
      const items = type === 'lost' ? this.lostItems : this.foundItems;
      const item = items.find(item => item.id === id);
      
      if (item && item.is_under_review) {
        this.showReviewStatusTip();
        return;
      }
      
      // 根据类型跳转到对应的编辑页面
      uni.navigateTo({
        url: `/pages/edit/edit${type === 'lost' ? 'Lost' : 'Found'}Item?id=${id}`
      });
    },
    
    /**
     * 删除物品
     * @param {String|Number} id 物品ID
     * @param {String} type 物品类型（lost/found）
     */
    deleteItem(id, type) {
      // 首先检查物品是否处于审核状态
      const items = type === 'lost' ? this.lostItems : this.foundItems;
      const item = items.find(item => item.id === id);
      
      if (item && item.is_under_review) {
        this.showReviewStatusTip();
        return;
      }
      
      uni.showModal({
        title: '提示',
        content: '确定要删除该物品吗？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({
              title: '删除中...'
            });
            
            try {
              if (type === 'lost') {
                await this.$api.lostItem.delete(id);
              } else {
                await this.$api.foundItem.delete(id);
              }
              
              uni.hideLoading();
              uni.showToast({
                title: '删除成功',
                icon: 'success'
              });
              
              // 重新加载数据
              this.loadData();
            } catch (error) {
              uni.hideLoading();
              uni.showToast({
                title: '删除失败，请稍后再试',
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    /**
     * 修改物品状态（完成/未完成）
     * @param {String|Number} id 物品ID
     * @param {String} type 物品类型（lost/found）
     * @param {Boolean} newIsCompleted 新的完成状态
     */
    async changeStatus(id, type, newIsCompleted) {
      // 首先检查物品是否处于审核状态
      const items = type === 'lost' ? this.lostItems : this.foundItems;
      const item = items.find(item => item.id === id);
      
      if (item && item.is_under_review) {
        this.showReviewStatusTip();
        return;
      }
      
      uni.showLoading({
        title: '处理中...'
      });
      
      try {
        let response;
        if (type === 'lost') {
          response = await this.$api.lostItem.update(id, { is_completed: newIsCompleted });
        } else {
          response = await this.$api.foundItem.update(id, { is_completed: newIsCompleted });
        }
        
        uni.hideLoading();
        
        // 根据操作类型显示不同的提示信息
        if (newIsCompleted) {
          // 标记为已找到/已归还
          uni.showToast({
            title: type === 'lost' ? '已标记为找到' : '已标记为归还',
            icon: 'success'
          });
        } else {
          // 重新发布
          uni.showToast({
            title: '已重新发布，等待审核',
            icon: 'success'
          });
        }
        
        // 确定审核状态（优先使用后端返回的值，否则使用默认逻辑）
        let isUnderReview = !newIsCompleted; // 默认：重新发布时需要审核
        if (response && typeof response.is_under_review !== 'undefined') {
          isUnderReview = response.is_under_review;
        }
        
        // 更新本地数据状态
        this.updateItemStatus(id, type, newIsCompleted, isUnderReview);
        
        // 延迟刷新数据
        setTimeout(() => {
          this.loadData();
        }, 1000);
      } catch (error) {
        uni.hideLoading();
        
        // 处理特定错误
        if (error && error.error === '物品正在审核中，不能更改完成状态') {
          uni.showToast({
            title: '审核中的物品不能更改状态',
            icon: 'none',
            duration: 2000
          });
        } else {
          uni.showToast({
            title: '操作失败，请稍后再试',
            icon: 'none'
          });
        }
      }
    },
    
    /**
     * 更新物品状态（本地数据）
     * @param {String|Number} id 物品ID
     * @param {String} type 物品类型（lost/found）
     * @param {Boolean} isCompleted 是否完成
     * @param {Boolean} isUnderReview 是否审核中
     */
    updateItemStatus(id, type, isCompleted, isUnderReview) {
      if (type === 'lost') {
        // 更新显示列表中的状态（Vue 3 无 $set，对象已有属性直接赋值即为响应式）
        const itemIndex = this.lostItems.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
          this.lostItems[itemIndex].is_completed = isCompleted;
          this.lostItems[itemIndex].is_under_review = isUnderReview;
        }

        // 同时更新原始数据
        const originalIndex = this.originalLostItems.findIndex(item => item.id === id);
        if (originalIndex !== -1) {
          this.originalLostItems[originalIndex].is_completed = isCompleted;
          this.originalLostItems[originalIndex].is_under_review = isUnderReview;
        }
      } else {
        // 更新显示列表中的状态
        const itemIndex = this.foundItems.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
          this.foundItems[itemIndex].is_completed = isCompleted;
          this.foundItems[itemIndex].is_under_review = isUnderReview;
        }

        // 同时更新原始数据
        const originalIndex = this.originalFoundItems.findIndex(item => item.id === id);
        if (originalIndex !== -1) {
          this.originalFoundItems[originalIndex].is_completed = isCompleted;
          this.originalFoundItems[originalIndex].is_under_review = isUnderReview;
        }
      }

      // 重新应用筛选和排序，确保视图更新
      this.applyFiltersAndSort();
    },
    
    /**
     * 跳转到发布页面
     */
    goToPublish() {
      uni.switchTab({
        url: '/pages/publish/publish'
      });
    },
    
    /**
     * 格式化日期
     * @param {String} dateString 日期字符串
     * @returns {String} 格式化后的日期字符串
     */
    formatDate(dateString) {
      if (!dateString) return '';
      
      try {
        // 解析日期字符串
        const date = new Date(dateString);
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          return '';
        }
        
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      } catch (error) {
        return '';
      }
    },
    
    /**
     * 显示审核状态提示
     * 当用户尝试对审核中的物品进行操作时提示
     */
    showReviewStatusTip() {
      uni.showToast({
        title: '审核中的物品不能更改状态',
        icon: 'none',
        duration: 2000
      });
    }
  }
};
</script>

<style lang="scss">
/* 页面容器 */
.my-publish-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 标签栏样式 */
.tabs {
  display: flex;
  height: 80rpx;
  background-color: #fff;
  border-bottom: 1px solid #f5f5f5;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #007AFF;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #007AFF;
  border-radius: 2rpx;
}

/* 列表区域样式 */
.item-list {
  flex: 1;
  padding: 20rpx 10rpx;
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
}

/* 物品卡片样式 */
.item-card {
  display: flex;
  background-color: #fff;
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  width: calc(100% - 20rpx);
  box-sizing: border-box;
  margin-right: 10rpx;
  margin-left: 10rpx;
}

.item-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 10rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: calc(100% - 180rpx);
  max-width: calc(100% - 180rpx);
}

/* 物品标题和状态栏 */
.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
  width: 100%;
  overflow: visible;
}

.item-name {
  font-size: 32rpx;
  color: #333;
  font-weight: bold;
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 50%;
}

.status-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
  max-width: 50%;
  overflow: visible;
}

/* 物品状态标签 */
.item-status {
  font-size: 24rpx;
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  margin-right: 5rpx;
  flex-shrink: 0;
  white-space: nowrap;
}

.status-open {
  background-color: #007AFF;
}

.status-closed {
  background-color: #999;
}

/* 审核状态标签 */
.review-status {
  font-size: 22rpx;
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  margin-left: 5rpx;
  flex-shrink: 0;
  white-space: nowrap;
}

.reviewed {
  background-color: #4CD964;
}

.under-review {
  background-color: #FF9500;
}

/* 物品描述 */
.item-desc {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 物品底部信息 */
.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
  width: 100%;
}

.time-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}

.item-time {
  font-size: 22rpx;
  color: #666;
  margin-right: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.relative-time {
  font-size: 20rpx;
  color: #999;
  background-color: #f5f5f5;
  padding: 2rpx 8rpx;
  border-radius: 10rpx;
  flex-shrink: 0;
}

/* 物品操作按钮 */
.item-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10rpx;
}

.action-btn {
  height: 50rpx;
  padding: 0 20rpx;
  border-radius: 25rpx;
  font-size: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
}

.edit-btn {
  background-color: #f5f5f5;
  color: #666;
}

.delete-btn {
  background-color: #f5f5f5;
  color: #FF3B30;
}

.status-btn {
  background-color: #007AFF;
  color: #fff;
}

/* 禁用状态按钮 */
.disabled-btn {
  opacity: 0.5;
  background-color: #cccccc !important;
  color: #666666 !important;
  pointer-events: none;
}

/* 空状态提示 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 30rpx;
}

.publish-btn {
  width: 200rpx;
  height: 70rpx;
  background: linear-gradient(to right, #007AFF, #5AC8FA);
  color: #fff;
  border-radius: 35rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 筛选和排序容器 */
.filter-sort-container {
  display: flex;
  height: 70rpx;
  background-color: #fff;
  border-bottom: 1px solid #f5f5f5;
  align-items: center;
  justify-content: center;
  padding: 0 20rpx;
}

.filter-btn, .sort-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 20rpx;
  margin-right: 15rpx;
  font-size: 22rpx;
  color: #666;
  height: 44rpx;
  width: 100rpx;
  box-sizing: border-box;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.icon {
  font-size: 18rpx;
  margin-left: 4rpx;
}

.current-filter {
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-status-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background-color: rgba(0, 122, 255, 0.1);
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #007AFF;
  height: 44rpx;
  width: 90rpx;
  box-sizing: border-box;
}

.clear-filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background-color: rgba(255, 59, 48, 0.1);
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #FF3B30;
  margin-left: 10rpx;
  height: 44rpx;
  width: 70rpx;
  box-sizing: border-box;
}

/* 筛选和排序弹出层 */
.filter-popup, .sort-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.filter-popup-mask, .sort-popup-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.filter-popup-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-radius: 0 0 20rpx 20rpx;
  padding: 30rpx;
  animation: slideDown 0.3s ease;
}

.sort-popup-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  border-radius: 20rpx 20rpx 0 0;
  padding: 30rpx;
  animation: slideUp 0.3s ease;
}

@keyframes slideDown {
  from { transform: translateY(-100%); }
  to { transform: translateY(0); }
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

/* 筛选和排序标题 */
.filter-title, .sort-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 30rpx;
  text-align: center;
}

.filter-section {
  margin-bottom: 30rpx;
}

.filter-section-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
}

.filter-option {
  padding: 8rpx 16rpx;
  background-color: #f5f5f5;
  border-radius: 20rpx;
  margin-right: 15rpx;
  margin-bottom: 15rpx;
  font-size: 22rpx;
  color: #666;
}

.filter-option.active {
  background-color: #007AFF;
  color: #fff;
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30rpx;
}

.filter-actions .filter-btn {
  flex: 1;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 35rpx;
  font-size: 26rpx;
  width: auto;
}

.filter-actions .filter-btn.cancel {
  background-color: #f5f5f5;
  color: #666;
  margin-right: 20rpx;
}

.filter-actions .filter-btn.confirm {
  background-color: #007AFF;
  color: #fff;
}

.sort-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25rpx 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 26rpx;
  color: #333;
}

.sort-option.active {
  color: #007AFF;
}

.check-icon {
  color: #007AFF;
  font-weight: bold;
  font-size: 26rpx;
}
</style> 