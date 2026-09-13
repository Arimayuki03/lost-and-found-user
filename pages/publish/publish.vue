<template>
  <view class="publish-container">
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
      <!-- 切换标签：失物/招领 -->
      <view class="tabs">
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'lost' }"
          @tap="switchTab('lost')"
        >
          <view class="tab-icon">
            <uni-icons type="paperplane" size="20"></uni-icons>
          </view>
          <text class="tab-text">发布失物信息</text>
        </view>
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'found' }"
          @tap="switchTab('found')"
        >
          <view class="tab-icon">
            <uni-icons type="paperplane-filled" size="20"></uni-icons>
          </view>
          <text class="tab-text">发布招领信息</text>
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
                  <text class="delete-icon" @tap="deleteLostImage">×</text>
                </view>
                <view class="upload-btn" @tap="chooseImage('lost')" v-else>
                  <text class="upload-icon">+</text>
                  <text class="upload-text">上传图片</text>
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
                maxlength="50"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label required">物品类别</text>
              <input 
                class="form-input" 
                type="text" 
                v-model="lostForm.category" 
                placeholder="请输入物品类别" 
                maxlength="20"
              />
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
                maxlength="100"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label required">联系方式</text>
              <input 
                class="form-input" 
                type="text" 
                v-model="lostForm.contact" 
                placeholder="请输入联系方式" 
                maxlength="30"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label required">物品描述</text>
              <textarea 
                class="form-textarea" 
                v-model="lostForm.description" 
                placeholder="请详细描述物品特征、遗失经过等信息" 
                maxlength="300"
              />
              <text class="textarea-counter">{{ lostForm.description.length }}/300</text>
            </view>
          </view>
          
          <button class="submit-btn" @tap="submitLostForm">
            <view class="submit-icon">
              <uni-icons type="paperplane-filled" size="18" color="#fff"></uni-icons>
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
                  <text class="delete-icon" @tap="deleteFoundImage">×</text>
                </view>
                <view class="upload-btn" @tap="chooseImage('found')" v-else>
                  <text class="upload-icon">+</text>
                  <text class="upload-text">上传图片</text>
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
                maxlength="50"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label required">物品类别</text>
              <input 
                class="form-input" 
                type="text" 
                v-model="foundForm.category" 
                placeholder="请输入物品类别" 
                maxlength="20"
              />
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
                maxlength="100"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label required">联系方式</text>
              <input 
                class="form-input" 
                type="text" 
                v-model="foundForm.contact" 
                placeholder="请输入联系方式" 
                maxlength="30"
              />
            </view>
            
            <view class="form-item">
              <text class="form-label required">物品描述</text>
              <textarea 
                class="form-textarea" 
                v-model="foundForm.description" 
                placeholder="请详细描述物品特征、拾获经过等信息" 
                maxlength="300"
              />
              <text class="textarea-counter">{{ foundForm.description.length }}/300</text>
            </view>
          </view>
          
          <button class="submit-btn" @tap="submitFoundForm">
            <view class="submit-icon">
              <uni-icons type="paperplane-filled" size="18" color="#fff"></uni-icons>
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

export default {
  data() {
    return {
      isLoggedIn: false,
      submitting: false, // 是否正在提交（防重复提交）
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

  methods: {
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
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          
          // 上传图片
          uni.showLoading({
            title: '上传中...'
          });
          
          // 上传图片到服务器
          uni.uploadFile({
            url: `${BASE_URL}/common/images/upload`,
            filePath: tempFilePath,
            name: 'file',
            header: {
              'Authorization': 'Bearer ' + uni.getStorageSync('token')
            },
            success: (uploadRes) => {
              try {
                
                // 检查状态码
                if (uploadRes.statusCode === 200) {
                  let result;
                  let imageUrl = null;
                  
                  // 尝试解析JSON响应
                  try {
                    result = JSON.parse(uploadRes.data);
                    
                    // 检查各种可能的字段
                    if (result.file_url) {
                      imageUrl = result.file_url;
                    } else if (result.url) {
                      imageUrl = result.url;
                    } else if (result.image_url) {
                      imageUrl = result.image_url;
                    }
                  } catch (parseError) {
                    // 响应不是 JSON 时，仅当整体是一个合法 URL 才采用，避免把含链接的错误文本当图片地址
                    if (typeof uploadRes.data === 'string' && /^https?:\/\/\S+$/.test(uploadRes.data.trim())) {
                      imageUrl = uploadRes.data.trim();
                    }
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
                    // 尝试从整个响应对象中查找URL
                    const responseStr = JSON.stringify(uploadRes);
                    const urlMatch = responseStr.match(/(http[s]?:\/\/[^\s"']+)/);
                    if (urlMatch && urlMatch[1]) {
                      imageUrl = urlMatch[1];
                      
                      if (type === 'lost') {
                        this.lostForm.image_url = imageUrl;
                      } else {
                        this.foundForm.image_url = imageUrl;
                      }
                      
                      // 调用后端接口识别图片标签
                      this.recognizeImageLabels(imageUrl, type);
                      
                      uni.hideLoading();
                      uni.showToast({
                        title: '图片上传成功',
                        icon: 'success'
                      });
                    } else {
                      uni.hideLoading();
                      uni.showToast({
                        title: '图片上传成功，但获取URL失败',
                        icon: 'none'
                      });
                    }
                  }
                } else {
                  uni.hideLoading();
                  uni.showToast({
                    title: '图片上传失败',
                    icon: 'none'
                  });
                }
              } catch (error) {
                uni.hideLoading();
                uni.showToast({
                  title: '上传过程中出错',
                  icon: 'none'
                });
              }
            },
            fail: (err) => {
              uni.hideLoading();
              uni.showToast({
                title: '网络错误，上传失败',
                icon: 'none'
              });
            }
          });
        }
      });
    },
    
    // 识别图片标签
    recognizeImageLabels(imageUrl, type) {
      uni.showLoading({
        title: '识别物品中...'
      });
      
      uni.request({
        url: `${BASE_URL}/common/images/labels`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + uni.getStorageSync('token')
        },
        data: {
          image_url: imageUrl
        },
        success: (res) => {
          uni.hideLoading();
          
          if (res.statusCode === 200) {
            
            // 如果返回了标签信息
            if (res.data.FirstCategory || res.data.SecondCategory) {
              // 根据返回的标签设置物品类别
              let category = '';
              
              // 优先使用SecondCategory作为物品类别
              if (res.data.SecondCategory) {
                category = res.data.SecondCategory;
              } else if (res.data.FirstCategory) {
                category = res.data.FirstCategory;
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
                      (res.data.FirstCategory && res.data.FirstCategory.toLowerCase().includes(key.toLowerCase()))) {
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
          }
        },
        fail: (err) => {
          uni.hideLoading();
          uni.showToast({
            title: '图片识别失败，请手动填写类别',
            icon: 'none'
          });
        }
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

<style lang="scss">
/* 页面容器样式 */
.publish-container {
  min-height: 100vh;
  background-color: #f8f8f8;
  display: flex;
  flex-direction: column;
}

/* 标签栏样式 */
.tabs {
  display: flex;
  height: 100rpx;
  background-color: #fff;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  position: relative;
  flex-direction: column;
  padding: 10rpx 0;
}

.tab-icon {
  margin-bottom: 5rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-text {
  font-size: 26rpx;
}

/* 激活状态的标签样式 */
.tab-item.active {
  color: #007AFF;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 4rpx;
  background-color: #007AFF;
  border-radius: 2rpx;
}

/* 表单区域样式 */
.form-scroll {
  flex: 1;
}

.form-container {
  padding: 20rpx 30rpx 50rpx;
}

.form-card {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 30rpx;
}

/* 表单项样式 */
.form-item {
  margin-bottom: 30rpx;
  position: relative;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  display: block;
  font-weight: 500;
}

/* 必填项标记 */
.form-label.required::before {
  content: '*';
  color: #ff4d4f;
  margin-right: 5rpx;
}

/* 表单输入框样式 */
.form-input {
  height: 90rpx;
  background-color: #f8f8f8;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  color: #333;
  border: 1rpx solid #eee;
}

/* 日期选择器容器 */
.date-picker-container {
  background-color: #f8f8f8;
  border-radius: 10rpx;
  border: 1rpx solid #eee;
  overflow: hidden;
}

/* 多行文本输入框样式 */
.form-textarea {
  height: 200rpx;
  background-color: #f8f8f8;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 28rpx;
  color: #333;
  width: auto;
  border: 1rpx solid #eee;
}

/* 文本计数器 */
.textarea-counter {
  position: absolute;
  right: 20rpx;
  bottom: 20rpx;
  font-size: 24rpx;
  color: #999;
}

/* 图片上传区域样式 */
.upload-container {
  display: flex;
  flex-direction: column;
}

.upload-btn {
  width: 200rpx;
  height: 200rpx;
  background-color: #f8f8f8;
  border-radius: 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1rpx dashed #ddd;
}

.upload-icon {
  font-size: 60rpx;
  color: #ccc;
  margin-bottom: 10rpx;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
}

.upload-tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

/* 图片预览区域样式 */
.upload-preview {
  width: 200rpx;
  height: 200rpx;
  position: relative;
  margin-right: 20rpx;
}

.preview-image {
  width: 100%;
  height: 100%;
  border-radius: 10rpx;
  border: 1rpx solid #eee;
}

/* 删除图片按钮 */
.delete-icon {
  position: absolute;
  top: -20rpx;
  right: -20rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

/* 提交按钮样式 */
.submit-btn {
  height: 90rpx;
  background: linear-gradient(to right, #007AFF, #5AC8FA);
  color: #fff;
  border-radius: 45rpx;
  font-size: 32rpx;
  margin-top: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 5rpx 15rpx rgba(0, 122, 255, 0.3);
}

.submit-icon {
  margin-right: 10rpx;
  display: flex;
  align-items: center;
}

.submit-text {
  font-size: 28rpx;
  color: #fff;
}

/* 表单提示信息样式 */
.form-tips {
  margin-top: 40rpx;
  background-color: #f8f8f8;
  padding: 20rpx;
  border-radius: 10rpx;
}

.tips-title {
  font-size: 26rpx;
  color: #666;
  font-weight: bold;
  margin-bottom: 10rpx;
  display: block;
}

.tips-content {
  font-size: 24rpx;
  color: #999;
  line-height: 1.6;
  display: block;
}

/* 未登录状态样式 */
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

/* 登录按钮组样式 */
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
  color: #007AFF;
  border: 1px solid #007AFF;
}
</style> 