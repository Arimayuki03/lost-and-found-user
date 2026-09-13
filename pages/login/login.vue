<template>
  <view class="login-container">
    <!-- 顶部背景 -->
    <view class="top-bg" :style="{ paddingTop: statusBarHeight + 60 + 'rpx' }">
      <!-- 返回按钮 -->
      <view class="back-btn" :style="{ top: statusBarHeight + 20 + 'rpx' }" @tap="goBack">
        <text class="back-text">&lt;</text>
      </view>
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="title">校园失物招领</text>
    </view>
    
    <!-- 登录表单 -->
    <view class="form-container">
      <!-- 学号输入框 -->
      <view class="form-item">
        <text class="label">学号</text>
        <input 
          class="input" 
          type="text" 
          v-model="form.student_id" 
          placeholder="请输入学号" 
          maxlength="12"
        />
      </view>
      
      <!-- 密码输入框 -->
      <view class="form-item">
        <text class="label">密码</text>
        <input 
          v-if="showPassword"
          class="input" 
          type="text" 
          v-model="form.password" 
          placeholder="请输入密码"
        />
        <input 
          v-else
          class="input" 
          type="password" 
          v-model="form.password" 
          placeholder="请输入密码"
        />
        <text class="password-toggle" @tap="togglePasswordVisibility">
          {{ showPassword ? '隐藏' : '显示' }}
        </text>
      </view>
      
      <!-- 登录按钮 -->
      <button class="login-btn" @tap="handleLogin">登录</button>
      
      <!-- 辅助操作 -->
      <view class="actions">
        <text class="action-text" @tap="goToRegister">注册账号</text>
        <text class="action-text" @tap="goToResetPassword">忘记密码</text>
      </view>
    </view>
    
    <!-- 底部说明 -->
    <view class="footer">
      <text class="footer-text">登录即代表同意《用户协议》和《隐私政策》</text>
    </view>
  </view>
</template>

<script>
import { mapActions } from 'vuex';

/**
 * 用户登录组件
 * 处理用户认证流程
 */
export default {
  data() {
    return {
      // 表单数据
      form: {
        student_id: '', // 学号
        password: '' // 密码
      },
      showPassword: false, // 是否显示密码明文
      statusBarHeight: 20 // 状态栏高度，默认20
    };
  },
  
  /**
   * 页面加载时初始化
   */
  onLoad() {
    // 获取系统信息设置状态栏高度
    this.setStatusBarHeight();
  },
  
  methods: {
    // 导入Vuex actions
    ...mapActions(['login']),
    
    /**
     * 设置状态栏高度
     * 获取系统信息并调整UI布局
     */
    setStatusBarHeight() {
      try {
        const systemInfo = uni.getSystemInfoSync();
        this.statusBarHeight = systemInfo.statusBarHeight || 20;
      } catch (error) {
        // 获取失败时使用默认值
        this.statusBarHeight = 20;
      }
    },
    
    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack();
    },
    
    /**
     * 切换密码显示状态
     * 在明文和密文之间切换
     */
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    
    /**
     * 处理登录
     * 验证表单并调用登录接口
     */
    async handleLogin() {
      // 表单验证
      if (!this.validateForm()) {
        return;
      }
      
      // 显示加载
      uni.showLoading({
        title: '登录中...',
        mask: true
      });
      
      try {
        // 调用登录接口
        await this.login(this.form);
        
        // 登录成功
        uni.hideLoading();
        uni.showToast({
          title: '登录成功',
          icon: 'success'
        });
        
        // 跳转到首页
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/index/index'
          });
        }, 1500);
      } catch (error) {
        // 登录失败（api 层 401 时 reject 的是响应体本身，错误信息在 error.error）
        uni.hideLoading();
        uni.showToast({
          title: (error && error.error) || '登录失败，请稍后再试',
          icon: 'none'
        });
      }
    },
    
    /**
     * 验证表单
     * @return {Boolean} 验证结果
     */
    validateForm() {
      if (!this.form.student_id) {
        uni.showToast({
          title: '请输入学号',
          icon: 'none'
        });
        return false;
      }
      
      if (!this.form.password) {
        uni.showToast({
          title: '请输入密码',
          icon: 'none'
        });
        return false;
      }
      
      return true;
    },
    
    /**
     * 跳转到注册页面
     */
    goToRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      });
    },
    
    /**
     * 跳转到重置密码页面
     */
    goToResetPassword() {
      uni.navigateTo({
        url: '/pages/reset-password/reset-password'
      });
    }
  }
};
</script>

<style lang="scss">
/* 登录页容器 */
.login-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  padding-bottom: 40rpx;
  box-sizing: border-box;
}

/* 顶部背景区域 */
.top-bg {
  height: auto; /* 自适应高度 */
  min-height: 200rpx; /* 最小高度 */
  padding-bottom: 30rpx; /* 底部内边距 */
  background: linear-gradient(to right, #007AFF, #5AC8FA);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
  position: relative;
  margin-bottom: 40rpx; /* 底部外边距 */
}

/* 返回按钮 */
.back-btn {
  position: absolute;
  left: 30rpx;
  width: 60rpx;
  height: 60rpx;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

/* 返回按钮文本 */
.back-text {
  font-size: 40rpx;
  color: #fff;
  font-weight: bold;
  line-height: 1;
}

/* 应用logo */
.logo {
  width: 100rpx;
  height: 100rpx;
  margin-bottom: 15rpx;
}

/* 应用标题 */
.title {
  font-size: 36rpx;
  color: #fff;
  font-weight: bold;
}

/* 表单容器 */
.form-container {
  margin: 0 40rpx;
  padding: 40rpx;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  z-index: 1; /* 确保表单在顶部背景之上 */
}

/* 表单项 */
.form-item {
  margin-bottom: 30rpx;
  position: relative;
}

/* 表单标签 */
.label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}

/* 输入框 */
.input {
  height: 90rpx;
  border-bottom: 1px solid #e5e5e5;
  font-size: 30rpx;
  color: #333;
}

/* 密码显示切换按钮 */
.password-toggle {
  position: absolute;
  right: 0;
  bottom: 30rpx;
  font-size: 28rpx;
  color: #007AFF;
}

/* 登录按钮 */
.login-btn {
  height: 90rpx;
  background: linear-gradient(to right, #007AFF, #5AC8FA);
  color: #fff;
  border-radius: 45rpx;
  font-size: 32rpx;
  margin-top: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 辅助操作区域 */
.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30rpx;
}

/* 辅助操作文本 */
.action-text {
  font-size: 28rpx;
  color: #007AFF;
}

/* 页脚区域 */
.footer {
  margin-top: auto;
  padding: 40rpx;
  text-align: center;
}

/* 页脚文本 */
.footer-text {
  font-size: 24rpx;
  color: #999;
}
</style> 