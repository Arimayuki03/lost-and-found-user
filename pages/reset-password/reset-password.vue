<template>
  <view class="reset-container lf-auth-page">
    <!-- 顶部背景与标题（三页共用组件） -->
    <lf-auth-header title="重置密码" />
    
    <!-- 重置密码表单 -->
    <view class="form-container">
      <!-- 邮箱输入 -->
      <view class="form-item">
        <text class="label">邮箱</text>
        <input 
          class="input" 
          type="text" 
          v-model="form.email" 
          placeholder="请输入注册邮箱" 
        />
      </view>
      
      <!-- 验证码输入 -->
      <view class="form-item">
        <text class="label">验证码</text>
        <view class="code-wrapper">
          <input 
            class="input code-input" 
            type="text" 
            v-model="form.code" 
            placeholder="请输入验证码" 
            maxlength="6"
          />
          <button 
            class="code-btn" 
            :disabled="codeBtnDisabled" 
            @tap="getVerificationCode"
          >
            {{ codeBtnText }}
          </button>
        </view>
      </view>
      
      <!-- 新密码输入（眼睛图标切换明文/密文） -->
      <view class="form-item">
        <text class="label">新密码</text>
        <view class="password-wrap">
          <input 
            class="input password-input" 
            :password="!showPassword" 
            v-model="form.new_password" 
            placeholder="请输入新密码"
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
      
      <!-- 确认密码输入 -->
      <view class="form-item">
        <text class="label">确认密码</text>
        <view class="password-wrap">
          <input 
            class="input password-input" 
            :password="!showConfirmPassword"
            v-model="form.confirm_password" 
            placeholder="请再次输入新密码"
          />
          <uni-icons 
            class="password-toggle" 
            :type="showConfirmPassword ? 'eye-slash' : 'eye'" 
            :size="22" 
            :color="colorGrey" 
            @click="toggleConfirmPasswordVisibility" 
          />
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-btn" @tap="handleResetPassword">重置密码</button>
      
      <!-- 返回登录按钮 -->
      <view class="actions">
        <text class="action-text" @tap="goToLogin">返回登录</text>
      </view>
    </view>
    
    <!-- 底部协议说明 -->
    <view class="footer">
      <text class="footer-text">重置密码即代表同意《用户协议》和《隐私政策》</text>
    </view>
  </view>
</template>

<script>
import { mapActions } from 'vuex';

import { COLOR_GREY, COLOR_SECONDARY } from '@/config/ui';
export default {
  /**
   * 组件数据
   */
  data() {
    return {
      colorGrey: COLOR_GREY, // 辅助图标灰（与 $uni-text-color-grey 同步）
      colorSecondary: COLOR_SECONDARY, // 更弱一级灰（箭头/占位图标）
      // 表单数据
      form: {
        email: '',
        code: '',
        new_password: '',
        confirm_password: ''
      },
      // 密码显示控制
      showPassword: false,
      showConfirmPassword: false,
      // 验证码按钮状态
      codeBtnText: '获取验证码',
      codeBtnDisabled: false,
      countdown: 60
    };
  },

  methods: {
    // 映射Vuex Actions
    ...mapActions(['resetPassword']),

    /**
     * 切换密码显示/隐藏状态
     */
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    
    /**
     * 切换确认密码显示/隐藏状态
     */
    toggleConfirmPasswordVisibility() {
      this.showConfirmPassword = !this.showConfirmPassword;
    },
    
    /**
     * 获取邮箱验证码
     * 1. 验证邮箱格式
     * 2. 检查邮箱是否已注册
     * 3. 发送验证码并启动倒计时
     */
    async getVerificationCode() {
      // 检查邮箱是否为空
      if (!this.form.email) {
        uni.showToast({ title: '请输入邮箱', icon: 'none' });
        return;
      }
      
      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.form.email)) {
        uni.showToast({ title: '邮箱格式不正确', icon: 'none' });
        return;
      }
      
      // 检查邮箱是否已注册
      try {
        const emailResult = await this.$store.dispatch('checkEmail', this.form.email);
        if (!emailResult.exists) {
          uni.showToast({ title: '该邮箱未注册', icon: 'none' });
          return;
        }
      } catch (error) {
        this.emailTip = '验证失败，请重试';
        this.emailStatus = 'error';
        // 查重接口失败时中断发码流程，避免把验证码发给一个不可用的邮箱
        return;
      }
      
      // 启动倒计时
      this.startCountdown();
      
      // 调用获取验证码接口
      try {
        await this.$store.dispatch('getCode', this.form.email);
        uni.showToast({ title: '验证码已发送', icon: 'success' });
      } catch (error) {
        uni.showToast({
          title: (error && error.error) || '验证码发送失败',
          icon: 'none'
        });
        // 发送失败时重置按钮状态
        this.resetCountdown();
      }
    },
    
    /**
     * 启动验证码按钮倒计时
     */
    startCountdown() {
      this.codeBtnDisabled = true;
      this.countdown = 60;
      this.codeBtnText = `${this.countdown}秒后重新获取`;
      
      const timer = setInterval(() => {
        this.countdown--;
        this.codeBtnText = `${this.countdown}秒后重新获取`;
        
        if (this.countdown <= 0) {
          clearInterval(timer);
          this.resetCountdown();
        }
      }, 1000);
      
      // 保存定时器引用，以便在组件销毁时清除
      this.countdownTimer = timer;
    },
    
    /**
     * 重置验证码按钮状态
     */
    resetCountdown() {
      this.codeBtnDisabled = false;
      this.codeBtnText = '获取验证码';
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    },
    
    /**
     * 处理重置密码提交
     * 1. 验证表单完整性
     * 2. 验证密码一致性
     * 3. 提交重置请求
     */
    async handleResetPassword() {
      // 表单完整性验证
      const emptyFields = this.validateFormFields();
      if (emptyFields) return;

      // 密码长度验证（与注册页/后端保持一致的 8 位下限，后端要求 8-64 位）
      if (this.form.new_password.length < 8) {
        uni.showToast({ title: '密码长度至少8位', icon: 'none' });
        return;
      }

      // 密码一致性验证
      if (this.form.new_password !== this.form.confirm_password) {
        uni.showToast({ title: '两次输入的密码不一致', icon: 'none' });
        return;
      }
      
      // 显示加载提示
      uni.showLoading({ title: '提交中...', mask: true });
      
      try {
        // 构建请求数据
        const data = {
          email: this.form.email,
          new_password: this.form.new_password,
          code: this.form.code
        };
        
        // 提交重置请求
        await this.resetPassword(data);
        
        // 提示成功并跳转
        uni.hideLoading();
        uni.showToast({ title: '密码重置成功', icon: 'success' });
        
        // 延迟跳转到登录页面（重置密码页通常由登录页打开，返回上一页即登录页，
        // 避免 login→reset-password→login 的页面栈叠加）
        setTimeout(() => {
          const pages = getCurrentPages();
          if (pages.length > 1) {
            uni.navigateBack();
          } else {
            uni.reLaunch({ url: '/pages/login/login' });
          }
        }, 1500);
      } catch (error) {
        // 处理错误
        uni.hideLoading();
        uni.showToast({
          title: (error && error.error) || '密码重置失败，请稍后再试',
          icon: 'none'
        });
      }
    },
    
    /**
     * 验证表单字段
     * @returns {boolean} 是否有空字段
     */
    validateFormFields() {
      const fields = [
        { value: this.form.email, message: '请输入邮箱' },
        { value: this.form.code, message: '请输入验证码' },
        { value: this.form.new_password, message: '请输入新密码' },
        { value: this.form.confirm_password, message: '请确认新密码' }
      ];
      
      for (const field of fields) {
        if (!field.value) {
          uni.showToast({ title: field.message, icon: 'none' });
          return true;
        }
      }
      
      return false;
    },
    
    /**
     * 跳转到登录页面
     */
    goToLogin() {
      uni.navigateTo({ url: '/pages/login/login' });
    }
  },
  
  /**
   * 页面卸载时清理资源
   * （uni-app Vue 3 页面没有 beforeDestroy 钩子，原先用 beforeDestroy 是无效清理，
   *  这里改用 uni-app 页面生命周期 onUnload）
   */
  onUnload() {
    // 清除可能未完成的倒计时
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }
};
</script>

<style lang="scss" scoped>
.reset-container {
  min-height: 100vh;
  background-color: $uni-bg-color-grey;
  display: flex;
  flex-direction: column;
  padding-bottom: 40rpx;
  box-sizing: border-box;
}

/* 表单容器/表单项/标签/输入框见 styles/common.scss（.lf-auth-page） */

/* 密码眼睛图标 */
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

.code-wrapper {
  display: flex;
  align-items: center;
}

.code-input {
  flex: 1;
}

.code-btn {
  width: 200rpx;
  height: 88rpx;
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  font-size: $uni-font-size-caption;
  border-radius: $uni-radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
  padding: 0;
  border: none;
  flex-shrink: 0;

  &::after {
    border: none;
  }
}

.code-btn[disabled] {
  background-color: $uni-bg-color-section;
  color: $uni-text-color-grey;
}

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

.actions {
  display: flex;
  justify-content: center;
  margin-top: 30rpx;
}

.action-text {
  font-size: $uni-font-size-base;
  color: $uni-color-primary;
}

.footer {
  margin-top: auto;
  padding: 40rpx;
  text-align: center;
}

.footer-text {
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
}
</style> 