<template>
  <view class="container">
    <view class="form-container">
      
      <view class="form-item">
        <text class="label">物品图片</text>
        <view class="image-upload-container">
          <view class="image-upload" @click="chooseImage">
            <image v-if="formData.image_url" :src="formData.image_url" mode="aspectFill" class="preview-image"></image>
            <view v-else class="upload-placeholder">
              <text class="upload-icon">+</text>
              <text>上传图片</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="form-item">
        <text class="label">物品名称</text>
        <input class="input" v-model="formData.name" placeholder="请输入物品名称" />
      </view>
      
      <view class="form-item">
        <text class="label">物品类别</text>
        <input class="input" v-model="formData.category" placeholder="请输入物品类别" />
      </view>
      
      <view class="form-item">
        <text class="label">拾取时间</text>
        <uni-datetime-picker 
          type="datetime" 
          v-model="formData.found_time" 
          @change="onDateTimeChange"
          :border="true"
          placeholder="请选择拾取时间"
        />
      </view>
      
      <view class="form-item">
        <text class="label">拾取地点</text>
        <input class="input" v-model="formData.location" placeholder="请输入拾取地点" />
      </view>
      
      <view class="form-item">
        <text class="label">联系方式</text>
        <input class="input" v-model="formData.contact" placeholder="请输入联系方式" />
      </view>
      
      <view class="form-item">
        <text class="label">物品描述</text>
        <textarea class="textarea" v-model="formData.description" placeholder="请描述物品特征" />
      </view>
      
      <view class="form-item status-item">
        <text class="label">是否已归还</text>
        <switch :checked="formData.is_completed" @change="onStatusChange" color="#007AFF" />
      </view>
      
      <view class="btn-group">
        <button class="btn btn-cancel" @click="goBack">取消</button>
        <button class="btn btn-submit" @click="submitForm">保存</button>
      </view>
    </view>
  </view>
</template>

<script>
import { BASE_URL } from '@/config';

/**
 * 招领物品编辑组件
 * 用于编辑已发布的招领物品信息
 */
export default {
  data() {
    return {
      itemId: null, // 物品ID
      submitting: false, // 是否正在提交（防重复提交）
      formData: {
        name: '', // 物品名称
        category: '', // 物品类别
        description: '', // 物品描述
        found_time: '', // 拾取时间
        location: '', // 拾取地点
        contact: '', // 联系方式
        image_url: '', // 物品图片
        is_completed: false // 是否已归还
      },
      originalData: null // 用于存储原始数据，比较是否有修改
    }
  },
  
  computed: {
    // API基础URL
    baseUrl() {
      return BASE_URL;
    }
  },
  
  /**
   * 页面加载时初始化
   * @param {Object} options - 页面参数，包含id
   */
  onLoad(options) {
    if (options.id) {
      this.itemId = options.id;
      this.fetchItemDetails();
    } else {
      // 缺少 id 参数时页面不可用，直接返回，避免提交到 /user/found-items/null
      uni.showToast({
        title: '缺少物品ID，无法编辑',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    }
  },
  
  methods: {
    /**
     * 获取物品详情
     * 从服务器获取当前编辑物品的详细信息
     */
    fetchItemDetails() {
      uni.showLoading({ title: '加载中...' });
      
      uni.request({
        url: `${this.baseUrl}/user/found-items/${this.itemId}/detail`,
        method: 'GET',
        header: {
          'Authorization': 'Bearer ' + uni.getStorageSync('token')
        },
        success: (res) => {
          if (res.statusCode === 200) {
            // 只拷贝表单需要的字段，避免把 id/user_id/created_at 等只读字段一并回传给 PUT 接口
            const d = res.data || {};
            this.formData = {
              name: d.name || '',
              category: d.category || '',
              description: d.description || '',
              found_time: d.found_time || '',
              location: d.location || '',
              contact: d.contact || '',
              image_url: d.image_url || '',
              is_completed: !!d.is_completed
            };
            // 保存原始数据副本
            this.originalData = JSON.parse(JSON.stringify(this.formData));
          } else {
            uni.showToast({
              title: '获取物品信息失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          uni.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          });
        },
        complete: () => {
          uni.hideLoading();
        }
      });
    },
    
    /**
     * 处理日期时间选择
     * @param {String} value - 选择的日期时间值
     */
    onDateTimeChange(value) {
      this.formData.found_time = value;
    },
    
    /**
     * 处理物品状态切换
     * @param {Object} e - 事件对象
     */
    onStatusChange(e) {
      this.formData.is_completed = e.detail.value;
    },
    
    /**
     * 选择图片
     * 打开相册或相机选择图片
     */
    chooseImage() {
      uni.chooseImage({
        count: 1, // 最多选择1张图片
        sizeType: ['compressed'], // 压缩图片
        sourceType: ['album', 'camera'], // 来源：相册或相机
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0];
          this.uploadImage(tempFilePath);
        }
      });
    },
    
    /**
     * 上传图片到服务器
     * @param {String} filePath - 临时文件路径
     */
    uploadImage(filePath) {
      uni.showLoading({ title: '上传中...' });
      
      uni.uploadFile({
        url: `${this.baseUrl}/common/images/upload`,
        filePath: filePath,
        name: 'file',
        header: {
          'Authorization': 'Bearer ' + uni.getStorageSync('token')
        },
        success: (uploadRes) => {
          try {
            if (uploadRes.statusCode === 200) {
              // 提取图片URL
              const imageUrl = this.extractImageUrl(uploadRes);
              
              if (imageUrl) {
                // 设置图片URL（Vue 3 无 $set，直接赋值即为响应式）
                this.formData.image_url = imageUrl;
                
                uni.showToast({
                  title: '图片上传成功',
                  icon: 'success'
                });
                
                // 识别图片类别
                this.recognizeImageLabels(imageUrl);
              } else {
                uni.showToast({
                  title: '解析图片地址失败',
                  icon: 'none'
                });
              }
            } else {
              uni.showToast({
                title: '图片上传失败',
                icon: 'none'
              });
            }
          } catch (error) {
            uni.showToast({
              title: '图片上传处理失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          uni.showToast({
            title: '图片上传失败',
            icon: 'none'
          });
        },
        complete: () => {
          uni.hideLoading();
        }
      });
    },
    
    /**
     * 从上传响应中提取图片URL
     * @param {Object} uploadRes - 上传响应对象
     * @return {String|null} 提取的图片URL或null
     */
    extractImageUrl(uploadRes) {
      let imageUrl = null;
      
      // 尝试解析JSON响应
      try {
        const result = JSON.parse(uploadRes.data);
        
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
      
      // 如果上述方法无法提取URL，尝试从整个响应字符串中匹配
      if (!imageUrl) {
        const responseStr = JSON.stringify(uploadRes);
        const urlMatch = responseStr.match(/(http[s]?:\/\/[^\s"']+)/);
        if (urlMatch && urlMatch[1]) {
          imageUrl = urlMatch[1];
        }
      }
      
      return imageUrl;
    },
    
    /**
     * 识别图片标签
     * @param {String} imageUrl - 图片URL
     */
    recognizeImageLabels(imageUrl) {
      uni.showLoading({ title: '识别物品中...' });
      
      uni.request({
        url: `${this.baseUrl}/common/images/labels`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + uni.getStorageSync('token')
        },
        data: { image_url: imageUrl },
        success: (res) => {
          if (res.statusCode === 200) {
            this.processImageLabels(res.data);
          }
        },
        fail: () => {
          // 失败处理已在complete中进行
        },
        complete: () => {
          uni.hideLoading();
        }
      });
    },
    
    /**
     * 处理识别到的图片标签
     * @param {Object} labelData - 标签数据
     */
    processImageLabels(labelData) {
      // 如果返回了标签信息
      if (labelData.FirstCategory || labelData.SecondCategory) {
        // 获取类别信息
        let category = labelData.SecondCategory || labelData.FirstCategory || '';
        
        // 类别映射字典
        const categoryMapping = {
          'Electronics': '电子产品',
          'Document': '证件',
          'Wallet': '钱包/钱物',
          'Key': '钥匙',
          'Book': '书籍',
          'Clothing': '衣物'
        };
        
        // 应用映射
        if (categoryMapping[category]) {
          category = categoryMapping[category];
        } else {
          // 尝试匹配关键词
          for (const [key, value] of Object.entries(categoryMapping)) {
            if (category.toLowerCase().includes(key.toLowerCase()) || 
                (labelData.FirstCategory && labelData.FirstCategory.toLowerCase().includes(key.toLowerCase()))) {
              category = value;
              break;
            }
          }
        }
        
        // 设置类别
        if (category) {
          this.formData.category = category;
          this.$forceUpdate();
          
          uni.showToast({
            title: '已自动识别物品类别',
            icon: 'success'
          });
        }
      }
    },
    
    /**
     * 提交表单
     * 将编辑后的物品信息提交到服务器
     */
    submitForm() {
      // 防止重复提交
      if (this.submitting) return;

      // 表单验证
      if (!this.validateForm()) {
        return;
      }

      this.submitting = true;
      uni.showLoading({ title: '保存中...' });
      
      uni.request({
        url: `${this.baseUrl}/user/found-items/${this.itemId}`,
        method: 'PUT',
        header: {
          'Authorization': 'Bearer ' + uni.getStorageSync('token'),
          'Content-Type': 'application/json'
        },
        data: this.formData,
        success: (res) => {
          uni.hideLoading();
          this.submitting = false;

          if (res.statusCode === 200) {
            uni.showToast({
              title: '保存成功',
              icon: 'success'
            });
            
            // 如果物品需要审核，提示用户
            if (res.data.is_under_review) {
              setTimeout(() => {
                uni.showModal({
                  title: '提示',
                  content: '您的修改需要审核后才能显示',
                  showCancel: false,
                  success: () => {
                    this.goBack();
                  }
                });
              }, 1500);
            } else {
              setTimeout(() => {
                this.goBack();
              }, 1500);
            }
          } else {
            uni.showToast({
              title: res.data.error || '保存失败',
              icon: 'none'
            });
          }
        },
        fail: () => {
          uni.hideLoading();
          this.submitting = false;
          uni.showToast({
            title: '网络错误，请重试',
            icon: 'none'
          });
        }
      });
    },

    /**
     * 表单验证
     * @return {Boolean} 验证结果
     */
    validateForm() {
      const f = this.formData;
      if (!f.name || !f.name.trim() || !f.category || !f.category.trim() ||
          !f.found_time || !f.contact || !f.contact.trim()) {
        uni.showToast({
          title: '请填写必要信息',
          icon: 'none'
        });
        return false;
      }
      return true;
    },
    
    /**
     * 返回上一页
     */
    goBack() {
      uni.navigateBack();
    }
  }
}
</script>

<style>
/* 页面容器 */
.container {
  padding: 20rpx;
}

/* 表单容器 */
.form-container {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 30rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
}

/* 表单标题 */
.form-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 40rpx;
  text-align: center;
}

/* 表单项 */
.form-item {
  margin-bottom: 30rpx;
}

/* 表单标签 */
.label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

/* 输入框和选择器 */
.input, .picker, .textarea {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

/* 文本域 */
.textarea {
  height: 200rpx;
  padding: 20rpx;
}

/* 选择器文本 */
.picker-text {
  height: 80rpx;
  line-height: 80rpx;
  color: #333;
}

/* 图片上传容器 */
.image-upload-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* 图片上传区域 */
.image-upload {
  width: 300rpx;
  height: 300rpx;
  border: 1rpx dashed #ddd;
  border-radius: 8rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
}

/* 上传图标 */
.upload-icon {
  font-size: 60rpx;
  margin-bottom: 10rpx;
}

/* 预览图片 */
.preview-image {
  width: 100%;
  height: 100%;
  border-radius: 8rpx;
}

/* 状态项样式 */
.status-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

/* 按钮组 */
.btn-group {
  display: flex;
  justify-content: space-between;
  margin-top: 50rpx;
}

/* 按钮基础样式 */
.btn {
  width: 45%;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 20px;
  font-size: 30rpx;
}

/* 取消按钮 */
.btn-cancel {
  background-color: #f5f5f5;
  color: #666;
}

/* 提交按钮 */
.btn-submit {
  background-color: #007AFF;
  color: #fff;
}
</style> 