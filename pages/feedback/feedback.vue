<template>
  <view class="feedback-container">
    <!-- 反馈表单 -->
    <view class="form-container">
      <view class="form-item">
        <text class="form-label">反馈内容</text>
        <textarea 
          class="form-textarea" 
          v-model="content" 
          placeholder="请详细描述您遇到的问题或建议..." 
          maxlength="500"
        ></textarea>
        <text class="textarea-counter">{{ content.length }}/500</text>
      </view>
      
      <button class="submit-btn" @tap="submitFeedback">提交反馈</button>
      
      <!-- 注销申请按钮 -->
      <button class="delete-account-btn" @tap="showDeleteAccountConfirm">申请注销账号</button>
    </view>
    
    <!-- 历史反馈记录 -->
    <view class="history-container" v-if="feedbackList.length > 0">
      <view class="history-title">
        <text>历史反馈记录</text>
      </view>
      <view class="history-list">
        <view class="history-item" v-for="(item, index) in feedbackList" :key="index">
          <view class="history-content">{{ item.content || item.message || '无内容' }}</view>
          <view class="history-time">{{ formatDate(item.timestamp || item.created_at || item.time) }}</view>
        </view>
      </view>
    </view>
    
    <!-- 无记录提示 -->
    <view class="empty-container" v-else-if="isLoaded">
      <text class="empty-text">暂无反馈记录</text>
    </view>
    
    <!-- 加载中提示 -->
    <view class="loading-container" v-if="isLoading">
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 自定义注销账号确认弹窗（底部抽屉，公共样式见 common.scss .lf-popup） -->
    <view class="lf-popup" v-if="showDeleteAccountPopup">
      <view class="lf-popup-mask" @tap="closeDeleteAccountPopup"></view>
      <view class="lf-popup-content">
        <view class="lf-popup-header">
          <text class="lf-popup-title">确认注销账号</text>
          <view class="lf-popup-close" @tap="closeDeleteAccountPopup"><uni-icons type="closeempty" size="18" :color="colorGrey" /></view>
        </view>
        <view class="lf-popup-body">
          <view class="popup-message">注销账号后，您的所有数据将被删除且无法恢复。</view>
          <view class="form-item">
            <text class="form-label">请输入以下文字确认操作：</text>
            <view class="confirm-text-display">{{ expectedConfirmText }}</view>
            <input class="form-input" v-model="confirmInput" placeholder="请输入上方文字" />
          </view>
        </view>
        <view class="lf-popup-footer">
          <button class="lf-btn-ghost lf-popup-btn" @tap="closeDeleteAccountPopup">取消</button>
          <button class="lf-btn-danger lf-popup-btn" @tap="confirmDeleteAccount">确认注销</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState } from 'vuex';
import { COLOR_GREY } from '@/config/ui';

/**
 * 用户反馈组件
 * 提供反馈提交、历史查询和账号注销功能
 */
export default {
  data() {
    return {
      colorGrey: COLOR_GREY, // 辅助图标灰（与 $uni-text-color-grey 同步）
      content: '', // 反馈内容
      feedbackList: [], // 反馈历史列表
      isLoading: false, // 加载状态
      isLoaded: false, // 是否已加载完成
      expectedConfirmText: '我确认申请注销账号', // 预期的确认文本
      confirmInput: '', // 用户输入的确认文本
      showDeleteAccountPopup: false // 控制注销账号弹窗显示
    };
  },
  
  computed: {
    // 从Vuex获取用户状态
    ...mapState({
      userInfo: state => state.userInfo,
      isLoggedIn: state => state.isLoggedIn
    })
  },
  
  /**
   * 页面加载时初始化
   */
  onLoad() {
    // 页面加载时获取历史反馈记录
    this.getMyFeedbackList();
  },
  
  /**
   * 页面显示时处理
   */
  onShow() {
    // 如果已登录但没有用户信息，尝试获取
    if (this.isLoggedIn && !this.userInfo) {
      this.$store.dispatch('getUserInfo');
    }
  },
  
  methods: {
    /**
     * 获取我的反馈记录
     * 从服务器获取当前用户的历史反馈列表
     */
    async getMyFeedbackList() {
      // 检查登录状态
      if (!this.isLoggedIn) {
        this.isLoaded = true;
        return;
      }
      
      this.isLoading = true;
      try {
        // 调用接口获取反馈记录
        const res = await this.$store.dispatch('getMyFeedbackList');
        
        // 处理返回的数据
        if (Array.isArray(res)) {
          // 如果返回的是数组，直接使用
          this.feedbackList = res;
        } else if (res && typeof res === 'object') {
          // 如果返回的是对象，尝试提取数组
          this.feedbackList = res.feedbacks || res.items || [];
        } else if (typeof res === 'string') {
          // 如果返回的是字符串，创建一个包含该字符串的反馈项
          this.feedbackList = [{
            id: 1,
            content: res,
            timestamp: new Date().toISOString()
          }];
        } else {
          // 其他情况，使用空数组
          this.feedbackList = [];
        }
        
        this.isLoaded = true;
      } catch (error) {
        uni.showToast({
          title: '获取反馈记录失败',
          icon: 'none'
        });
        // 失败时也要标记已加载，否则空状态永不显示，页面停留在无提示状态
        this.feedbackList = [];
        this.isLoaded = true;
      } finally {
        this.isLoading = false;
      }
    },
    
    /**
     * 提交反馈
     * 将用户输入的反馈内容提交到服务器
     */
    async submitFeedback() {
      // 表单验证
      if (!this.content.trim()) {
        uni.showToast({
          title: '请输入反馈内容',
          icon: 'none'
        });
        return;
      }
      
      uni.showLoading({
        title: '提交中...',
        mask: true
      });
      
      try {
        // 提交反馈
        await this.$store.dispatch('submitFeedback', {
          content: this.content
        });
        
        uni.hideLoading();
        uni.showToast({
          title: '提交成功',
          icon: 'success'
        });
        
        // 重置表单
        this.content = '';
        
        // 刷新反馈记录
        setTimeout(() => {
          this.getMyFeedbackList();
        }, 500);
      } catch (error) {
        uni.hideLoading();
        uni.showToast({
          title: '提交失败，请稍后再试',
          icon: 'none'
        });
      }
    },
    
    /**
     * 显示注销账号确认弹窗
     * 在显示弹窗前检查用户登录状态
     */
    async showDeleteAccountConfirm() {
      // 检查登录状态
      if (!this.isLoggedIn) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      
      // 确保获取最新的用户信息
      if (!this.userInfo || !this.userInfo.id) {
        try {
          await this.$store.dispatch('getUserInfo');
        } catch (error) {
          uni.showToast({
            title: '获取用户信息失败，请稍后再试',
            icon: 'none'
          });
          return;
        }
      }
      
      // 重置确认输入
      this.confirmInput = '';
      // 显示自定义弹窗
      this.showDeleteAccountPopup = true;
    },
    
    /**
     * 关闭注销账号确认弹窗
     */
    closeDeleteAccountPopup() {
      this.showDeleteAccountPopup = false;
      this.confirmInput = '';
    },
    
    /**
     * 确认注销账号
     * 验证用户输入的确认文本
     */
    confirmDeleteAccount() {
      if (this.confirmInput !== this.expectedConfirmText) {
        uni.showToast({
          title: '确认文本不正确',
          icon: 'none'
        });
        return;
      }
      
      // 处理注销账号
      this.processDeleteAccount();
      // 关闭弹窗
      this.closeDeleteAccountPopup();
    },
    
    /**
     * 处理注销账号
     * 将注销申请作为特殊类型的反馈提交到服务器
     */
    async processDeleteAccount() {
      const userInfo = this.$store.state.userInfo;
      
      // 如果用户信息不存在，提示错误
      if (!userInfo || !userInfo.id) {
        uni.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
        return;
      }
      
      // 构建注销申请内容
      const deleteAccountContent = `申请注销账号：ID=${userInfo.id || '未知'}，用户名=${userInfo.name || '未知'}，学号=${userInfo.student_id || '未知'}，邮箱=${userInfo.email || '未知'}`;
      
      uni.showLoading({
        title: '提交中...',
        mask: true
      });
      
      try {
        // 提交注销申请
        await this.$store.dispatch('submitFeedback', {
          content: deleteAccountContent,
          type: 'delete_account' // 添加类型标识，便于后端识别
        });
        
        uni.hideLoading();
        uni.showToast({
          title: '申请已提交',
          icon: 'success'
        });
        
        // 刷新反馈记录
        setTimeout(() => {
          this.getMyFeedbackList();
        }, 500);
        
        // 提示用户
        setTimeout(() => {
          uni.showModal({
            title: '申请已提交',
            content: '您的注销申请已提交，管理员将在3-5个工作日内处理，处理结果将发送至您的邮箱。',
            showCancel: false
          });
        }, 1000);
      } catch (error) {
        uni.hideLoading();
        uni.showToast({
          title: '提交失败，请稍后再试',
          icon: 'none'
        });
      }
    },
    
    /**
     * 格式化日期
     * @param {string|Date} dateStr - 日期字符串或日期对象
     * @return {string} 格式化后的日期字符串
     */
    formatDate(dateStr) {
      if (!dateStr) return '未知时间';
      try {
        // 尝试将字符串转换为日期对象
        let date;
        if (typeof dateStr === 'string') {
          date = new Date(dateStr);
        } else if (dateStr instanceof Date) {
          date = dateStr;
        } else {
          return '格式错误';
        }
        
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          return '格式错误';
        }
        
        return date.getFullYear() + '-' + 
               (date.getMonth() + 1).toString().padStart(2, '0') + '-' + 
               date.getDate().toString().padStart(2, '0') + ' ' + 
               date.getHours().toString().padStart(2, '0') + ':' + 
               date.getMinutes().toString().padStart(2, '0');
      } catch (e) {
        return '格式错误';
      }
    }
  }
};
</script>

<style lang="scss" scoped>
/* 页面容器 */
.feedback-container {
  min-height: 100vh;
  background-color: $uni-bg-color-grey;
  display: flex;
  flex-direction: column;
  padding: 24rpx 0 40rpx;
}

/* 表单卡片 */
.form-container {
  padding: 32rpx 28rpx;
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-card;
  margin: 0 24rpx 24rpx;
  box-shadow: $uni-shadow-card;
}

/* 表单项 */
.form-item {
  margin-bottom: 30rpx;
  position: relative;
}

/* 表单标签 */
.form-label {
  font-size: $uni-font-size-md;
  color: $uni-text-color;
  font-weight: 600;
  margin-bottom: 20rpx;
  display: block;
}

/* 文本域 */
.form-textarea {
  width: 100%;
  height: 300rpx;
  background-color: $uni-bg-color-section;
  border-radius: $uni-radius-md;
  padding: 24rpx;
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  box-sizing: border-box;
  line-height: 1.6;
  border: 2rpx solid transparent;
  transition: border-color 0.15s, background-color 0.15s;

  &:focus {
    border-color: $uni-color-primary;
    background-color: $uni-bg-color;
  }
}

/* 字数计数器 */
.textarea-counter {
  position: absolute;
  right: 24rpx;
  bottom: 20rpx;
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
}

/* 提交按钮 */
.submit-btn {
  height: 92rpx;
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  border-radius: $uni-border-radius-btn;
  font-size: $uni-font-size-lg;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20rpx;
  box-shadow: $uni-shadow-btn;
  border: none;

  &::after {
    border: none;
  }

  &:active {
    background-color: $uni-color-primary-deep;
    transform: scale(0.99);
  }
}

/* 注销账号按钮（危险描边） */
.delete-account-btn {
  height: 92rpx;
  background: $uni-bg-color;
  color: $uni-color-error;
  border: 2rpx solid rgba($uni-color-error, 0.4);
  border-radius: $uni-border-radius-btn;
  font-size: $uni-font-size-base;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 24rpx;

  &::after {
    border: none;
  }

  &:active {
    background-color: $uni-color-error-soft;
  }
}

/* ===== 历史记录 ===== */
.history-container {
  margin: 0 24rpx;
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-card;
  overflow: hidden;
  box-shadow: $uni-shadow-card;
}

/* 历史标题（区块头风格） */
.history-title {
  padding: 28rpx 28rpx 20rpx;
  font-size: $uni-font-size-md;
  color: $uni-text-color;
  font-weight: 600;
  border-bottom: 1rpx solid $uni-border-color-split;
}

/* 历史记录列表 */
.history-list {
  padding: 0 28rpx;
}

/* 历史记录项 */
.history-item {
  padding: 28rpx 0;
  border-bottom: 1rpx solid $uni-border-color-split;

  &:last-child {
    border-bottom: none;
  }
}

/* 反馈内容 */
.history-content {
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  line-height: 1.6;
  margin-bottom: 14rpx;
  word-break: break-all;
}

/* 反馈时间 */
.history-time {
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
}

/* ===== 空/加载状态 ===== */
.empty-container {
  margin: 0 24rpx;
  padding: 80rpx 0;
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-card;
  box-shadow: $uni-shadow-card;
  display: flex;
  justify-content: center;
  align-items: center;
}

.empty-text {
  font-size: $uni-font-size-base;
  color: $uni-text-color-grey;
}

.loading-container {
  margin: 30rpx 24rpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-text {
  font-size: $uni-font-size-base;
  color: $uni-text-color-grey;
}

/* ===== 弹窗内元素（弹窗外壳见 common.scss .lf-popup） ===== */
.popup-message {
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  margin-bottom: 28rpx;
  line-height: 1.6;
}

/* 确认文本显示区 */
.confirm-text-display {
  background-color: $uni-color-error-soft;
  padding: 24rpx;
  border-radius: $uni-radius-md;
  font-size: $uni-font-size-md;
  color: $uni-color-error;
  font-weight: 600;
  margin-bottom: 20rpx;
  text-align: center;
  border: 2rpx dashed rgba($uni-color-error, 0.45);
}

/* 弹窗输入框 */
.form-input {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid transparent;
  border-radius: $uni-radius-md;
  padding: 0 24rpx;
  font-size: $uni-font-size-base;
  box-sizing: border-box;
  background-color: $uni-bg-color-section;
  transition: border-color 0.15s, background-color 0.15s;

  &:focus {
    border-color: $uni-color-primary;
    background-color: $uni-bg-color;
  }
}
</style>
