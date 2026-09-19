<template>
  <view class="my-container lf-login-guide">
    <!-- 用户信息 hero（渐变头部，菜单卡片负 margin 叠压） -->
    <view class="user-card">
      <view class="backdrop"></view>
      <image class="user-avatar" :src="userInfo?.avatar_url || '/static/default-avatar.png'" mode="aspectFill" @tap="isLoggedIn && showAvatarOptions()"></image>
      <view class="user-info">
        <text class="user-name">{{ userInfo?.name || '未登录' }}</text>
        <text class="user-id">{{ userInfo?.student_id ? '学号 ' + userInfo.student_id : '登录后可使用完整功能' }}</text>
      </view>
    </view>
    
    <!-- 未登录状态（引导块样式见 styles/common.scss .lf-login-guide） -->
    <view v-if="!isLoggedIn" class="menu-section">
      <view class="menu-title">账号登录</view>
      <view class="menu-list">
        <view class="login-container">
          <view class="login-tips">登录后可使用更多功能</view>
          <view class="login-btns">
            <button class="btn login-btn" @tap="goToLogin">登录</button>
            <button class="btn register-btn" @tap="goToRegister">注册</button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 已登录状态 - 功能菜单 -->
    <block v-if="isLoggedIn">
      <!-- 用户详细信息 - 点击展开 -->
      <view class="menu-section">
        <view class="menu-title-with-btn">
          <view class="menu-title-text"><text>账号信息</text></view>
          <view class="section-toggle" @tap="toggleUserInfoDetail">
            <text class="section-toggle-label">{{ showUserInfoDetail ? '收起' : '查看详情' }}</text>
            <uni-icons :type="showUserInfoDetail ? 'top' : 'bottom'" size="13" :color="colorPrimary" />
          </view>
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
          <view class="menu-title-text"><text>个人设置</text></view>
          <view class="section-toggle" @tap="toggleSettingsMenu">
            <text class="section-toggle-label">{{ showSettingsMenu ? '收起' : '展开设置' }}</text>
            <uni-icons :type="showSettingsMenu ? 'top' : 'bottom'" size="13" :color="colorPrimary" />
          </view>
        </view>
        <view class="menu-list" v-if="showSettingsMenu">
          <view class="menu-item" @tap="showEditProfileModal">
            <lf-icon-item class="menu-icon" icon="person" :color="iconColors.profile" />
            <text class="menu-name">修改个人信息</text>
            <uni-icons class="menu-arrow" type="right" size="16" :color="colorSecondary" />
          </view>
          <view class="menu-item" @tap="showAvatarOptions">
            <lf-icon-item class="menu-icon" icon="image" :color="iconColors.avatar" />
            <text class="menu-name">修改头像</text>
            <uni-icons class="menu-arrow" type="right" size="16" :color="colorSecondary" />
          </view>
          <view class="menu-item" @tap="showEditEmailModal">
            <lf-icon-item class="menu-icon" icon="email" :color="iconColors.email" />
            <text class="menu-name">修改邮箱</text>
            <uni-icons class="menu-arrow" type="right" size="16" :color="colorSecondary" />
          </view>
        </view>
      </view>
      
      <view class="menu-section">
        <view class="menu-title">我的物品</view>
        <view class="menu-list">
          <view class="menu-item" @tap="goToMyPublish('lost')">
            <lf-icon-item class="menu-icon" icon="search" :color="iconColors.lost" />
            <text class="menu-name">我的失物</text>
            <uni-icons class="menu-arrow" type="right" size="16" :color="colorSecondary" />
          </view>
          <view class="menu-item" @tap="goToMyPublish('found')">
            <lf-icon-item class="menu-icon" icon="flag" :color="iconColors.found" />
            <text class="menu-name">我的招领</text>
            <uni-icons class="menu-arrow" type="right" size="16" :color="colorSecondary" />
          </view>
        </view>
      </view>
    </block>
    
    <!-- 通用功能菜单 - 登录和未登录都显示 -->
    <view class="menu-section">
      <view class="menu-title">其他功能</view>
      <view class="menu-list">
        <view class="menu-item" @tap="goToFeedback">
          <lf-icon-item class="menu-icon" icon="compose" :color="iconColors.feedback" />
          <text class="menu-name">意见反馈</text>
          <uni-icons class="menu-arrow" type="right" size="16" :color="colorSecondary" />
        </view>
        <view class="menu-item" @tap="showAbout">
          <lf-icon-item class="menu-icon" icon="info" :color="iconColors.about" />
          <text class="menu-name">关于我们</text>
          <uni-icons class="menu-arrow" type="right" size="16" :color="colorSecondary" />
        </view>
      </view>
    </view>
    
    <!-- 退出登录按钮 - 仅登录状态显示 -->
    <button v-if="isLoggedIn" class="logout-btn" @tap="handleLogout">退出登录</button>
    
    <!-- 自定义修改个人信息弹窗（底部抽屉，公共样式见 common.scss .lf-popup） -->
    <view class="lf-popup" v-if="showProfilePopup">
      <view class="lf-popup-mask" @tap="closeEditProfileModal"></view>
      <view class="lf-popup-content">
        <view class="lf-popup-header">
          <text class="lf-popup-title">修改个人信息</text>
          <view class="lf-popup-close" @tap="closeEditProfileModal"><uni-icons type="closeempty" size="18" :color="colorGrey" /></view>
        </view>
        <view class="lf-popup-body">
          <view class="form-item">
            <text class="form-label">姓名</text>
            <input class="form-input" v-model="editForm.name" placeholder="请输入姓名" />
          </view>
          <view class="form-item">
            <text class="form-label">旧密码</text>
            <view class="password-input-container">
              <input class="form-input password-input" :type="oldPasswordVisible ? 'text' : 'password'" v-model="editForm.oldPassword" placeholder="请输入当前密码" />
              <uni-icons class="password-toggle" :type="oldPasswordVisible ? 'eye-slash' : 'eye'" size="22" :color="colorGrey" @click="oldPasswordVisible = !oldPasswordVisible" />
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">新密码</text>
            <view class="password-input-container">
              <input class="form-input password-input" :type="passwordVisible ? 'text' : 'password'" v-model="editForm.password" placeholder="请输入新密码（不修改请留空）" />
              <uni-icons class="password-toggle" :type="passwordVisible ? 'eye-slash' : 'eye'" size="22" :color="colorGrey" @click="passwordVisible = !passwordVisible" />
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">确认密码</text>
            <view class="password-input-container">
              <input class="form-input password-input" :type="confirmPasswordVisible ? 'text' : 'password'" v-model="editForm.confirmPassword" placeholder="请再次输入新密码" />
              <uni-icons class="password-toggle" :type="confirmPasswordVisible ? 'eye-slash' : 'eye'" size="22" :color="colorGrey" @click="confirmPasswordVisible = !confirmPasswordVisible" />
            </view>
          </view>
        </view>
        <view class="lf-popup-footer">
          <button class="lf-btn-ghost lf-popup-btn" @tap="closeEditProfileModal">取消</button>
          <button class="lf-btn-primary lf-popup-btn" @tap="submitEditProfile">确认</button>
        </view>
      </view>
    </view>

    <!-- 自定义修改邮箱弹窗 -->
    <view class="lf-popup" v-if="showEmailPopup">
      <view class="lf-popup-mask" @tap="closeEditEmailModal"></view>
      <view class="lf-popup-content">
        <view class="lf-popup-header">
          <text class="lf-popup-title">修改邮箱</text>
          <view class="lf-popup-close" @tap="closeEditEmailModal"><uni-icons type="closeempty" size="18" :color="colorGrey" /></view>
        </view>
        <view class="lf-popup-body">
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
        <view class="lf-popup-footer">
          <button class="lf-btn-ghost lf-popup-btn" @tap="closeEditEmailModal">取消</button>
          <button class="lf-btn-primary lf-popup-btn" @tap="submitEditEmail">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { BASE_URL } from '@/config';
import { COLOR_PRIMARY, COLOR_PRIMARY_LIGHT, COLOR_SUCCESS, COLOR_WARNING, COLOR_ERROR, COLOR_GREY, COLOR_SECONDARY } from '@/config/ui';
import socketIOService from '@/utils/socketio.js';
import { updateMessageBadge } from '@/utils/common.js';
import request from '@/utils/request';

export default {
  data() {
    return {
      colorPrimary: COLOR_PRIMARY, // 主色（展开箭头等）
      colorGrey: COLOR_GREY, // 辅助图标灰（与 $uni-text-color-grey 同步）
      colorSecondary: COLOR_SECONDARY, // 更弱一级灰（箭头/占位图标）
      // 菜单图标圆底色（与 uni.scss token 同步）
      iconColors: {
        profile: COLOR_SUCCESS,
        avatar: COLOR_WARNING,
        email: COLOR_PRIMARY_LIGHT,
        lost: COLOR_ERROR,
        found: COLOR_SUCCESS,
        feedback: COLOR_WARNING,
        about: COLOR_PRIMARY,
      },
      // 修改个人信息表单
      editForm: {
        name: '',
        oldPassword: '',
        password: '',
        confirmPassword: ''
      },
      // 密码显示状态
      oldPasswordVisible: false,
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
      // 是否正在上传图片（防重复上传）
      uploading: false,
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

            // 清除"消息"tabBar 未读角标：该账号的未读数不应带到下次登录（C13），
            // updateMessageBadge(0) 内部走 removeTabBarBadge({ index: 2 })，与设置角标对称
            updateMessageBadge(0);

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
      this.editForm.oldPassword = '';
      this.editForm.password = '';
      this.editForm.confirmPassword = '';
      // 重置密码显示状态
      this.oldPasswordVisible = false;
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
        // 修改密码必须同时提供旧密码
        if (!this.editForm.oldPassword) {
          uni.showToast({
            title: '请输入旧密码',
            icon: 'none'
          });
          return;
        }
        
        // 验证密码长度（与后端 8-64 位要求一致）
        if (this.editForm.password.length < 8) {
          uni.showToast({
            title: '密码长度不能少于8位',
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
        data.old_password = this.editForm.oldPassword;
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
          title: error.error || error.message || '修改失败',
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
      // 并发保护：上一次上传尚未完成时拒绝再次进入
      if (this.uploading) {
        uni.showToast({ title: '正在上传中，请稍候', icon: 'none' });
        return;
      }
      uni.chooseImage({
        count: 1,
        sourceType: [sourceType],
        success: (res) => {
          // 客户端大小预检：超过 8MB 直接拒绝（部分端 tempFiles 元素无 size 字段，跳过检查）
          const tempFile = res.tempFiles && res.tempFiles[0];
          if (tempFile && typeof tempFile.size === 'number' && tempFile.size > 8 * 1024 * 1024) {
            uni.showToast({ title: '图片不能超过8MB，请重新选择', icon: 'none' });
            return;
          }
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
      this.uploading = true;

      // 统一封装上传（自动携带并刷新 token）
      request.uploadFile({
        url: '/common/images/upload',
        filePath: filePath,
        name: 'file',
        formData: {
          'type': 'avatar'
        }
      }).then(async (data) => {
        uni.hideLoading();

        if (data.file_url) {
          // 更新头像
          await this.updateAvatar({
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
      }).catch(() => {
        uni.hideLoading();
        uni.showToast({
          title: '头像更新失败，请稍后再试',
          icon: 'none'
        });
      }).finally(() => {
        this.uploading = false;
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
          title: error.error || error.message || '邮箱修改失败',
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

<style lang="scss" scoped>
.my-container {
  min-height: 100vh;
  background-color: $uni-bg-color-grey;
  padding-bottom: 40rpx;
}

/* ===== 用户信息 hero ===== */
.user-card {
  height: 300rpx;
  background: $uni-gradient-hero;
  display: flex;
  align-items: center;
  padding: 0 40rpx;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12rpx 32rpx rgba(10, 114, 245, 0.2);
}

/* 装饰性半透明圆 */
.backdrop {
  position: absolute;
  top: -80rpx;
  right: -60rpx;
  width: 260rpx;
  height: 260rpx;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
}

.user-avatar {
  width: 130rpx;
  height: 130rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.9);
  background-color: rgba(255, 255, 255, 0.25);
  z-index: 1;
}

.user-info {
  margin-left: 30rpx;
  z-index: 1;
}

.user-name {
  font-size: 40rpx;
  color: $uni-text-color-inverse;
  font-weight: 600;
  margin-bottom: 12rpx;
  display: block;
}

.user-id {
  font-size: $uni-font-size-base;
  color: rgba(255, 255, 255, 0.82);
}

/* ===== 功能菜单卡片 ===== */
.menu-section {
  margin: 24rpx 24rpx 0;
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-card;
  overflow: hidden;
  box-shadow: $uni-shadow-card;
}

.menu-title {
  font-size: $uni-font-size-md;
  color: $uni-text-color;
  font-weight: 600;
  padding: 28rpx 28rpx 20rpx;
}

.menu-title-with-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 28rpx 20rpx;
}

.menu-title-text {
  font-size: $uni-font-size-md;
  color: $uni-text-color;
  font-weight: 600;
}

/* 展开/收起文字按钮 */
.section-toggle {
  display: flex;
  align-items: center;

  .section-toggle-label {
    font-size: $uni-font-size-caption;
    color: $uni-color-primary;
    margin-right: 4rpx;
  }
}

.menu-list {
  padding: 0 28rpx 8rpx;
}

.menu-item {
  height: 104rpx;
  display: flex;
  align-items: center;
  border-bottom: 1rpx solid $uni-border-color-split;
  transition: background-color 0.15s;

  &:last-child {
    border-bottom: none;
  }

  &:active {
    background-color: $uni-bg-color-hover;
  }
}

.menu-icon {
  width: 64rpx;
  height: 64rpx;
  margin-right: 22rpx;
}

.menu-name {
  flex: 1;
  font-size: $uni-font-size-md;
  color: $uni-text-color;
}

.menu-arrow {
  flex-shrink: 0;
}

/* ===== 未登录引导块（.login-tips/.login-btns/.btn 见 common.scss .lf-login-guide） ===== */
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0 40rpx;
}

/* ===== 退出登录 ===== */
.logout-btn {
  width: calc(100% - 48rpx);
  height: 96rpx;
  background-color: $uni-bg-color;
  color: $uni-color-error;
  border-radius: $uni-border-radius-card;
  border: none;
  box-shadow: $uni-shadow-card;
  margin-top: 40rpx;
  margin-left: 24rpx;
  margin-right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $uni-font-size-lg;
  font-weight: 500;

  &::after {
    border: none;
  }

  &:active {
    background-color: $uni-bg-color-hover;
  }
}

/* ===== 账号信息详情行 ===== */
.info-item {
  padding: 24rpx 0;
  border-bottom: 1rpx solid $uni-border-color-split;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: $uni-font-size-base;
  color: $uni-text-color-grey;
}

.info-value {
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  max-width: 70%;
  text-align: right;
  word-break: break-all;
}

/* ===== 弹窗表单（弹窗外壳样式见 common.scss .lf-popup） ===== */
.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  margin-bottom: 14rpx;
  display: block;
  font-weight: 500;
}

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
  height: 88rpx;
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  border-radius: $uni-radius-md;
  font-size: $uni-font-size-base;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;

  &::after {
    border: none;
  }
}

.code-btn[disabled] {
  background: $uni-text-color-secondary;
  color: $uni-text-color-inverse;
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
  right: 24rpx;
  color: $uni-text-color-grey;
}
</style>
