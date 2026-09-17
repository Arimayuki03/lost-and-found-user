<template>
  <view class="register-container lf-auth-page">
    <!-- 滚动容器（hero 须在 scroll-view 内：表单卡片 -60rpx 上叠，放外面会被滚动视口裁掉卡片顶部） -->
    <scroll-view scroll-y class="scroll-container">
      <!-- 顶部导航栏（三页共用组件，补 logo） -->
      <lf-auth-header title="注册账号" />

      <!-- 注册表单 -->
      <view class="form-container">
        <!-- 头像上传区域 -->
        <view class="avatar-upload">
          <image 
            class="avatar-preview" 
            :src="form.avatar_url || '/static/default-avatar.png'" 
            mode="aspectFill"
          />
          <button class="upload-btn" @tap="chooseAvatar">选择头像</button>
        </view>
        
        <!-- 表单字段 -->
        <view class="form-item">
          <text class="label">姓名</text>
          <input 
            class="input" 
            type="text" 
            v-model="form.name" 
            placeholder="请输入真实姓名" 
            maxlength="30"
          />
        </view>
        
        <view class="form-item">
          <text class="label">学号</text>
          <input 
            class="input" 
            type="text" 
            v-model="form.student_id" 
            placeholder="请输入学号(12位)" 
            maxlength="12"
            @blur="checkStudentIdExists"
          />
        </view>
        
        <view class="form-item">
          <text class="label">邮箱</text>
          <input 
            class="input" 
            type="text" 
            v-model="form.email" 
            placeholder="请输入邮箱" 
            @blur="checkEmailExists"
          />
        </view>
        
        <!-- 验证码输入区域 -->
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
        
        <!-- 密码输入区域（眼睛图标切换明文/密文） -->
        <view class="form-item">
          <text class="label">密码</text>
          <view class="password-wrap">
            <input 
              class="input password-input" 
              :password="!showPassword"
              v-model="form.password" 
              placeholder="请设置密码(最少8位)"
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
        
        <view class="form-item">
          <text class="label">确认密码</text>
          <view class="password-wrap">
            <input 
              class="input password-input" 
              :password="!showConfirmPassword"
              v-model="form.confirmPassword" 
              placeholder="请再次输入密码"
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
        <button class="submit-btn" @tap="handleRegister">注册</button>
        
        <!-- 其他操作 -->
        <view class="actions">
          <text class="action-text" @tap="goToLogin">已有账号，去登录</text>
        </view>
      </view>
      
      <!-- 底部协议说明 -->
      <view class="footer">
        <text class="footer-text">注册即代表同意《用户协议》和《隐私政策》</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { mapActions } from 'vuex';
import { BASE_URL } from '@/config';

import { COLOR_GREY, COLOR_SECONDARY } from '@/config/ui';
export default {
  data() {
    return {
      colorGrey: COLOR_GREY, // 辅助图标灰（与 $uni-text-color-grey 同步）
      colorSecondary: COLOR_SECONDARY, // 更弱一级灰（箭头/占位图标）
      // 表单数据
      form: {
        name: '',
        student_id: '',
        email: '',
        code: '',
        password: '',
        confirmPassword: '',
        avatar_url: ''
      },
      // UI状态
      showPassword: false,
      showConfirmPassword: false,
      codeBtnText: '获取验证码',
      codeBtnDisabled: false,
      countdown: 60,
      // 查重/验证码状态提示
      studentIdStatus: '',
      studentIdTip: '',
      emailStatus: '',
      emailTip: '',
      verificationStatus: '',
      verificationTip: ''
    };
  },

  onUnload() {
    // 页面卸载时清理验证码倒计时定时器
    if (this._codeTimer) {
      clearInterval(this._codeTimer);
      this._codeTimer = null;
    }
  },
  
  methods: {
    // 从Vuex映射注册动作
    ...mapActions(['register']),

    /**
     * 检查学号是否已被注册
     * 仅在学号符合12位数字格式时进行检查
     */
    async checkStudentIdExists() {
      if (!this.form.student_id || !/^\d{12}$/.test(this.form.student_id)) {
        return;
      }
      
      try {
        const result = await this.$api.user.checkStudentId(this.form.student_id);
        this.studentIdStatus = result.exists ? 'error' : 'success';
        this.studentIdTip = result.exists ? '该学号已被注册' : '该学号可以使用';
      } catch (error) {
        this.studentIdStatus = 'error';
        this.studentIdTip = '验证失败，请重试';
      }
    },
    
    /**
     * 检查邮箱是否已被注册
     * 仅在邮箱格式正确时进行检查
     */
    async checkEmailExists() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.form.email || !emailRegex.test(this.form.email)) {
        return;
      }
      
      try {
        const result = await this.$api.user.checkEmail(this.form.email);
        this.emailStatus = result.exists ? 'error' : 'success';
        this.emailTip = result.exists ? '该邮箱已被注册' : '该邮箱可以使用';
      } catch (error) {
        this.emailStatus = 'error';
        this.emailTip = '验证失败，请重试';
      }
    },
    
    // 密码显示切换
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword;
    },
    
    // 确认密码显示切换
    toggleConfirmPasswordVisibility() {
      this.showConfirmPassword = !this.showConfirmPassword;
    },
    
    /**
     * 选择并上传头像
     * 支持从相册或相机选择图片，并上传到服务器
     * 包含不良行为识别功能
     */
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          
          uni.showLoading({
            title: '上传中...',
            mask: true
          });
          
          // 先上传图片（注册前无登录态，走专用匿名头像上传接口，后端按 IP 限流）
          uni.uploadFile({
            url: `${BASE_URL}/common/images/upload-avatar`,
            filePath: tempFilePath,
            name: 'file',
            success: async (uploadRes) => {
              try {
                const data = JSON.parse(uploadRes.data);
                
                if (!data.file_url) {
                  throw new Error('上传失败');
                }
                
                // 进行不良行为识别
                uni.hideLoading(); // 与上方"上传中"配对，避免 showLoading 嵌套告警
                uni.showLoading({
                  title: '正在识别...',
                  mask: true
                });
                
                const checkRes = await uni.request({
                  url: `${BASE_URL}/common/images/inappropriate-content`,
                  method: 'POST',
                  data: {
                    image_url: data.file_url
                  }
                });
                
                if (checkRes.statusCode === 200) {
                  const checkData = checkRes.data;
                  // 检查识别结果
                  if (checkData.Type === '正常') {
                    // 识别通过，设置头像
                    this.form.avatar_url = data.file_url;
                    uni.showToast({
                      title: '头像上传成功',
                      icon: 'success'
                    });
                  } else {
                    // 识别不通过
                    uni.showToast({
                      title: '图片内容不合规，请重新选择',
                      icon: 'none'
                    });
                  }
                } else {
                  throw new Error('识别失败');
                }
              } catch (error) {
                uni.showToast({
                  title: error.message || '上传失败，请重试',
                  icon: 'none'
                });
              } finally {
                uni.hideLoading();
              }
            },
            fail: () => {
              uni.hideLoading();
              uni.showToast({
                title: '上传失败，请重试',
                icon: 'none'
              });
            }
          });
        }
      });
    },
    
    /**
     * 获取邮箱验证码
     * 验证邮箱格式，倒计时防止频繁请求
     */
    async getVerificationCode() {
      // 邮箱输入验证
      if (!this.form.email) {
        uni.showToast({ title: '请输入邮箱', icon: 'none' });
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.form.email)) {
        uni.showToast({ title: '邮箱格式不正确', icon: 'none' });
        return;
      }
      
      // 检查邮箱是否已存在
      try {
        const emailResult = await this.$api.user.checkEmail(this.form.email);
        if (emailResult.exists) {
          uni.showToast({ title: '该邮箱已被注册', icon: 'none' });
          return;
        }
      } catch (error) {
        // 查重接口异常时中断发码流程，避免把验证码发给一个不可用的邮箱
        uni.showToast({ title: '邮箱查重失败，请稍后再试', icon: 'none' });
        return;
      }

      // 开始倒计时
      this.codeBtnDisabled = true;
      this.countdown = 60;
      this.codeBtnText = `${this.countdown}秒后重新获取`;

      // 先清理可能残留的旧定时器
      if (this._codeTimer) {
        clearInterval(this._codeTimer);
        this._codeTimer = null;
      }

      this._codeTimer = setInterval(() => {
        this.countdown--;
        this.codeBtnText = `${this.countdown}秒后重新获取`;

        if (this.countdown <= 0) {
          clearInterval(this._codeTimer);
          this._codeTimer = null;
          this.countdown = 0;
          this.codeBtnDisabled = false;
          this.codeBtnText = '获取验证码';
        }
      }, 1000);

      try {
        await this.$api.user.getCode(this.form.email);
        this.verificationStatus = 'success';
        this.verificationTip = '验证码已发送';
      } catch (error) {
        this.verificationStatus = 'error';
        this.verificationTip = '验证码发送失败';

        // 发送失败时重置按钮
        clearInterval(this._codeTimer);
        this._codeTimer = null;
        this.countdown = 0;
        this.codeBtnDisabled = false;
        this.codeBtnText = '获取验证码';
      }
    },
    
    /**
     * 处理注册提交
     * 表单验证，数据提交，结果处理
     */
    async handleRegister() {
      // 表单验证
      if (!this.validateForm()) {
        return;
      }
      
      // 显示加载
      uni.showLoading({
        title: '注册中...',
        mask: true
      });
      
      try {
        // 调用注册接口
        const registerData = {
          name: this.form.name,
          student_id: this.form.student_id,
          email: this.form.email,
          code: this.form.code,
          password: this.form.password,
          avatar_url: this.form.avatar_url
        };
        
        await this.register(registerData);
        
        // 注册成功
        uni.hideLoading();
        uni.showToast({
          title: '注册成功',
          icon: 'success'
        });
        
        // 跳转到登录页（注册页本身由登录页 navigateTo 打开，返回上一页即登录页，
        // 避免 login→register→login 的页面栈叠加）
        setTimeout(() => {
          const pages = getCurrentPages();
          if (pages.length > 1) {
            uni.navigateBack();
          } else {
            uni.reLaunch({
              url: '/pages/login/login'
            });
          }
        }, 1500);
      } catch (error) {
        // 注册失败
        uni.hideLoading();
        uni.showToast({
          title: (error && error.error) || '注册失败，请稍后再试',
          icon: 'none'
        });
      }
    },
    
    /**
     * 表单验证
     * 验证各字段是否符合要求
     * @return {Boolean} 验证结果
     */
    validateForm() {
      // 验证头像
      if (!this.form.avatar_url) {
        uni.showToast({ title: '请上传头像', icon: 'none' });
        return false;
      }
      
      // 验证姓名
      if (!this.form.name) {
        uni.showToast({ title: '请输入姓名', icon: 'none' });
        return false;
      }
      
      // 验证学号
      if (!this.form.student_id) {
        uni.showToast({ title: '请输入学号', icon: 'none' });
        return false;
      }
      
      if (!/^\d{12}$/.test(this.form.student_id)) {
        uni.showToast({ title: '学号必须为12位数字', icon: 'none' });
        return false;
      }
      
      // 验证邮箱
      if (!this.form.email) {
        uni.showToast({ title: '请输入邮箱', icon: 'none' });
        return false;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.form.email)) {
        uni.showToast({ title: '邮箱格式不正确', icon: 'none' });
        return false;
      }
      
      // 验证验证码
      if (!this.form.code) {
        uni.showToast({ title: '请输入验证码', icon: 'none' });
        return false;
      }
      
      // 验证密码
      if (!this.form.password) {
        uni.showToast({ title: '请设置密码', icon: 'none' });
        return false;
      }
      
      if (this.form.password.length < 8) {
        uni.showToast({ title: '密码长度至少8位', icon: 'none' });
        return false;
      }
      
      if (this.form.password !== this.form.confirmPassword) {
        uni.showToast({ title: '两次输入的密码不一致', icon: 'none' });
        return false;
      }
      
      return true;
    },
    
    // 跳转到登录页面
    goToLogin() {
      // 注册页通常由登录页打开，直接返回避免页面栈叠加
      const pages = getCurrentPages();
      if (pages.length > 1) {
        uni.navigateBack();
      } else {
        uni.reLaunch({
          url: '/pages/login/login'
        });
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.register-container {
  min-height: 100vh;
  height: 100vh;
  background-color: $uni-bg-color-grey;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.scroll-container {
  flex: 1;
  min-height: 0; /* 允许 flex 子项收缩到剩余高度，滚动收在 scroll-view 内部，否则会撑破 100vh 容器露出底色 */
  padding: 0 0 40rpx;
}

/* 表单容器/表单项/标签/输入框见 styles/common.scss（.lf-auth-page） */

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

.submit-btn {
  height: 92rpx;
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  border-radius: $uni-border-radius-btn;
  font-size: $uni-font-size-lg;
  font-weight: 500;
  margin-top: 40rpx;
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
  margin-top: 20rpx;
}

.action-text {
  font-size: 28rpx;
  color: $uni-color-primary;
}

.footer {
  margin: 30rpx 40rpx 0;
  padding: 20rpx 0;
  text-align: center;
}

.footer-text {
  font-size: 24rpx;
  color: $uni-text-color-grey;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 36rpx;
}

.avatar-preview {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  margin-bottom: 20rpx;
  border: 4rpx solid $uni-bg-color;
  background-color: $uni-bg-color-section;
  box-shadow: 0 4rpx 16rpx rgba(31, 41, 55, 0.12);
}

.upload-btn {
  width: 220rpx;
  height: 64rpx;
  background-color: $uni-color-primary-soft;
  color: $uni-color-primary;
  font-size: $uni-font-size-caption;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    border: none;
  }
}
</style> 