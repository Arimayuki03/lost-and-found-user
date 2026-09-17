<template>
  <view class="login-container lf-auth-page">
    <!-- 顶部背景（三页共用组件） -->
    <lf-auth-header title="校园失物招领" subtitle="登录后可发布与联系" />
    
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
      
      <!-- 密码输入框（眼睛图标切换明文/密文） -->
      <view class="form-item">
        <text class="label">密码</text>
        <view class="password-wrap">
          <input 
            class="input password-input" 
            :password="!showPassword"
            v-model="form.password" 
            placeholder="请输入密码"
          />
          <uni-icons 
            class="password-toggle" 
            :type="showPassword ? 'eye-slash' : 'eye'" 
            :size="22" 
            :color="colorGrey" 
            @click="togglePasswordVisibility" 
          />
        </view>
      </view>
      
      <!-- 登录按钮 -->
      <button class="submit-btn" @tap="handleLogin">登录</button>
      
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

import { COLOR_GREY, COLOR_SECONDARY } from '@/config/ui';
/**
 * 用户登录组件
 * 处理用户认证流程
 */
export default {
  data() {
    return {
      colorGrey: COLOR_GREY, // 辅助图标灰（与 $uni-text-color-grey 同步）
      colorSecondary: COLOR_SECONDARY, // 更弱一级灰（箭头/占位图标）
      // 表单数据
      form: {
        student_id: '', // 学号
        password: '' // 密码
      },
      showPassword: false // 是否显示密码明文
    };
  },
  
  methods: {
    // 导入Vuex actions
    ...mapActions(['login']),
    
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
        // 登录失败（api 层 401 时 reject 的是响应体本身；后端登录接口用 message 字段，其余接口用 error 字段，两者都兼容）
        uni.hideLoading();
        uni.showToast({
          title: (error && (error.error || error.message)) || '登录失败，请稍后再试',
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

<style lang="scss" scoped>
/* 登录页容器 */
.login-container {
  min-height: 100vh;
  background-color: $uni-bg-color-grey;
  display: flex;
  flex-direction: column;
  padding-bottom: 40rpx;
  box-sizing: border-box;
}

/* 密码输入行 */
.password-wrap {
  position: relative;
}

.password-input {
  padding-right: 80rpx;
}

.password-toggle {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
}

/* 登录按钮 */
.submit-btn {
  height: 92rpx;
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  border-radius: $uni-border-radius-btn;
  font-size: $uni-font-size-lg;
  font-weight: 500;
  margin-top: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
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

/* 辅助操作区域 */
.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30rpx;
}

/* 辅助操作文本 */
.action-text {
  font-size: $uni-font-size-base;
  color: $uni-color-primary;
}

/* 页脚区域 */
.footer {
  margin-top: auto;
  padding: 40rpx;
  text-align: center;
}

/* 页脚文本 */
.footer-text {
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
}
</style>
