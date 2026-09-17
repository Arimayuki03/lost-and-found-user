<template>
  <view class="publish-container lf-login-guide">
    <!-- 未登录状态显示 -->
    <view v-if="!isLoggedIn" class="login-section">
      <image class="login-image" src="/static/logo.png" mode="aspectFit"></image>
      <text class="login-tips">登录后发布信息</text>
      <view class="login-btns">
        <button class="btn login-btn" @tap="goToLogin">登录</button>
        <button class="btn register-btn" @tap="goToRegister">注册</button>
      </view>
    </view>
    
    <!-- 已登录内容 -->
    <block v-else>
      <!-- 切换标签：失物/招领（分段控件，图标区分语义） -->
      <view class="tabs">
        <view class="lf-segment publish-segment">
          <view class="lf-segment-item" :class="{ active: activeTab === 'lost' }" @tap="switchTab('lost')">
            <uni-icons type="search" size="16" :color="activeTab === 'lost' ? colorPrimary : colorGrey" style="margin-right: 8rpx" />
            <text>发布失物</text>
          </view>
          <view class="lf-segment-item" :class="{ active: activeTab === 'found' }" @tap="switchTab('found')">
            <uni-icons type="gift" size="16" :color="activeTab === 'found' ? colorPrimary : colorGrey" style="margin-right: 8rpx" />
            <text>发布招领</text>
          </view>
        </view>
      </view>
      
      <!-- 表单内容区域 -->
      <scroll-view class="form-scroll" scroll-y>
        <!-- 失物表单 -->
        <view class="form-container" v-if="activeTab === 'lost'">
          <view class="form-card">
            <view class="form-item">
              <text class="form-label required">上传图片</text>
              <view class="upload-container">
                <view class="upload-preview" v-if="lostForm.image_url">
                  <image class="preview-image" :src="lostForm.image_url" mode="aspectFill"></image>
                  <view class="delete-icon" @tap="deleteLostImage"><uni-icons type="closeempty" size="18" :color="colorWhite"></uni-icons></view>
                </view>
                <view class="upload-btn" @tap="chooseImage('lost')" v-else>
                  <uni-icons class="upload-icon" type="camera-filled" size="30" :color="colorSecondary"></uni-icons>
                  <text class="upload-text">点击上传照片</text>
                </view>
                <text class="upload-tip">请上传清晰的物品照片，有助于物品的辨认</text>
              </view>
            </view>
            
            <view class="form-item">
              <text class="form-label required">物品名称</text>
              <input 
                class="form-input" 
                type="text" 
                v-model="lostForm.name" 
                placeholder="请输入物品名称" 
                maxlength="100"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label required">物品类别</text>
              <!-- 类别改为选择器（与首页分类导航同源），降低输入成本、避免拼错 -->
              <picker mode="selector" :range="categories" :value="lostCategoryIndex" @change="onLostCategoryChange">
                <view class="form-input picker-input">
                  <text :class="lostForm.category ? 'picker-value' : 'picker-placeholder'">{{ lostForm.category || '请选择物品类别' }}</text>
                  <uni-icons type="bottom" size="16" :color="colorGrey"></uni-icons>
                </view>
              </picker>
            </view>
            
            <view class="form-item">
              <text class="form-label required">遗失时间</text>
              <view class="date-picker-container">
                <uni-datetime-picker 
                  type="datetime" 
                  v-model="lostForm.lost_time" 
                  :clear-icon="false"
                  return-type="string"
                  format="yyyy-MM-dd HH:mm"
                  placeholder="请选择遗失时间"
                />
              </view>
            </view>
            
            <view class="form-item">
              <text class="form-label required">遗失地点</text>
              <input 
                class="form-input" 
                type="text" 
                v-model="lostForm.location" 
                placeholder="请输入遗失地点" 
                maxlength="200"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label required">联系方式</text>
              <input 
                class="form-input" 
                type="text" 
                v-model="lostForm.contact" 
                placeholder="请输入联系方式" 
                maxlength="50"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label required">物品描述</text>
              <textarea 
                class="form-textarea" 
                v-model="lostForm.description" 
                placeholder="请详细描述物品特征、遗失经过等信息" 
                maxlength="5000"
              />
              <text class="textarea-counter">{{ lostForm.description.length }}/5000</text>
            </view>
          </view>
          
          <button class="submit-btn" @tap="submitLostForm">
            <view class="submit-icon">
              <uni-icons type="paperplane-filled" size="18" :color="colorWhite"></uni-icons>
            </view>
            <text class="submit-text">发布失物信息</text>
          </button>
          
          <view class="form-tips">
            <text class="tips-title">温馨提示：</text>
            <text class="tips-content">1. 请确保信息真实有效，便于失主尽快找回物品</text>
            <text class="tips-content">2. 发布后可在"我的-我的物品"中查看和管理</text>
            <text class="tips-content">3. 如有问题请联系管理员</text>
          </view>
        </view>
        
        <!-- 招领表单 -->
        <view class="form-container" v-if="activeTab === 'found'">
          <view class="form-card">
            <view class="form-item">
              <text class="form-label required">上传图片</text>
              <view class="upload-container">
                <view class="upload-preview" v-if="foundForm.image_url">
                  <image class="preview-image" :src="foundForm.image_url" mode="aspectFill"></image>
                  <view class="delete-icon" @tap="deleteFoundImage"><uni-icons type="closeempty" size="18" :color="colorWhite"></uni-icons></view>
                </view>
                <view class="upload-btn" @tap="chooseImage('found')" v-else>
                  <uni-icons class="upload-icon" type="camera-filled" size="30" :color="colorSecondary"></uni-icons>
                  <text class="upload-text">点击上传照片</text>
                </view>
                <text class="upload-tip">请上传清晰的物品照片，有助于物品的辨认</text>
              </view>
            </view>
            
            <view class="form-item">
              <text class="form-label required">物品名称</text>
              <input 
                class="form-input" 
                type="text" 
                v-model="foundForm.name" 
                placeholder="请输入物品名称" 
                maxlength="100"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label required">物品类别</text>
              <picker mode="selector" :range="categories" :value="foundCategoryIndex" @change="onFoundCategoryChange">
                <view class="form-input picker-input">
                  <text :class="foundForm.category ? 'picker-value' : 'picker-placeholder'">{{ foundForm.category || '请选择物品类别' }}</text>
                  <uni-icons type="bottom" size="16" :color="colorGrey"></uni-icons>
                </view>
              </picker>
            </view>
            
            <view class="form-item">
              <text class="form-label required">拾获时间</text>
              <view class="date-picker-container">
                <uni-datetime-picker 
                  type="datetime" 
                  v-model="foundForm.found_time" 
                  :clear-icon="false"
                  return-type="string"
                  format="yyyy-MM-dd HH:mm"
                  placeholder="请选择拾获时间"
                />
              </view>
            </view>
            
            <view class="form-item">
              <text class="form-label required">拾获地点</text>
              <input 
                class="form-input" 
                type="text" 
                v-model="foundForm.location" 
                placeholder="请输入拾获地点" 
                maxlength="200"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label required">联系方式</text>
              <input 
                class="form-input" 
                type="text" 
                v-model="foundForm.contact" 
                placeholder="请输入联系方式" 
                maxlength="50"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label required">物品描述</text>
              <textarea 
                class="form-textarea" 
                v-model="foundForm.description" 
                placeholder="请详细描述物品特征、拾获经过等信息" 
                maxlength="5000"
              />
              <text class="textarea-counter">{{ foundForm.description.length }}/5000</text>
            </view>
          </view>
          
          <button class="submit-btn" @tap="submitFoundForm">
            <view class="submit-icon">
              <uni-icons type="paperplane-filled" size="18" :color="colorWhite"></uni-icons>
            </view>
            <text class="submit-text">发布招领信息</text>
          </button>
          
          <view class="form-tips">
            <text class="tips-title">温馨提示：</text>
            <text class="tips-content">1. 请确保信息真实有效，便于失主尽快找回物品</text>
            <text class="tips-content">2. 发布后可在"我的-我的物品"中查看和管理</text>
            <text class="tips-content">3. 如有问题请联系管理员</text>
          </view>
        </view>
      </scroll-view>
    </block>
  </view>
</template>

<script>
import { checkLogin, goToLogin } from '../../utils/common';
import { BASE_URL } from '@/config';
import request from '@/utils/request';

import { COLOR_GREY, COLOR_PRIMARY, COLOR_SECONDARY, COLOR_WHITE } from '@/config/ui';
export default {
  data() {
    return {
      colorWhite: COLOR_WHITE, // 前景白（与主色实底按钮上的图标同色）
      colorPrimary: COLOR_PRIMARY, // 主色（分段控件激活图标）
      colorGrey: COLOR_GREY, // 辅助图标灰（与 $uni-text-color-grey 同步）
      colorSecondary: COLOR_SECONDARY, // 更弱一级灰（箭头/占位图标）
      isLoggedIn: false,
      submitting: false, // 是否正在提交（防重复提交）
      uploading: false, // 是否正在上传图片（防重复上传）
      // 物品类别枚举（与首页分类导航/管理端筛选同源）
      categories: ['电子产品', '证件', '钱包', '钥匙', '书籍', '衣物', '饰品', '其他'],
      activeTab: 'lost', // 当前激活的标签：lost-失物，found-招领
      lostForm: {
        name: '',
        category: '',
        lost_time: '',
        location: '',
        contact: '',
        description: '',
        image_url: ''
      },
      foundForm: {
        name: '',
        category: '',
        found_time: '',
        location: '',
        contact: '',
        description: '',
        image_url: ''
      }
    };
  },
  
  onLoad() {
    // 检查登录状态
    this.checkLoginStatus();
  },
  
  onShow() {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus();
  },

  computed: {
    // picker 当前选中索引（AI 回填的类别不在枚举中时为 -1，picker 显示仍走 category 文本）
    lostCategoryIndex() {
      return this.categories.indexOf(this.lostForm.category);
    },
    foundCategoryIndex() {
      return this.categories.indexOf(this.foundForm.category);
    }
  },

  methods: {
    // 类别选择（失物/招领表单共用枚举）
    onLostCategoryChange(e) {
      this.lostForm.category = this.categories[e.detail.value];
    },
    onFoundCategoryChange(e) {
      this.foundForm.category = this.categories[e.detail.value];
    },

    // 检查登录状态
    checkLoginStatus() {
      this.isLoggedIn = checkLogin();
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
    
    // 切换标签
    switchTab(tab) {
      this.activeTab = tab;
    },
    
    // 选择图片
    chooseImage(type) {
      // 并发保护：上一次上传尚未完成时拒绝再次进入
      if (this.uploading) {
        uni.showToast({ title: '正在上传中，请稍候', icon: 'none' });
        return;
      }
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];

          // 客户端大小预检：超过 8MB 直接拒绝（部分端 tempFiles 元素无 size 字段，跳过检查）
          const tempFile = res.tempFiles && res.tempFiles[0];
          if (tempFile && typeof tempFile.size === 'number' && tempFile.size > 8 * 1024 * 1024) {
            uni.showToast({ title: '图片不能超过8MB，请重新选择', icon: 'none' });
            return;
          }

          this.uploading = true;
          const tempFilePath2 = tempFilePath;

          // 上传图片
          uni.showLoading({
            title: '上传中...'
          });

          // 上传图片到服务器（统一封装：自动携带并刷新 token）
          request.uploadFile({
            url: '/common/images/upload',
            filePath: tempFilePath2,
            name: 'file'
          }).then((result) => {
            // 提取图片URL（uploadFile 帮助函数已解析 JSON）
            let imageUrl = null;
            if (result && typeof result === 'object') {
              if (result.file_url) {
                imageUrl = result.file_url;
              } else if (result.url) {
                imageUrl = result.url;
              } else if (result.image_url) {
                imageUrl = result.image_url;
              }
            } else if (typeof result === 'string' && /^https?:\/\/\S+$/.test(result.trim())) {
              // 响应不是 JSON 时，仅当整体是一个合法 URL 才采用
              imageUrl = result.trim();
            }

            // 如果从响应中提取到了URL
            if (imageUrl) {
              // 设置图片URL
              if (type === 'lost') {
                this.lostForm.image_url = imageUrl;
              } else {
                this.foundForm.image_url = imageUrl;
              }

              // 显示成功提示
              uni.hideLoading();
              uni.showToast({
                title: '图片上传成功',
                icon: 'success'
              });

              // 调用后端接口识别图片标签
              this.recognizeImageLabels(imageUrl, type);
            } else {
              uni.hideLoading();
              uni.showToast({
                title: '图片上传成功，但获取URL失败',
                icon: 'none'
              });
            }
          }).catch(() => {
            uni.hideLoading();
            uni.showToast({
              title: '网络错误，上传失败',
              icon: 'none'
            });
          }).finally(() => {
            this.uploading = false;
          });
        }
      });
    },
    
    // 识别图片标签
    recognizeImageLabels(imageUrl, type) {
      uni.showLoading({
        title: '识别物品中...'
      });

      request({
        url: '/common/images/labels',
        method: 'POST',
        data: {
          image_url: imageUrl
        }
      }).then((data) => {
        uni.hideLoading();

        // 如果返回了标签信息
        if (data.FirstCategory || data.SecondCategory) {
          // 根据返回的标签设置物品类别
          let category = '';

          // 优先使用SecondCategory作为物品类别
          if (data.SecondCategory) {
            category = data.SecondCategory;
          } else if (data.FirstCategory) {
            category = data.FirstCategory;
          }


          // 将英文类别转换为中文类别
          const categoryMapping = {
            'Electronics': '电子产品',
            'Document': '证件',
            'Wallet': '钱包/钱物',
            'Key': '钥匙',
            'Book': '书籍',
            'Clothing': '衣物'
          };

          // 如果有映射关系，使用中文类别
          if (categoryMapping[category]) {
            category = categoryMapping[category];
          } else {
            // 尝试匹配关键词
            for (const [key, value] of Object.entries(categoryMapping)) {
              if (category.toLowerCase().includes(key.toLowerCase()) ||
                  (data.FirstCategory && data.FirstCategory.toLowerCase().includes(key.toLowerCase()))) {
                category = value;
                break;
              }
            }
          }

          // 设置对应表单的类别
          if (type === 'lost') {
            this.lostForm.category = category;
          } else {
            this.foundForm.category = category;
          }

          // 显示提示
          uni.showToast({
            title: '已自动识别物品类别',
            icon: 'success'
          });
        }
      }).catch(() => {
        uni.hideLoading();
        uni.showToast({
          title: '图片识别失败，请手动填写类别',
          icon: 'none'
        });
      });
    },

    // 删除失物图片
    deleteLostImage() {
      this.lostForm.image_url = '';
    },
    
    // 删除招领图片
    deleteFoundImage() {
      this.foundForm.image_url = '';
    },
    
    // 提交失物表单
    submitLostForm() {
      // 防止重复提交
      if (this.submitting) return;

      // 表单验证（trim 后校验，纯空格不通过）
      if (!this.lostForm.image_url) {
        uni.showToast({
          title: '请上传物品图片',
          icon: 'none'
        });
        return;
      }

      if (!this.lostForm.name || !this.lostForm.name.trim()) {
        uni.showToast({
          title: '请输入物品名称',
          icon: 'none'
        });
        return;
      }

      if (!this.lostForm.category || !this.lostForm.category.trim()) {
        uni.showToast({
          title: '请输入物品类别',
          icon: 'none'
        });
        return;
      }

      if (!this.lostForm.lost_time) {
        uni.showToast({
          title: '请选择遗失时间',
          icon: 'none'
        });
        return;
      }

      if (!this.lostForm.location || !this.lostForm.location.trim()) {
        uni.showToast({
          title: '请输入遗失地点',
          icon: 'none'
        });
        return;
      }

      if (!this.lostForm.contact || !this.lostForm.contact.trim()) {
        uni.showToast({
          title: '请输入联系方式',
          icon: 'none'
        });
        return;
      }

      if (!this.lostForm.description || !this.lostForm.description.trim()) {
        uni.showToast({
          title: '请输入物品描述',
          icon: 'none'
        });
        return;
      }

      this.submitting = true;

      // 显示加载
      uni.showLoading({
        title: '提交中...'
      });

      // 调用发布接口
      this.$api.lostItem.publish(this.lostForm)
        .then(() => {
          uni.hideLoading();
          this.submitting = false;
          uni.showToast({
            title: '发布成功',
            icon: 'success'
          });

          // 重置表单
          this.resetLostForm();

          // 返回首页
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/index/index'
            });
          }, 1500);
        })
        .catch((error) => {
          uni.hideLoading();
          this.submitting = false;
          uni.showToast({
            title: (error && error.error) || '发布失败，请稍后再试',
            icon: 'none'
          });
        });
    },
    
    // 提交招领表单
    submitFoundForm() {
      // 防止重复提交
      if (this.submitting) return;

      // 表单验证（trim 后校验，纯空格不通过）
      if (!this.foundForm.image_url) {
        uni.showToast({
          title: '请上传物品图片',
          icon: 'none'
        });
        return;
      }

      if (!this.foundForm.name || !this.foundForm.name.trim()) {
        uni.showToast({
          title: '请输入物品名称',
          icon: 'none'
        });
        return;
      }

      if (!this.foundForm.category || !this.foundForm.category.trim()) {
        uni.showToast({
          title: '请输入物品类别',
          icon: 'none'
        });
        return;
      }

      if (!this.foundForm.found_time) {
        uni.showToast({
          title: '请选择拾获时间',
          icon: 'none'
        });
        return;
      }

      if (!this.foundForm.location || !this.foundForm.location.trim()) {
        uni.showToast({
          title: '请输入拾获地点',
          icon: 'none'
        });
        return;
      }

      if (!this.foundForm.contact || !this.foundForm.contact.trim()) {
        uni.showToast({
          title: '请输入联系方式',
          icon: 'none'
        });
        return;
      }

      if (!this.foundForm.description || !this.foundForm.description.trim()) {
        uni.showToast({
          title: '请输入物品描述',
          icon: 'none'
        });
        return;
      }

      this.submitting = true;

      // 显示加载
      uni.showLoading({
        title: '提交中...'
      });

      // 调用发布接口
      this.$api.foundItem.publish(this.foundForm)
        .then(() => {
          uni.hideLoading();
          this.submitting = false;
          uni.showToast({
            title: '发布成功',
            icon: 'success'
          });

          // 重置表单
          this.resetFoundForm();

          // 返回首页
          setTimeout(() => {
            uni.switchTab({
              url: '/pages/index/index'
            });
          }, 1500);
        })
        .catch((error) => {
          uni.hideLoading();
          this.submitting = false;
          uni.showToast({
            title: (error && error.error) || '发布失败，请稍后再试',
            icon: 'none'
          });
        });
    },
    
    // 重置失物表单
    resetLostForm() {
      this.lostForm = {
        name: '',
        category: '',
        lost_time: '',
        location: '',
        contact: '',
        description: '',
        image_url: ''
      };
    },
    
    // 重置招领表单
    resetFoundForm() {
      this.foundForm = {
        name: '',
        category: '',
        found_time: '',
        location: '',
        contact: '',
        description: '',
        image_url: ''
      };
    }
  }
};
</script>

<style lang="scss" scoped>
/* 页面容器样式 */
.publish-container {
  min-height: 100vh;
  background-color: $uni-bg-color-grey;
  display: flex;
  flex-direction: column;
}

/* ===== 标签栏（分段控件） ===== */
.tabs {
  padding: 24rpx;
  background-color: $uni-bg-color;
  box-shadow: 0 2rpx 12rpx rgba(31, 41, 55, 0.04);
}

.publish-segment .lf-segment-item {
  height: 72rpx;
}

/* ===== 表单区域 ===== */
.form-scroll {
  flex: 1;
}

.form-container {
  padding: 24rpx 24rpx 50rpx;
}

.form-card {
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-card;
  padding: 32rpx 28rpx 8rpx;
  box-shadow: $uni-shadow-card;
  margin-bottom: 30rpx;
}

/* 表单项 */
.form-item {
  margin-bottom: 32rpx;
  position: relative;
}

.form-label {
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  margin-bottom: 16rpx;
  display: block;
  font-weight: 500;
}

/* 必填项标记 */
.form-label.required::before {
  content: '*';
  color: $uni-color-error;
  margin-right: 6rpx;
}

/* 表单输入框（浅底圆角字段） */
.form-input {
  height: 88rpx;
  background-color: $uni-bg-color-section;
  border-radius: $uni-radius-md;
  padding: 0 24rpx;
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  border: 2rpx solid transparent;
  box-sizing: border-box;
  transition: border-color 0.15s, background-color 0.15s;

  &:focus {
    border-color: $uni-color-primary;
    background-color: $uni-bg-color;
  }
}

/* 日期选择器容器 */
/* 此容器包裹 uni-datetime-picker：其日历弹层为 position:absolute 且在文档流内，
   加 overflow:hidden 会把弹层裁剪到只剩一行（时间选择器不可用）；
   z-index 需高于底部 tabbar(998)，否则弹层下半部分（确定按钮）会被 tabbar 遮挡 */
.date-picker-container {
  background-color: $uni-bg-color-section;
  border-radius: $uni-radius-md;
  border: 2rpx solid transparent;
  position: relative;
  z-index: 1000;
}

/* 多行文本输入框 */
.form-textarea {
  height: 200rpx;
  background-color: $uni-bg-color-section;
  border-radius: $uni-radius-md;
  padding: 20rpx 24rpx;
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  width: 100%;
  box-sizing: border-box;
  border: 2rpx solid transparent;
  line-height: 1.6;
  transition: border-color 0.15s, background-color 0.15s;

  &:focus {
    border-color: $uni-color-primary;
    background-color: $uni-bg-color;
  }
}

/* 文本计数器 */
.textarea-counter {
  position: absolute;
  right: 24rpx;
  bottom: 20rpx;
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
}

/* ===== 图片上传 ===== */
.upload-container {
  display: flex;
  flex-direction: column;
}

.upload-btn {
  width: 220rpx;
  height: 220rpx;
  background-color: $uni-bg-color-section;
  border-radius: $uni-radius-md;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed $uni-border-color-input;
  transition: border-color 0.15s;

  &:active {
    border-color: $uni-color-primary;
  }
}

.upload-icon {
  margin-bottom: 14rpx;
}

.upload-text {
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
}

.upload-tip {
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
  margin-top: 14rpx;
  line-height: 1.5;
}

/* 类别选择器行 */
.picker-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.picker-value {
  font-size: $uni-font-size-base;
  color: $uni-text-color;
}

.picker-placeholder {
  font-size: $uni-font-size-base;
  color: $uni-text-color-placeholder;
}

/* 图片预览 */
.upload-preview {
  width: 220rpx;
  height: 220rpx;
  position: relative;
  margin-right: 20rpx;
}

.preview-image {
  width: 100%;
  height: 100%;
  border-radius: $uni-radius-md;
  border: 1rpx solid $uni-border-color-split;
}

/* 删除图片按钮 */
.delete-icon {
  position: absolute;
  top: -16rpx;
  right: -16rpx;
  width: 44rpx;
  height: 44rpx;
  background-color: rgba(0, 0, 0, 0.55);
  color: $uni-text-color-inverse;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== 提交按钮 ===== */
.submit-btn {
  height: 92rpx;
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  border-radius: $uni-border-radius-btn;
  font-size: $uni-font-size-lg;
  margin-top: 10rpx;
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

.submit-icon {
  margin-right: 12rpx;
  display: flex;
  align-items: center;
}

.submit-text {
  font-size: $uni-font-size-lg;
  color: $uni-text-color-inverse;
  font-weight: 500;
}

/* ===== 温馨提示 ===== */
.form-tips {
  margin-top: 32rpx;
  background-color: $uni-color-primary-softer;
  border: 2rpx solid rgba($uni-color-primary, 0.12);
  padding: 24rpx;
  border-radius: $uni-radius-md;
}

.tips-title {
  font-size: $uni-font-size-base;
  color: $uni-color-primary;
  font-weight: 600;
  margin-bottom: 12rpx;
  display: block;
}

.tips-content {
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
  line-height: 1.8;
  display: block;
}

/* 未登录引导块样式见 styles/common.scss（.lf-login-guide） */
</style>
