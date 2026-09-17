<template>
  <!-- 该组件用于展示用户发布的失物和招领信息，并提供筛选和排序功能 -->
  <view class="my-publish-container">
    <!-- 切换标签（分段控件） -->
    <view class="tabs">
      <view class="lf-segment">
        <view class="lf-segment-item" :class="{ active: activeTab === 'lost' }" @tap="switchTab('lost')">我的失物</view>
        <view class="lf-segment-item" :class="{ active: activeTab === 'found' }" @tap="switchTab('found')">我的招领</view>
      </view>
    </view>
    
    <!-- 筛选和排序 -->
    <view class="filter-sort-container">
      <!-- 筛选按钮 -->
      <view class="filter-btn" @tap="showFilterOptions">
        <view class="btn-content">
          <text>筛选</text>
          <uni-icons class="icon" type="bottom" size="14" :color="colorGrey" />
        </view>
      </view>
      
      <!-- 排序按钮 -->
      <view class="sort-btn" @tap="showSortOptions">
        <view class="btn-content">
          <text>排序</text>
          <uni-icons class="icon" type="bottom" size="14" :color="colorGrey" />
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
          <uni-icons class="check-icon" v-if="sortOption === 'time-desc'" type="checkmarkempty" size="18" :color="colorPrimary" />
        </view>
        <view 
          class="sort-option" 
          :class="{ active: sortOption === 'time-asc' }"
          @tap="setSortOption('time-asc')"
        >
          <text>最早发布</text>
          <uni-icons class="check-icon" v-if="sortOption === 'time-asc'" type="checkmarkempty" size="18" :color="colorPrimary" />
        </view>
      </view>
    </view>
    
    <!-- 物品列表 -->
    <scroll-view
      class="item-list lf-card-list"
      scroll-y
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
      lower-threshold="80"
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
                <lf-status-tag
                  :status="item.is_completed ? 'completed' : 'open'"
                  :label="getStatusText(item.is_completed ? 'closed' : 'open')"
                />
                <lf-status-tag :status="item.is_under_review ? 'reviewing' : 'reviewed'" :label="item.is_under_review ? '审核中' : '已审核'" />
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
                <lf-status-tag
                  :status="item.is_completed ? 'completed' : 'open'"
                  :label="getStatusText(item.is_completed ? 'closed' : 'open')"
                />
                <lf-status-tag :status="item.is_under_review ? 'reviewing' : 'reviewed'" :label="item.is_under_review ? '审核中' : '已审核'" />
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
      <lf-empty
        v-if="(activeTab === 'lost' && lostItems.length === 0) || (activeTab === 'found' && foundItems.length === 0)"
        type="items"
        :text="activeTab === 'lost' ? '暂无失物信息' : '暂无招领信息'"
        button-text="去发布"
        @action="goToPublish"
      />
    </scroll-view>
  </view>
</template>

<script>
import { checkLogin, goToLogin } from '../../utils/common';
import { COLOR_PRIMARY, COLOR_GREY } from '@/config/ui';

/**
 * 我的发布页面
 * 用于管理用户发布的失物和招领信息
 */
export default {
  data() {
    return {
      colorPrimary: COLOR_PRIMARY,
      colorGrey: COLOR_GREY, // 辅助图标灰（与 $uni-text-color-grey 同步）
      activeTab: 'lost',
      lostItems: [],
      foundItems: [],
      isRefreshing: false,
      // 分页状态（触底加载更多）
      page: 1,
      size: 10,
      hasMore: true,
      isLoadingMore: false,
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
     * @param {Object} [options] 加载选项
     * @param {Boolean} [options.append=false] true 时为触底追加，false 时重置到第一页
     */
    async loadData(options = {}) {
      const append = !!options.append;
      // 触底追加由 isLoadingMore 防重入；首屏/刷新走 showLoading
      if (append) {
        if (this.isLoadingMore || !this.hasMore) return;
        this.isLoadingMore = true;
      } else {
        this.page = 1;
        this.hasMore = true;
        uni.showLoading({
          title: '加载中...'
        });
      }

      try {
        const params = { page: this.page, size: this.size };
        let res;
        if (this.activeTab === 'lost') {
          // 获取我的失物列表
          res = await this.$api.lostItem.getMyList(params);
        } else {
          // 获取我的招领列表
          res = await this.$api.foundItem.getMyList(params);
        }

        const pageItems = res.items || [];
        // hasMore 兼容判断：响应带 total 时按 total 算，否则按本页条数是否满一页算
        if (typeof res.total === 'number') {
          this.hasMore = this.page * this.size < res.total;
        } else {
          this.hasMore = pageItems.length >= this.size;
        }

        if (append) {
          // 追加到原始数据尾部；重复项（极端情况下的页边界重复）按 id 去重
          const original = this.activeTab === 'lost' ? this.originalLostItems : this.originalFoundItems;
          const existIds = new Set(original.map(item => String(item.id)));
          const newItems = pageItems.filter(item => !existIds.has(String(item.id)));
          if (this.activeTab === 'lost') {
            this.originalLostItems = original.concat(newItems);
          } else {
            this.originalFoundItems = original.concat(newItems);
          }
        } else {
          if (this.activeTab === 'lost') {
            this.originalLostItems = pageItems;
          } else {
            this.originalFoundItems = pageItems;
          }
        }

        // 指向下一页
        this.page += 1;
        // 应用筛选和排序
        this.applyFiltersAndSort();

        if (append) {
          this.isLoadingMore = false;
        } else {
          uni.hideLoading();
        }
      } catch (error) {
        // 追加失败回退页码，下次触底重新请求同一页
        if (append) {
          this.page = Math.max(1, this.page - 1);
          this.isLoadingMore = false;
        } else {
          uni.hideLoading();
        }
        uni.showToast({
          title: '加载失败，请稍后再试',
          icon: 'none'
        });
      }
    },

    /**
     * 触底加载更多（scroll-view scrolltolower）
     */
    onLoadMore() {
      if (!this.hasMore || this.isLoadingMore) return;
      this.loadData({ append: true });
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
        // 切换标签重置分页状态，从第一页重新加载
        this.page = 1;
        this.hasMore = true;
        this.isLoadingMore = false;
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

<style lang="scss" scoped>
/* 页面容器 */
.my-publish-container {
  min-height: 100vh;
  background-color: $uni-bg-color-grey;
  display: flex;
  flex-direction: column;
}

/* 标签栏（分段控件，公共样式见 common.scss .lf-segment） */
.tabs {
  padding: 24rpx;
  background-color: $uni-bg-color;
  box-shadow: 0 2rpx 12rpx rgba(31, 41, 55, 0.04);
}

/* 列表区域样式 */
.item-list {
  flex: 1;
  padding: 20rpx 10rpx calc(40rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
  width: 100%;
  overflow-x: hidden;
}

/* 物品卡片：横向布局（图左文右），基础样式见 common.scss .lf-card-list */

/* 标题行：名称 + 状态标签组 */
.status-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;
  max-width: 50%;
  overflow: visible;
  gap: 8rpx;
}

/* 时间行 */
.time-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}

.item-time {
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
  margin-right: 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.relative-time {
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
  background-color: $uni-bg-color-section;
  padding: 4rpx 12rpx;
  border-radius: $uni-radius-xs;
  flex-shrink: 0;
}

/* 物品操作按钮（浅 tint 软按钮体系） */
.item-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 1rpx solid $uni-border-color-split;
}

.action-btn {
  height: 56rpx;
  padding: 0 26rpx;
  border-radius: 28rpx;
  font-size: $uni-font-size-caption;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
  transition: opacity 0.15s;

  &:active {
    opacity: 0.7;
  }
}

.edit-btn {
  background-color: $uni-bg-color-section;
  color: $uni-text-color;
}

.delete-btn {
  background-color: $uni-color-error-soft;
  color: $uni-color-error;
}

.status-btn {
  background-color: $uni-color-primary-soft;
  color: $uni-color-primary;
}

/* 禁用状态按钮 */
.disabled-btn {
  opacity: $uni-opacity-disabled;
  pointer-events: none;
}

/* ===== 筛选和排序工具条 ===== */
.filter-sort-container {
  display: flex;
  height: 84rpx;
  background-color: $uni-bg-color;
  align-items: center;
  justify-content: center;
  padding: 0 24rpx;
}

.filter-btn, .sort-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $uni-bg-color-section;
  border-radius: 28rpx;
  margin-right: 16rpx;
  font-size: $uni-font-size-caption;
  color: $uni-text-color;
  height: 52rpx;
  width: 116rpx;
  box-sizing: border-box;

  &:active {
    background-color: $uni-bg-color-hover;
  }
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.icon {
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
  background-color: $uni-color-primary-soft;
  border-radius: 28rpx;
  font-size: $uni-font-size-caption;
  color: $uni-color-primary;
  height: 52rpx;
  width: 104rpx;
  box-sizing: border-box;
}

.clear-filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background-color: $uni-color-error-soft;
  border-radius: 28rpx;
  font-size: $uni-font-size-caption;
  color: $uni-color-error;
  margin-left: 12rpx;
  height: 52rpx;
  width: 84rpx;
  box-sizing: border-box;
}

/* ===== 筛选和排序弹出层 ===== */
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
  animation: fadeIn 0.25s ease;
}

.filter-popup-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  background-color: $uni-bg-color;
  border-radius: 0 0 32rpx 32rpx;
  padding: 36rpx 30rpx;
  animation: slideDown 0.3s ease;
}

.sort-popup-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: $uni-bg-color;
  border-radius: 32rpx 32rpx 0 0;
  padding: 36rpx 30rpx calc(36rpx + env(safe-area-inset-bottom));
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
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
  font-size: $uni-font-size-lg;
  font-weight: 600;
  margin-bottom: 30rpx;
  text-align: center;
  color: $uni-text-color;
}

.filter-section {
  margin-bottom: 30rpx;
}

.filter-section-title {
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  font-weight: 600;
  margin-bottom: 20rpx;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
}

.filter-option {
  padding: 12rpx 28rpx;
  background-color: $uni-bg-color-section;
  border-radius: 28rpx;
  margin-right: 18rpx;
  margin-bottom: 18rpx;
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
  border: 2rpx solid transparent;
  transition: all 0.15s;
}

.filter-option.active {
  background-color: $uni-color-primary-soft;
  color: $uni-color-primary;
  font-weight: 500;
  border-color: rgba($uni-color-primary, 0.35);
}

.filter-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30rpx;
  gap: 24rpx;
}

.filter-actions .filter-btn {
  flex: 1;
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 42rpx;
  font-size: $uni-font-size-base;
  font-weight: 500;
  width: auto;
  margin-right: 0;
}

.filter-actions .filter-btn.cancel {
  background-color: $uni-bg-color-section;
  color: $uni-text-color-grey;
}

.filter-actions .filter-btn.confirm {
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  box-shadow: $uni-shadow-btn;
}

.sort-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 0;
  border-bottom: 1rpx solid $uni-border-color-split;
  font-size: $uni-font-size-base;
  color: $uni-text-color;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background-color: $uni-bg-color-hover;
  }
}

.sort-option.active {
  color: $uni-color-primary;
  font-weight: 500;
}

.check-icon {
  color: $uni-color-primary;
  font-weight: bold;
  font-size: $uni-font-size-base;
}
</style>
