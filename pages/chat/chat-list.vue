<template>
  <view class="chat-list-container">
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
      <!-- 消息列表 -->
      <scroll-view class="chat-list" scroll-y v-if="sortedContacts.length > 0" :style="{ paddingBottom: safeAreaBottomHeight + 'px' }">
        <view 
          class="chat-item" 
          v-for="(item, index) in sortedContacts" 
          :key="index"
          @tap="goToChat(item.id)"
          :class="{'has-unread': unreadCounts[item.id] && unreadCounts[item.id] > 0}"
        >
          <view class="chat-badge" v-if="unreadCounts[item.id] && unreadCounts[item.id] > 0">
            <text class="badge-text">{{ unreadCounts[item.id] > 99 ? '99+' : unreadCounts[item.id] }}</text>
          </view>
          <image class="chat-avatar" :src="item.avatar_url || '/static/default-avatar.png'" mode="aspectFill"></image>
          <text class="chat-name">{{ item.name }}</text>
        </view>
        
        <!-- 底部安全区域 -->
        <view class="bottom-safe-area"></view>
      </scroll-view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-else>
        <image class="empty-image" src="/static/empty-message.png" mode="aspectFit"></image>
        <text class="empty-text">暂无聊天记录</text>
      </view>
    </block>
  </view>
</template>

<script>
import { mapState } from 'vuex';
import { checkLogin, goToLogin } from '../../utils/common';

export default {
  data() {
    return {
      chatContacts: [],
      unreadCounts: {},
      loading: false,
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
        const aHasUnread = this.unreadCounts[a.id] && this.unreadCounts[a.id] > 0;
        const bHasUnread = this.unreadCounts[b.id] && this.unreadCounts[b.id] > 0;
        
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
    
    // 设置加载状态
    setLoading(status) {
      this.loading = status;
      if (status) {
        uni.showLoading({ title: '加载中...' });
      } else {
        uni.hideLoading();
      }
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
        // 获取聊天联系人列表
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

              // 只需设置消息时间用于排序，不需要显示
              if (!contact.last_message_time) {
                enhancedContact.last_message_time = contact.updated_at || new Date().toISOString();
              }

              return enhancedContact;
            })
          );

          this.chatContacts = enhancedContacts || [];
        } else {
          this.chatContacts = contactsRes || [];
        }

        // 获取未读消息数量
        const unreadRes = await this.$api.message.getUnreadCount();
        // 加空值保护，接口异常返回时避免 TypeError 落入 catch 误报"加载失败"
        this.unreadCounts = (unreadRes && unreadRes.unread_by_sender) || {};
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

<style lang="scss">
.chat-list-container {
  padding: 0;
  height: 100vh;
  background-color: #f8f8f8;
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

.login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.login-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 40rpx;
}

.login-tips {
  font-size: 30rpx;
  color: #666;
  margin-bottom: 40rpx;
}

.login-btns {
  display: flex;
  justify-content: center;
  width: 500rpx;
  margin-top: 30rpx;
  gap: 40rpx;
}

.btn {
  width: 220rpx;
  height: 90rpx;
  font-size: 30rpx;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn {
  background: linear-gradient(to right, #007AFF, #5AC8FA);
  color: #fff;
  box-shadow: 0 5rpx 15rpx rgba(0, 122, 255, 0.3);
}

.register-btn {
  background-color: #fff;
  color: #007aff;
  border: 1px solid #007aff;
}

.chat-list {
  flex: 1;
  padding: 10rpx 20rpx 60rpx; /* 将顶部内边距从20rpx减小到10rpx */
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
  position: relative;
  transform: translateZ(0);
  margin-top: 0;
  backface-visibility: hidden;
  width: 100%;
  box-sizing: border-box;
}

.chat-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 20rpx;
  margin-bottom: 15rpx; /* 减小卡片间距从20rpx到15rpx */
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  transition: background-color 0.3s;
  transform: translateZ(0);
  will-change: transform;
  width: 100%;
  box-sizing: border-box;
  
  &.has-unread {
    background-color: rgba(0, 122, 255, 0.05);
  }
  
  /* 最后一个项目添加额外底部边距 */
  &:last-child {
    margin-bottom: 40rpx;
  }
  
  /* 第一个项目减少顶部边距 */
  &:first-child {
    margin-top: 0rpx;
  }
}

.chat-badge {
  position: absolute;
  top: 10rpx;
  left: 70rpx;
  min-width: 40rpx;
  height: 40rpx;
  padding: 0 10rpx;
  background-color: #ff3b30;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.badge-text {
  color: #fff;
  font-size: 24rpx;
}

.chat-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background-color: #f0f0f0;
  flex-shrink: 0;
}

.chat-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: calc(100% - 120rpx); /* 确保名称不会超出可用空间，留出头像的空间 */
  margin-right: 20rpx; /* 增加右边距，防止文字紧贴右边界 */
}

/* 底部安全区域 */
.bottom-safe-area {
  height: 60rpx;
  width: 100%;
  flex-shrink: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex: 1;
}

.empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 30rpx;
  color: #999;
}
</style> 