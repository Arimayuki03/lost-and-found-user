<template>
  <view class="my-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <image class="user-avatar" :src="userInfo?.avatar_url || '/static/logo.png'" mode="aspectFill" @tap="isLoggedIn && showAvatarOptions()"></image>
      <view class="user-info">
        <text class="user-name">{{ userInfo?.name || '未登录' }}</text>
        <text class="user-id">{{ userInfo?.student_id ? '学号：' + userInfo.student_id : '请登录以使用完整功能' }}</text>
      </view>
    </view>
    
    <!-- 未登录状态 -->
    <view v-if="!isLoggedIn" class="menu-section">
      <view class="menu-title">账号登录</view>
      <view class="menu-list">
        <view class="login-container">
          <view class="login-tips">登录后可使用更多功能</view>
          <view class="login-btns">
            <view class="btn-wrapper">
              <button class="btn login-btn" @tap="goToLogin">登录</button>
            </view>
            <view class="btn-wrapper">
              <button class="btn register-btn" @tap="goToRegister">注册</button>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 已登录状态 - 功能菜单 -->
    <block v-if="isLoggedIn">
      <!-- 用户详细信息 - 点击按钮显示 -->
      <view class="menu-section">
        <view class="menu-title-with-btn">
          <text>账号信息</text>
          <button class="small-btn" @tap="toggleUserInfoDetail">{{ showUserInfoDetail ? '收起' : '查看详情' }}</button>
        </view>
        <view class="menu-list" v-if="showUserInfoDetail">
          <view class="info-item">
            <text class="info-label">用户ID</text>
            <text class="info-value">{{ userInfo?.id || '未知' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">邮箱</text>
            <text class="info-value">{{ userInfo?.email || '未知' }}</text>
          </view>
          <view class="info-item">
            <text class="info-label">注册时间</text>
            <text class="info-value">{{ formatDate(userInfo?.created_at) || '未知' }}</text>
          </view>
        </view>
      </view>
      
      <!-- 个人设置菜单 - 改为二级菜单 -->
      <view class="menu-section">
        <view class="menu-title-with-btn">
          <text>个人设置</text>
          <button class="small-btn" @tap="toggleSettingsMenu">{{ showSettingsMenu ? '收起' : '展开' }}</button>
        </view>
        <view class="menu-list" v-if="showSettingsMenu">
          <view class="menu-item" @tap="showEditProfileModal">
            <view class="menu-icon profile-icon">个</view>
            <text class="menu-name">修改个人信息</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="menu-item" @tap="showAvatarOptions">
            <view class="menu-icon avatar-icon">头</view>
            <text class="menu-name">修改头像</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="menu-item" @tap="showEditEmailModal">
            <view class="menu-icon email-icon">邮</view>
            <text class="menu-name">修改邮箱</text>
            <text class="menu-arrow">></text>
          </view>
        </view>
      </view>
      
      <view class="menu-section">
        <view class="menu-title">我的物品</view>
        <view class="menu-list">
          <view class="menu-item" @tap="goToMyPublish('lost')">
            <view class="menu-icon lost-icon">丢</view>
            <text class="menu-name">我的失物</text>
            <text class="menu-arrow">></text>
          </view>
          <view class="menu-item" @tap="goToMyPublish('found')">
            <view class="menu-icon found-icon">招</view>
            <text class="menu-name">我的招领</text>
            <text class="menu-arrow">></text>
          </view>
        </view>
      </view>
    </block>
    
    <!-- 通用功能菜单 - 登录和未登录都显示 -->
    <view class="menu-section">
      <view class="menu-title">其他功能</view>
      <view class="menu-list">
        <view class="menu-item" @tap="goToFeedback">
          <view class="menu-icon feedback-icon">反</view>
          <text class="menu-name">意见反馈</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @tap="showAbout">
          <view class="menu-icon about-icon">关</view>
          <text class="menu-name">关于我们</text>
          <text class="menu-arrow">></text>
        </view>
      </view>
    </view>
    
    <!-- 退出登录按钮 - 仅登录状态显示 -->
    <button v-if="isLoggedIn" class="logout-btn" @tap="handleLogout">退出登录</button>
    
    <!-- 自定义修改个人信息弹窗 -->
    <view class="custom-popup" v-if="showProfilePopup">
      <view class="popup-mask" @tap="closeEditProfileModal"></view>
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">修改个人信息</text>
          <text class="popup-close" @tap="closeEditProfileModal">×</text>
        </view>
        <view class="popup-body">
          <view class="form-item">
            <text class="form-label">姓名</text>
            <input class="form-input" v-model="editForm.name" placeholder="请输入姓名" />
          </view>
          <view class="form-item">
            <text class="form-label">新密码</text>
            <view class="password-input-container">
              <input class="form-input password-input" :type="passwordVisible ? 'text' : 'password'" v-model="editForm.password" placeholder="请输入新密码（不修改请留空）" />
              <text class="password-toggle" @tap="passwordVisible = !passwordVisible">{{ passwordVisible ? '隐藏' : '显示' }}</text>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">确认密码</text>
            <view class="password-input-container">
              <input class="form-input password-input" :type="confirmPasswordVisible ? 'text' : 'password'" v-model="editForm.confirmPassword" placeholder="请再次输入新密码" />
              <text class="password-toggle" @tap="confirmPasswordVisible = !confirmPasswordVisible">{{ confirmPasswordVisible ? '隐藏' : '显示' }}</text>
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <button class="popup-btn cancel-btn" @tap="closeEditProfileModal">取消</button>
          <button class="popup-btn confirm-btn" @tap="submitEditProfile">确认</button>
        </view>
      </view>
    </view>
    
    <!-- 自定义修改邮箱弹窗 -->
    <view class="custom-popup" v-if="showEmailPopup">
      <view class="popup-mask" @tap="closeEditEmailModal"></view>
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">修改邮箱</text>
          <text class="popup-close" @tap="closeEditEmailModal">×</text>
        </view>
        <view class="popup-body">
          <view class="form-item">
            <text class="form-label">新邮箱</text>
            <input class="form-input" v-model="emailForm.new_email" placeholder="请输入新邮箱" />
          </view>
          <view class="form-item">
            <text class="form-label">验证码</text>
            <view class="code-input-container">
              <input class="form-input code-input" v-model="emailForm.code" placeholder="请输入验证码" />
              <button class="code-btn" :disabled="codeBtnDisabled" @tap="getEmailCode">
                {{ codeBtnText }}
              </button>
            </view>
          </view>
        </view>
        <view class="popup-footer">
          <button class="popup-btn cancel-btn" @tap="closeEditEmailModal">取消</button>
          <button class="popup-btn confirm-btn" @tap="submitEditEmail">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { BASE_URL } from '@/config';
import socketIOService from '@/utils/socketio.js';

export default {
  data() {
    return {
      // 修改个人信息表单
      editForm: {
        name: '',
        password: '',
        confirmPassword: ''
      },
      // 密码显示状态
      passwordVisible: false,
      confirmPasswordVisible: false,
      // 修改邮箱表单
      emailForm: {
        new_email: '',
        code: ''
      },
      // 验证码按钮状态
      codeBtnDisabled: false,
      codeBtnText: '获取验证码',
      countdown: 60,
      // 弹窗显示状态
      showProfilePopup: false,
      showEmailPopup: false,
      // 新增：控制用户信息和设置菜单的显示状态
      showUserInfoDetail: false,
      showSettingsMenu: false
    };
  },
  
  computed: {
    ...mapState({
      userInfo: state => state.userInfo,
      isLoggedIn: state => state.isLoggedIn
    })
  },
  
  onLoad() {
    // 如果已登录，刷新用户信息
    if (this.isLoggedIn) {
      this.refreshUserInfo();
    }
  },
  
  onShow() {
    // 如果已登录，刷新用户信息
    if (this.isLoggedIn) {
      this.refreshUserInfo();
    }
  },
  
  methods: {
    ...mapActions(['getUserInfo', 'logout', 'updateUserInfo', 'updateAvatar', 'updateEmail', 'getCode']),
    
    // 新增：切换用户信息详情显示状态
    toggleUserInfoDetail() {
      this.showUserInfoDetail = !this.showUserInfoDetail;
    },
    
    // 新增：切换设置菜单显示状态
    toggleSettingsMenu() {
      this.showSettingsMenu = !this.showSettingsMenu;
    },
    
    // 刷新用户信息
    async refreshUserInfo() {
      try {
        await this.getUserInfo();
      } catch (error) {
        uni.showToast({
          title: '获取用户信息失败',
          icon: 'none'
        });
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
    
    // 跳转到我的发布页面
    goToMyPublish(type) {
      uni.navigateTo({
        url: `/pages/my-publish/my-publish?type=${type}`
      });
    },
    
    // 跳转到消息页面
    goToMessage() {
      uni.switchTab({
        url: '/pages/chat/chat-list'
      });
    },
    
    // 跳转到反馈页面
    goToFeedback() {
      // 检查登录状态，未登录则先跳转到登录页
      if (!this.isLoggedIn) {
        uni.showModal({
          title: '提示',
          content: '请先登录后再提交反馈',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              this.goToLogin();
            }
          }
        });
        return;
      }
      
      uni.navigateTo({
        url: '/pages/feedback/feedback'
      });
    },
    
    // 显示关于我们
    showAbout() {
      uni.showModal({
        title: '关于我们',
        content: '校园失物招领平台是一个帮助师生寻找丢失物品和归还拾获物品的服务平台。如有问题，请联系管理员。',
        showCancel: false
      });
    },
    
    // 处理退出登录
    handleLogout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 先关闭携带当前账号 token 的 Socket.IO 长连接，避免退出后仍接收私信
            socketIOService.close();

            this.logout();
            // 清除本地存储中的登录凭证（token/refreshToken 由 store 的 CLEAR_USER_INFO 清除）
            uni.removeStorageSync('userInfo');

            uni.showToast({
              title: '已退出登录',
              icon: 'success'
            });
          }
        }
      });
    },
    
    // 显示修改个人信息弹窗
    showEditProfileModal() {
      // 初始化表单数据
      this.editForm.name = this.userInfo?.name || '';
      this.editForm.password = '';
      this.editForm.confirmPassword = '';
      // 重置密码显示状态
      this.passwordVisible = false;
      this.confirmPasswordVisible = false;
      // 显示自定义弹窗
      this.showProfilePopup = true;
    },
    
    // 关闭修改个人信息弹窗
    closeEditProfileModal() {
      this.showProfilePopup = false;
    },
    
    // 提交修改个人信息
    async submitEditProfile() {
      // 验证表单
      if (!this.editForm.name) {
        uni.showToast({
          title: '姓名不能为空',
          icon: 'none'
        });
        return;
      }
      
      // 如果输入了密码，则验证密码
      if (this.editForm.password) {
        // 验证密码长度
        if (this.editForm.password.length < 6) {
          uni.showToast({
            title: '密码长度不能少于6位',
            icon: 'none'
          });
          return;
        }
        
        // 验证两次密码是否一致
        if (this.editForm.password !== this.editForm.confirmPassword) {
          uni.showToast({
            title: '两次密码输入不一致',
            icon: 'none'
          });
          return;
        }
      }
      
      // 构建请求数据
      const data = {
        name: this.editForm.name
      };
      
      // 如果密码不为空，则一并修改
      if (this.editForm.password) {
        data.password = this.editForm.password;
      }
      
      try {
        const res = await this.updateUserInfo(data);
        uni.showToast({
          title: '修改成功',
          icon: 'success'
        });
        this.closeEditProfileModal();
        // 刷新用户信息
        await this.refreshUserInfo();
      } catch (error) {
        uni.showToast({
          title: '修改失败',
          icon: 'none'
        });
      }
    },
    
    // 显示头像选项
    showAvatarOptions() {
      uni.showActionSheet({
        itemList: ['从相册选择', '拍照'],
        success: (res) => {
          if (res.tapIndex === 0) {
            // 从相册选择
            this.chooseImage('album');
          } else if (res.tapIndex === 1) {
            // 拍照
            this.chooseImage('camera');
          }
        }
      });
    },
    
    // 选择图片
    chooseImage(sourceType) {
      uni.chooseImage({
        count: 1,
        sourceType: [sourceType],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          // 上传图片
          this.uploadImage(tempFilePath);
        }
      });
    },
    
    // 上传图片
    uploadImage(filePath) {
      uni.showLoading({
        title: '上传中...'
      });

      // 使用uni.uploadFile上传图片到服务器（必须携带 token，否则必然 401）
      uni.uploadFile({
        url: `${BASE_URL}/common/images/upload`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': 'Bearer ' + uni.getStorageSync('token')
        },
        formData: {
          'type': 'avatar'
        },
        success: async (uploadRes) => {
          uni.hideLoading();

          try {
            if (uploadRes.statusCode !== 200) {
              throw new Error(`上传失败(${uploadRes.statusCode})`);
            }
            // 解析上传结果
            const data = JSON.parse(uploadRes.data);

            if (data.file_url) {
              // 更新头像
              const res = await this.updateAvatar({
                avatar_url: data.file_url
              });

              uni.showToast({
                title: '头像更新成功',
                icon: 'success'
              });

              // 刷新用户信息
              await this.refreshUserInfo();
            } else {
              throw new Error('上传失败，未获取到图片URL');
            }
          } catch (error) {
            uni.showToast({
              title: '头像更新失败，请稍后再试',
              icon: 'none'
            });
          }
        },
        fail: (err) => {
          uni.hideLoading();
          uni.showToast({
            title: '图片上传失败',
            icon: 'none'
          });
        }
      });
    },
    
    // 显示修改邮箱弹窗
    showEditEmailModal() {
      // 初始化表单数据
      this.emailForm.new_email = '';
      this.emailForm.code = '';
      // 按倒计时是否仍在进行恢复按钮状态，避免倒计时中重开弹窗误复位为可点
      if (this.countdown > 0) {
        this.codeBtnDisabled = true;
        this.codeBtnText = `${this.countdown}秒`;
      } else {
        this.codeBtnDisabled = false;
        this.codeBtnText = '获取验证码';
      }
      // 显示自定义弹窗
      this.showEmailPopup = true;
    },
    
    // 关闭修改邮箱弹窗
    closeEditEmailModal() {
      this.showEmailPopup = false;
    },
    
    // 获取邮箱验证码
    async getEmailCode() {
      // 验证邮箱格式
      if (!this.emailForm.new_email) {
        uni.showToast({
          title: '请输入新邮箱',
          icon: 'none'
        });
        return;
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.emailForm.new_email)) {
        uni.showToast({
          title: '邮箱格式不正确',
          icon: 'none'
        });
        return;
      }
      
      // 禁用按钮并开始倒计时
      this.codeBtnDisabled = true;
      this.countdown = 60;
      this.codeBtnText = `${this.countdown}秒`;

      // 先清理上一次的倒计时定时器，避免重开弹窗后产生双定时器把 countdown 每秒减 2
      if (this._emailCodeTimer) {
        clearInterval(this._emailCodeTimer);
        this._emailCodeTimer = null;
      }

      this._emailCodeTimer = setInterval(() => {
        this.countdown--;
        this.codeBtnText = `${this.countdown}秒`;
        if (this.countdown <= 0) {
          clearInterval(this._emailCodeTimer);
          this._emailCodeTimer = null;
          this.countdown = 0;
          this.codeBtnDisabled = false;
          this.codeBtnText = '获取验证码';
        }
      }, 1000);

      try {
        // 调用获取验证码接口
        await this.getCode(this.emailForm.new_email);
        uni.showToast({
          title: '验证码已发送',
          icon: 'success'
        });
      } catch (error) {
        uni.showToast({
          title: '验证码发送失败',
          icon: 'none'
        });
        // 发送失败时重置按钮状态
        clearInterval(this._emailCodeTimer);
        this._emailCodeTimer = null;
        this.countdown = 0;
        this.codeBtnDisabled = false;
        this.codeBtnText = '获取验证码';
      }
    },
    
    // 提交修改邮箱
    async submitEditEmail() {
      // 验证表单
      if (!this.emailForm.new_email) {
        uni.showToast({
          title: '请输入新邮箱',
          icon: 'none'
        });
        return;
      }
      
      if (!this.emailForm.code) {
        uni.showToast({
          title: '请输入验证码',
          icon: 'none'
        });
        return;
      }
      
      try {
        const res = await this.updateEmail({
          new_email: this.emailForm.new_email,
          code: this.emailForm.code
        });
        
        uni.showToast({
          title: '邮箱修改成功',
          icon: 'success'
        });
        this.closeEditEmailModal();
        
        // 刷新用户信息
        await this.refreshUserInfo();
      } catch (error) {
        uni.showToast({
          title: '邮箱修改失败',
          icon: 'none'
        });
      }
    },
    
    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return '未知日期';
      try {
        const date = new Date(dateStr);
        return date.getFullYear() + '-' + 
               (date.getMonth() + 1).toString().padStart(2, '0') + '-' + 
               date.getDate().toString().padStart(2, '0') + ' ' + 
               date.getHours().toString().padStart(2, '0') + ':' + 
               date.getMinutes().toString().padStart(2, '0');
      } catch (e) {
        return '未知日期';
      }
    }
  }
};
</script>

<style lang="scss">
.my-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 40rpx;
}

.user-card {
  height: 240rpx;
  background: linear-gradient(to right, #007AFF, #5AC8FA);
  display: flex;
  align-items: center;
  padding: 0 40rpx;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
}

.user-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid #fff;
  background-color: #fff;
}

.user-info {
  margin-left: 30rpx;
}

.user-name {
  font-size: 36rpx;
  color: #fff;
  font-weight: bold;
  margin-bottom: 10rpx;
  display: block;
}

.user-id {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.menu-section {
  margin: 30rpx 30rpx 0;
  background-color: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.menu-title {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
  padding: 30rpx;
  border-bottom: 1px solid #f5f5f5;
}

.menu-title-with-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
  padding: 30rpx;
  border-bottom: 1px solid #f5f5f5;
}

.small-btn {
  background-color: #007AFF;
  color: #fff;
  border: none;
  padding: 10rpx 20rpx;
  font-size: 24rpx;
  border-radius: 25rpx;
  line-height: 1;
  margin: 0;
  min-height: auto;
}

.menu-list {
  padding: 0 30rpx;
}

.menu-item {
  height: 100rpx;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: bold;
  font-size: 28rpx;
  margin-right: 20rpx;
}

.lost-icon {
  background-color: #FF3B30;
}

.found-icon {
  background-color: #4CD964;
}

.message-icon {
  background-color: #007AFF;
}

.feedback-icon {
  background-color: #FF9500;
}

.about-icon {
  background-color: #5856D6;
}

.profile-icon {
  background-color: #34C759;
}

.avatar-icon {
  background-color: #FF9500;
}

.email-icon {
  background-color: #5AC8FA;
}

.menu-name {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.menu-arrow {
  font-size: 32rpx;
  color: #ccc;
  font-weight: bold;
}

.login-container {
  padding: 20rpx 0;
}

.login-tips {
  font-size: 28rpx;
  color: #666;
  text-align: center;
  margin-bottom: 30rpx;
}

.login-btns {
  display: flex;
  justify-content: center;
  gap: 40rpx;
  padding: 0 30rpx;
  width: 100%;
  box-sizing: border-box;
}

.btn-wrapper {
  width: 200rpx;
  display: flex;
  justify-content: center;
}

.btn {
  width: 200rpx;
  height: 90rpx;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin: 0;
  padding: 0;
}

.login-btn {
  background: linear-gradient(to right, #007AFF, #5AC8FA);
  color: #fff;
}

.register-btn {
  background-color: #fff;
  color: #007AFF;
  border: 1px solid #007AFF;
}

.logout-btn {
  width: 90%;
  height: 90rpx;
  background-color: #fff;
  color: #FF3B30;
  border-radius: 45rpx;
  border: none;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.05);
  margin-top: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.info-item {
  padding: 20rpx 0;
  border-bottom: 1px solid #f5f5f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  max-width: 70%;
  text-align: right;
  word-break: break-all;
}

/* 自定义弹窗样式 */
.custom-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
}

.popup-content {
  width: 650rpx;
  background-color: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  position: relative;
  z-index: 1000;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  animation: popup-in 0.3s ease;
}

@keyframes popup-in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.popup-header {
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f5f5f5;
}

.popup-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.popup-close {
  font-size: 48rpx;
  color: #999;
  line-height: 1;
}

.popup-body {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 15rpx;
  display: block;
}

.form-input {
  width: 100%;
  height: 90rpx;
  border: 1px solid #e5e5e5;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 30rpx;
  box-sizing: border-box;
  background-color: #f9f9f9;
}

.code-input-container {
  display: flex;
  align-items: center;
}

.code-input {
  flex: 1;
  margin-right: 20rpx;
}

.code-btn {
  width: 200rpx;
  height: 90rpx;
  background: linear-gradient(to right, #007AFF, #5AC8FA);
  color: #fff;
  border-radius: 10rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.code-btn[disabled] {
  background: #cccccc;
  color: #ffffff;
}

.popup-footer {
  padding: 20rpx 30rpx 40rpx;
  display: flex;
  justify-content: space-between;
}

.popup-btn {
  width: 45%;
  height: 90rpx;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.confirm-btn {
  background: linear-gradient(to right, #007AFF, #5AC8FA);
  color: #fff;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  padding-right: 100rpx;
}

.password-toggle {
  position: absolute;
  right: 20rpx;
  color: #007AFF;
  font-size: 28rpx;
}
</style> 