<template>
  <view class="chat-list-container lf-login-guide">
    <!-- 导航栏占位 -->
    <view class="nav-placeholder" :style="navPlaceholderStyle"></view>
    
    <!-- 未登录状态 -->
    <view v-if="!isLoggedIn" class="login-section">
      <image class="login-image" src="/static/logo.png" mode="aspectFit"></image>
      <text class="login-tips">登录后查看消息</text>
      <view class="login-btns">
        <button class="btn login-btn" @tap="goToLogin">登录</button>
        <button class="btn register-btn" @tap="goToRegister">注册</button>
      </view>
    </view>
    
    <!-- 已登录状态 -->
    <block v-else>
      <!-- 首屏骨架屏 -->
      <view class="chat-list" v-if="!firstLoaded">
        <view class="chat-card">
          <view class="chat-item skeleton-item" v-for="i in 5" :key="i">
            <view class="skeleton-block chat-avatar"></view>
            <view class="chat-content">
              <view class="skeleton-block skeleton-name-line"></view>
              <view class="skeleton-block skeleton-preview-line"></view>
            </view>
          </view>
        </view>
      </view>
      <!-- 消息列表 -->
      <scroll-view class="chat-list" scroll-y v-else-if="sortedContacts.length > 0" :style="{ paddingBottom: safeAreaBottomHeight + 'px' }">
        <view class="chat-card">
          <view 
            class="chat-item" 
            v-for="(item, index) in sortedContacts" 
            :key="index"
            @tap="goToChat(item.id)"
            :class="{'has-unread': rowUnread(item) > 0}"
          >
            <view class="chat-badge" v-if="rowUnread(item) > 0">
              <text class="badge-text">{{ rowUnread(item) > 99 ? '99+' : rowUnread(item) }}</text>
            </view>
            <image class="chat-avatar" :src="item.avatar_url || '/static/default-avatar.png'" mode="aspectFill"></image>
            <view class="chat-content">
              <view class="chat-row-top">
                <text class="chat-name">{{ item.name }}</text>
                <text class="chat-time">{{ relativeTime(item.last_message_time) }}</text>
              </view>
              <text class="chat-preview">{{ previewText(item) }}</text>
            </view>
          </view>
        </view>
        
        <!-- 底部安全区域 -->
        <view class="bottom-safe-area"></view>
      </scroll-view>
      
      <!-- 空状态 -->
      <lf-empty v-else-if="sortedContacts.length === 0" type="message" text="暂无聊天记录" />
    </block>
  </view>
</template>

<script>
import { mapState } from 'vuex';
import { checkLogin, goToLogin, updateMessageBadge, relativeTime } from '../../utils/common';

export default {
  data() {
    return {
      chatContacts: [],
      unreadCounts: {},
      loading: false,
      firstLoaded: false, // 首屏是否已加载完成（未完成时显示骨架屏）
      isLoggedIn: false,
      statusBarHeight: 0, // 状态栏高度
      navBarHeight: 44,    // 导航栏高度（默认）
      safeAreaBottomHeight: 34 // 底部安全区域高度（默认值，会根据机型调整）
    };
  },
  
  computed: {
    ...mapState({
      currentUser: state => state.userInfo
    }),
    
    // 计算导航占位符的高度样式
    navPlaceholderStyle() {
      return `height: ${this.statusBarHeight + this.navBarHeight}px;`;
    },
    
    // 按照未读消息和时间排序的联系人列表
    sortedContacts() {
      if (!Array.isArray(this.chatContacts) || this.chatContacts.length === 0) return [];
      
      return [...this.chatContacts].sort((a, b) => {
        // 优先显示有未读消息的联系人
        const aHasUnread = this.rowUnread(a) > 0;
        const bHasUnread = this.rowUnread(b) > 0;
        
        if (aHasUnread && !bHasUnread) return -1;
        if (!aHasUnread && bHasUnread) return 1;
        
        // 如果未读状态相同，则按最后消息时间排序
        const aTime = a.last_message_time ? new Date(a.last_message_time).getTime() : 0;
        const bTime = b.last_message_time ? new Date(b.last_message_time).getTime() : 0;
        
        return bTime - aTime; // 降序排列，最新的在前
      });
    }
  },
  
  onLoad() {
    // 获取状态栏高度和底部安全区域高度
    this.getSystemInfo();
    
    // 检查登录状态
    this.isLoggedIn = checkLogin();
    
    if (this.isLoggedIn) {
      // 加载联系人和未读消息数量
      this.loadData();
    }
  },
  
  onShow() {
    // 检查登录状态
    this.isLoggedIn = checkLogin();
    
    // 每次显示页面时重新加载数据
    if (this.isLoggedIn) {
      this.loadData();
    }
  },
  
  // 添加 activated 钩子，处理滚动位置
  activated() {
    // 重置滚动位置并添加安全检查
    this.$nextTick(() => {
      const scrollView = uni.createSelectorQuery().in(this).select('.chat-list');
      if (scrollView) {
        scrollView.boundingClientRect(data => {
          if (data && data.node) {
            data.node.scrollTop = 0;
          }
        }).exec();
      }
    });
  },
  
  methods: {
    /**
     * 行未读数：优先用 contacts 接口返回的 unread_count，
     * 兼容回退到 unread_by_sender 映射
     */
    rowUnread(item) {
      if (typeof item.unread_count === 'number') return item.unread_count;
      return (this.unreadCounts[item.id] && this.unreadCounts[item.id] > 0) ? this.unreadCounts[item.id] : 0;
    },
    
    /**
     * 会话摘要：自己发的加"我: "前缀，单行截断由样式负责
     */
    previewText(item) {
      if (!item.last_message) return '暂无消息';
      const mine = this.currentUser && item.last_message_sender_id === this.currentUser.id;
      return mine ? `我: ${item.last_message}` : item.last_message;
    },
    
    /**
     * 相对时间（刚刚/x分钟前/x小时前/x天前/x个月前/x年前）
     */
    relativeTime(time) {
      return relativeTime(time);
    },
    
    // 获取系统信息（状态栏高度和底部安全区域）
    getSystemInfo() {
      try {
        const systemInfo = uni.getSystemInfoSync();
        if (systemInfo) {
          // 获取状态栏高度
          this.statusBarHeight = systemInfo.statusBarHeight || 25;
          
          // 对于iOS，获取导航栏高度
          if (systemInfo.platform === 'ios') {
            this.navBarHeight = 44;
            
            // iOS获取底部安全区域高度，处理iPhone X以上机型的底部区域
            if (systemInfo.safeAreaInsets) {
              this.safeAreaBottomHeight = systemInfo.safeAreaInsets.bottom || 34;
            }
          } else {
            // 安卓等其他平台
            this.navBarHeight = 48;
            this.safeAreaBottomHeight = 20; // 安卓设备底部留出一定空间
          }
        }
      } catch (e) {
        // 出错使用默认值
      }
    },
    
    // 跳转到登录页面
    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    },
    
    // 跳转到注册页面
    goToRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      });
    },
    
    // 设置加载状态（首屏用骨架屏占位，不弹 loading；二次加载才弹窗）
    setLoading(status) {
      this.loading = status;
      if (this.firstLoaded) {
        if (status) {
          uni.showLoading({ title: '加载中...' });
        } else {
          uni.hideLoading();
        }
      }
      if (!status) this.firstLoaded = true;
    },
    
    // 处理错误
    handleError(message) {
      uni.showToast({
        title: message,
        icon: 'none'
      });
    },
    
    // 加载数据
    async loadData() {
      if (this.loading) return;
      
      this.setLoading(true);
      
      try {
        // 获取聊天联系人列表（含最后一条消息、时间与未读数）
        const contactsRes = await this.$api.message.getChatContacts();
        this.chatContacts = Array.isArray(contactsRes) ? contactsRes : []; // 确保是一个数组
        // 如果联系人列表中没有头像信息，则补充获取
        if (contactsRes && Array.isArray(contactsRes) && contactsRes.length > 0) {
          // 为每个联系人补充完整信息
          const enhancedContacts = await Promise.all(
            contactsRes.map(async (contact) => {
              // 如果联系人缺少头像则尝试获取完整信息
              let enhancedContact = { ...contact };
              
              if (!contact.avatar_url) {
                try {
                  const userInfo = await this.$api.user.getUserById(contact.id);
                  if (userInfo && userInfo.avatar_url) {
                    enhancedContact.avatar_url = userInfo.avatar_url;
                  }
                } catch (err) {
                  // 单个联系人头像获取失败时仅使用默认头像，
                  // 不能误清空整个联系人列表
                }
              }
              
              return enhancedContact;
            })
          );
          
          this.chatContacts = enhancedContacts || [];
        } else {
          this.chatContacts = contactsRes || [];
        }
        
        // 获取未读消息数量（用于底部 tab 总角标与旧字段兼容）
        const unreadRes = await this.$api.message.getUnreadCount();
        // 加空值保护，接口异常返回时避免 TypeError 落入 catch 误报"加载失败"
        this.unreadCounts = (unreadRes && unreadRes.unread_by_sender) || {};
        // 同步底部"消息"tab 的未读总角标
        updateMessageBadge((unreadRes && unreadRes.total_unread) || 0);
      } catch (error) {
        this.handleError('加载失败，请稍后再试');
      } finally {
        this.setLoading(false);
      }
    },
    
    // 跳转到聊天页面
    goToChat(userId) {
      // 检查登录状态
      if (!this.isLoggedIn) {
        this.handleError('请先登录');
        setTimeout(() => {
          this.goToLogin();
        }, 1500);
        return;
      }
      
      // 跳转到聊天页面
      uni.navigateTo({
        url: `/pages/chat/chat?user_id=${userId}`
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.chat-list-container {
  padding: 0;
  height: 100vh;
  background-color: $uni-bg-color-grey;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  position: fixed; /* 固定定位防止页面移动 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

/* 导航栏占位 */
.nav-placeholder {
  width: 100%;
  flex-shrink: 0;
  margin-bottom: -50rpx; /* 添加负边距，减小与列表的距离 */
}

/* 未登录引导块样式见 styles/common.scss（.lf-login-guide） */

.chat-list {
  flex: 1;
  padding: 8rpx 24rpx 60rpx;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  position: relative;
  transform: translateZ(0);
  margin-top: 0;
  backface-visibility: hidden;
  width: 100%;
  box-sizing: border-box;
}

/* 分组白卡：会话行以分隔线相连，替代原先逐行浮卡 */
.chat-card {
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-card;
  box-shadow: $uni-shadow-card;
  overflow: hidden;
}

.chat-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 26rpx 28rpx;
  background-color: $uni-bg-color;
  transition: background-color 0.15s;

  & + .chat-item {
    border-top: 1rpx solid $uni-border-color-split;
  }

  &:active {
    background-color: $uni-bg-color-hover;
  }
}

/* 未读角标：贴在头像右上角 */
.chat-badge {
  position: absolute;
  top: 18rpx;
  left: 96rpx;
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 10rpx;
  background-color: $uni-color-error;
  border-radius: 18rpx;
  border: 2rpx solid $uni-bg-color;
  box-sizing: content-box;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.badge-text {
  color: $uni-text-color-inverse;
  font-size: 20rpx;
  line-height: 1;
}

.chat-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  margin-right: 24rpx;
  background-color: $uni-bg-color-section;
  flex-shrink: 0;
}

/* 姓名 + 摘要两行结构（IM 惯例） */
.chat-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.chat-row-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-name {
  font-size: $uni-font-size-lg;
  font-weight: 500;
  color: $uni-text-color;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-time {
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.chat-preview {
  font-size: $uni-font-size-sm;
  color: $uni-text-color-grey;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 骨架屏 */
.skeleton-item {
  pointer-events: none;
}

.skeleton-name-line {
  width: 40%;
  height: 32rpx;
  margin-bottom: 14rpx;
}

.skeleton-preview-line {
  width: 70%;
  height: 26rpx;
}

/* 底部安全区域 */
.bottom-safe-area {
  height: 60rpx;
  width: 100%;
  flex-shrink: 0;
}
</style>
