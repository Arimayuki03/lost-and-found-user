<template>
  <view class="reset-container">
    <!-- 顶部背景与标题 -->
    <view class="top-bg" :style="{ paddingTop: statusBarHeight + 60 + 'rpx' }">
      <!-- 返回按钮 -->
      <view class="back-btn" :style="{ top: statusBarHeight + 20 + 'rpx' }" @tap="goBack">
        <text class="back-text">&lt;</text>
      </view>
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="title">重置密码</text>
    </view>
    
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
      
      <!-- 新密码输入 -->
      <view class="form-item">
        <text class="label">新密码</text>
        <input 
          :type="showPassword ? 'text' : 'password'" 
          class="input" 
          v-model="form.new_password" 
          placeholder="请输入新密码"
        />
        <text class="password-toggle" @tap="togglePasswordVisibility">
          {{ showPassword ? '隐藏' : '显示' }}
        </text>
      </view>
      
      <!-- 确认密码输入 -->
      <view class="form-item">
        <text class="label">确认密码</text>
        <input 
          :type="showConfirmPassword ? 'text' : 'password'"
          class="input" 
          v-model="form.confirm_password" 
          placeholder="请再次输入新密码"
        />
        <text class="password-toggle" @tap="toggleConfirmPasswordVisibility">
          {{ showConfirmPassword ? '隐藏' : '显示' }}
        </text>
      </view>
      
      <!-- 提交按钮 -->
      <button class="reset-btn" @tap="handleResetPassword">重置密码</button>
      
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

export default {
  /**
   * 组件数据
   */
  data() {
    return {
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
      // 状态栏高度
      statusBarHeight: 20,
      // 验证码按钮状态
      codeBtnText: '获取验证码',
      codeBtnDisabled: false,
      countdown: 60
    };
  },
  
  /**
   * 生命周期钩子 - 页面加载
   */
  onLoad() {
    // 获取系统状态栏高度以适配不同设备
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
  },
  
  methods: {
    // 映射Vuex Actions
    ...mapActions(['resetPassword']),
    
    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack();
    },
    
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

      // 密码长度验证（与注册页保持一致的 6 位下限）
      if (this.form.new_password.length < 6) {
        uni.showToast({ title: '密码长度至少为6位', icon: 'none' });
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

<style lang="scss">
.reset-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  padding-bottom: 40rpx;
  box-sizing: border-box;
}

.top-bg {
  height: auto;
  min-height: 200rpx;
  padding-bottom: 30rpx;
  background: linear-gradient(to right, #007AFF, #5AC8FA);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
  position: relative;
  margin-bottom: 40rpx;
}

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

.back-text {
  font-size: 40rpx;
  color: #fff;
  font-weight: bold;
  line-height: 1;
}

.logo {
  width: 100rpx;
  height: 100rpx;
  margin-bottom: 15rpx;
}

.title {
  font-size: 36rpx;
  color: #fff;
  font-weight: bold;
}

.form-container {
  margin: 0 40rpx;
  padding: 40rpx;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.form-item {
  margin-bottom: 30rpx;
  position: relative;
}

.label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}

.input {
  height: 90rpx;
  border-bottom: 1px solid #e5e5e5;
  font-size: 30rpx;
  color: #333;
}

.password-toggle {
  position: absolute;
  right: 0;
  bottom: 30rpx;
  font-size: 28rpx;
  color: #007AFF;
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
  height: 60rpx;
  background-color: #007AFF;
  color: #fff;
  font-size: 24rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
  padding: 0;
}

.code-btn[disabled] {
  background-color: #ccc;
  color: #fff;
}

.reset-btn {
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

.actions {
  display: flex;
  justify-content: center;
  margin-top: 30rpx;
}

.action-text {
  font-size: 28rpx;
  color: #007AFF;
}

.footer {
  margin-top: auto;
  padding: 40rpx;
  text-align: center;
}

.footer-text {
  font-size: 24rpx;
  color: #999;
}
</style> 