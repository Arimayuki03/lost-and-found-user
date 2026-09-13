<template>
  <view class="register-container">
    <!-- 顶部导航栏 -->
    <view class="top-bg" :style="{ paddingTop: statusBarHeight + 60 + 'rpx' }">
      <view class="back-btn" :style="{ top: statusBarHeight + 20 + 'rpx' }" @tap="goBack">
        <text class="back-text">&lt;</text>
      </view>
      <text class="title">注册账号</text>
    </view>
    
    <!-- 滚动容器 -->
    <scroll-view scroll-y class="scroll-container">
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
        
        <!-- 密码输入区域 -->
        <view class="form-item">
          <text class="label">密码</text>
          <input 
            :type="showPassword ? 'text' : 'password'"
            class="input" 
            v-model="form.password" 
            placeholder="请设置密码(最少6位)"
          />
          <text class="password-toggle" @tap="togglePasswordVisibility">
            {{ showPassword ? '隐藏' : '显示' }}
          </text>
        </view>
        
        <view class="form-item">
          <text class="label">确认密码</text>
          <input 
            :type="showConfirmPassword ? 'text' : 'password'"
            class="input" 
            v-model="form.confirmPassword" 
            placeholder="请再次输入密码"
          />
          <text class="password-toggle" @tap="toggleConfirmPasswordVisibility">
            {{ showConfirmPassword ? '隐藏' : '显示' }}
          </text>
        </view>
        
        <!-- 提交按钮 -->
        <button class="register-btn" @tap="handleRegister">注册</button>
        
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

export default {
  data() {
    return {
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
      statusBarHeight: 20,
      // 查重/验证码状态提示
      studentIdStatus: '',
      studentIdTip: '',
      emailStatus: '',
      emailTip: '',
      verificationStatus: '',
      verificationTip: ''
    };
  },

  onLoad() {
    // 获取系统状态栏高度，用于适配不同设备
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
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
    
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
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
          
          // 先上传图片
          uni.uploadFile({
            url: `${BASE_URL}/common/images/upload`,
            filePath: tempFilePath,
            name: 'file',
            header: {
              'Authorization': 'Bearer ' + uni.getStorageSync('token')
            },
            success: async (uploadRes) => {
              try {
                const data = JSON.parse(uploadRes.data);
                
                if (!data.file_url) {
                  throw new Error('上传失败');
                }
                
                // 进行不良行为识别
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
      
      if (this.form.password.length < 6) {
        uni.showToast({ title: '密码长度至少为6位', icon: 'none' });
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

<style lang="scss">
.register-container {
  min-height: 100vh;
  height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.scroll-container {
  flex: 1;
  padding: 0 0 40rpx;
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

.title {
  font-size: 36rpx;
  color: #fff;
  font-weight: bold;
}

.form-container {
  margin: 0 40rpx;
  padding: 40rpx 40rpx 30rpx;
  background-color: #fff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.form-item {
  margin-bottom: 25rpx;
  position: relative;
}

.label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}

.input {
  height: 80rpx;
  border-bottom: 1px solid #e5e5e5;
  font-size: 30rpx;
  color: #333;
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

.password-toggle {
  position: absolute;
  right: 0;
  bottom: 30rpx;
  font-size: 28rpx;
  color: #007AFF;
}

.register-btn {
  height: 90rpx;
  background: linear-gradient(to right, #007AFF, #5AC8FA);
  color: #fff;
  border-radius: 45rpx;
  font-size: 32rpx;
  margin-top: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions {
  display: flex;
  justify-content: center;
  margin-top: 20rpx;
}

.action-text {
  font-size: 28rpx;
  color: #007AFF;
}

.footer {
  margin: 30rpx 40rpx 0;
  padding: 20rpx 0;
  text-align: center;
}

.footer-text {
  font-size: 24rpx;
  color: #999;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30rpx;
}

.avatar-preview {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  margin-bottom: 20rpx;
  border: 2px solid #e5e5e5;
  background-color: #f8f8f8;
}

.upload-btn {
  width: 200rpx;
  height: 60rpx;
  background-color: #007AFF;
  color: #fff;
  font-size: 24rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style> 