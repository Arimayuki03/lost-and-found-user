<template>
  <view class="container">
    <view class="form-container">
      
      <view class="form-item">
        <text class="label">物品图片</text>
        <view class="image-upload-container">
          <view class="image-upload" @click="chooseImage">
            <image v-if="formData.image_url" :src="formData.image_url" mode="aspectFill" class="preview-image"></image>
            <view v-else class="upload-placeholder">
              <uni-icons class="upload-icon" type="camera-filled" size="30" :color="colorSecondary"></uni-icons>
              <text>点击上传照片</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="form-item">
        <text class="label">物品名称</text>
        <input class="input" v-model="formData.name" placeholder="请输入物品名称" maxlength="100" />
      </view>
      
      <view class="form-item">
        <text class="label">物品类别</text>
        <picker mode="selector" :range="categories" :value="categoryIndex" @change="onCategoryChange">
          <view class="input picker-input">
            <text :class="formData.category ? 'picker-value' : 'picker-placeholder'">{{ formData.category || '请选择物品类别' }}</text>
            <uni-icons type="bottom" size="16" :color="colorGrey"></uni-icons>
          </view>
        </picker>
      </view>
      
      <view class="form-item">
        <text class="label">丢失时间</text>
        <uni-datetime-picker 
          type="datetime" 
          v-model="formData.lost_time" 
          @change="onDateTimeChange"
          :border="true"
          placeholder="请选择丢失时间"
        />
      </view>
      
      <view class="form-item">
        <text class="label">丢失地点</text>
        <input class="input" v-model="formData.location" placeholder="请输入丢失地点" maxlength="200" />
      </view>
      
      <view class="form-item">
        <text class="label">联系方式</text>
        <input class="input" v-model="formData.contact" placeholder="请输入联系方式" maxlength="50" />
      </view>
      
      <view class="form-item">
        <text class="label">物品描述</text>
        <textarea class="textarea" v-model="formData.description" placeholder="请描述物品特征" maxlength="5000" />
      </view>
      
      <view class="form-item status-item">
        <text class="label">是否已找到</text>
        <switch :checked="formData.is_completed" @change="onStatusChange" :color="colorPrimary" />
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
import { COLOR_PRIMARY, COLOR_GREY, COLOR_SECONDARY } from '@/config/ui';
import request from '@/utils/request';

/**
 * 丢失物品编辑组件
 * 用于编辑已发布的丢失物品信息
 */
export default {
  data() {
    return {
      colorGrey: COLOR_GREY, // 辅助图标灰（与 $uni-text-color-grey 同步）
      colorSecondary: COLOR_SECONDARY, // 更弱一级灰（箭头/占位图标）
      colorPrimary: COLOR_PRIMARY, // switch 主题色（与全站主色一致）
      itemId: null, // 物品ID
      // 物品类别枚举（与发布页/首页分类同源）
      categories: ['电子产品', '证件', '钱包', '钥匙', '书籍', '衣物', '饰品', '其他'],
      submitting: false, // 是否正在提交（防重复提交）
      uploading: false, // 是否正在上传图片（防重复上传）
      formData: {
        name: '', // 物品名称
        category: '', // 物品类别
        description: '', // 物品描述
        lost_time: '', // 丢失时间
        location: '', // 丢失地点
        contact: '', // 联系方式
        image_url: '', // 物品图片
        is_completed: false // 是否已找到
      },
      originalData: null // 用于存储原始数据，比较是否有修改
    }
  },
  
  computed: {
    // picker 当前选中索引（AI 回填的类别不在枚举中时为 -1）
    categoryIndex() {
      return this.categories.indexOf(this.formData.category);
    },
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
      // 缺少 id 参数时页面不可用，直接返回，避免提交到 /user/lost-items/null
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
    onCategoryChange(e) {
      this.formData.category = this.categories[e.detail.value];
    },

    /**
     * 获取物品详情
     * 从服务器获取当前编辑物品的详细信息
     */
    fetchItemDetails() {
      uni.showLoading({ title: '加载中...' });

      request({
        url: `/user/lost-items/${this.itemId}/detail`,
        method: 'GET'
      }).then((data) => {
        // 只拷贝表单需要的字段，避免把 id/user_id/created_at 等只读字段一并回传给 PUT 接口
        const d = data || {};
        this.formData = {
          name: d.name || '',
          category: d.category || '',
          description: d.description || '',
          lost_time: d.lost_time || '',
          location: d.location || '',
          contact: d.contact || '',
          image_url: d.image_url || '',
          is_completed: !!d.is_completed
        };
        // 保存原始数据副本
        this.originalData = JSON.parse(JSON.stringify(this.formData));
      }).catch(() => {
        uni.showToast({
          title: '获取物品信息失败',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
      });
    },
    
    /**
     * 处理日期时间选择
     * @param {String} value - 选择的日期时间值
     */
    onDateTimeChange(value) {
      this.formData.lost_time = value;
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
      // 并发保护：上一次上传尚未完成时拒绝再次进入
      if (this.uploading) {
        uni.showToast({ title: '正在上传中，请稍候', icon: 'none' });
        return;
      }
      uni.chooseImage({
        count: 1, // 最多选择1张图片
        sizeType: ['compressed'], // 压缩图片
        sourceType: ['album', 'camera'], // 来源：相册或相机
        success: (res) => {
          // 客户端大小预检：超过 8MB 直接拒绝（部分端 tempFiles 元素无 size 字段，跳过检查）
          const tempFile = res.tempFiles && res.tempFiles[0];
          if (tempFile && typeof tempFile.size === 'number' && tempFile.size > 8 * 1024 * 1024) {
            uni.showToast({ title: '图片不能超过8MB，请重新选择', icon: 'none' });
            return;
          }
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
      this.uploading = true;

      request.uploadFile({
        url: '/common/images/upload',
        filePath: filePath,
        name: 'file'
      }).then((result) => {
        // 提取图片URL（uploadFile 帮助函数已解析 JSON）
        const imageUrl = this.extractImageUrlFromData(result);

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
      }).catch(() => {
        uni.showToast({
          title: '图片上传失败',
          icon: 'none'
        });
      }).finally(() => {
        this.uploading = false;
        uni.hideLoading();
      });
    },

    /**
     * 从上传响应数据中提取图片URL
     * @param {Object|String} data - 已解析的响应数据
     * @return {String|null} 提取的图片URL或null
     */
    extractImageUrlFromData(data) {
      let imageUrl = null;

      // 尝试读取常见字段
      if (data && typeof data === 'object') {
        if (data.file_url) {
          imageUrl = data.file_url;
        } else if (data.url) {
          imageUrl = data.url;
        } else if (data.image_url) {
          imageUrl = data.image_url;
        }
        return imageUrl;
      }

      // 响应不是 JSON 对象时，仅当整体是一个合法 URL 才采用，避免把含链接的错误文本当图片地址
      if (typeof data === 'string' && /^https?:\/\/\S+$/.test(data.trim())) {
        imageUrl = data.trim();
      }

      return imageUrl;
    },

    /**
     * 识别图片标签
     * @param {String} imageUrl - 图片URL
     */
    recognizeImageLabels(imageUrl) {
      uni.showLoading({ title: '识别物品中...' });

      request({
        url: '/common/images/labels',
        method: 'POST',
        data: { image_url: imageUrl }
      }).then((data) => {
        this.processImageLabels(data);
      }).catch(() => {
        uni.showToast({
          title: '图片识别失败，请手动填写类别',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
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

      request({
        url: `/user/lost-items/${this.itemId}`,
        method: 'PUT',
        data: this.formData
      }).then((data) => {
        uni.showToast({
          title: '保存成功',
          icon: 'success'
        });

        // 如果物品需要审核，提示用户
        if (data.is_under_review) {
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
      }).catch((error) => {
        uni.showToast({
          title: (error && error.error) || '保存失败',
          icon: 'none'
        });
      }).finally(() => {
        uni.hideLoading();
        this.submitting = false;
      });
    },

    /**
     * 表单验证
     * @return {Boolean} 验证结果
     */
    validateForm() {
      const f = this.formData;
      if (!f.name || !f.name.trim() || !f.category || !f.category.trim() ||
          !f.lost_time || !f.contact || !f.contact.trim()) {
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

<style lang="scss" scoped>
/* 页面容器 */
.container {
  min-height: 100vh;
  background-color: $uni-bg-color-grey;
  padding: 24rpx;
  box-sizing: border-box;
}

/* 表单卡片 */
.form-container {
  background-color: $uni-bg-color;
  border-radius: $uni-border-radius-card;
  padding: 32rpx 28rpx;
  box-shadow: $uni-shadow-card;
}

/* 表单项 */
.form-item {
  margin-bottom: 32rpx;
}

/* 表单标签 */
.label {
  display: block;
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  font-weight: 500;
  margin-bottom: 16rpx;
}

/* 输入框和选择器（浅底圆角字段，与发布页同源） */
.input, .picker, .textarea {
  width: 100%;
  height: 88rpx;
  background-color: $uni-bg-color-section;
  border: 2rpx solid transparent;
  border-radius: $uni-radius-md;
  padding: 0 24rpx;
  font-size: $uni-font-size-base;
  color: $uni-text-color;
  box-sizing: border-box;
  transition: border-color 0.15s, background-color 0.15s;

  &:focus {
    border-color: $uni-color-primary;
    background-color: $uni-bg-color;
  }
}

/* 文本域 */
.textarea {
  height: 200rpx;
  padding: 20rpx 24rpx;
  line-height: 1.6;
}

/* 选择器文本 */
.picker-text {
  height: 88rpx;
  line-height: 88rpx;
  color: $uni-text-color;
}

/* 图片上传容器 */
.image-upload-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* 图片上传区域 */
.image-upload {
  width: 260rpx;
  height: 260rpx;
  background-color: $uni-bg-color-section;
  border: 2rpx dashed $uni-border-color-input;
  border-radius: $uni-radius-md;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: $uni-text-color-grey;
  font-size: $uni-font-size-caption;
  overflow: hidden;
  transition: border-color 0.15s;

  &:active {
    border-color: $uni-color-primary;
  }
}

/* 上传图标 */
.upload-icon {
  margin-bottom: 14rpx;
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

/* 预览图片 */
.preview-image {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

/* 状态项：cell 行风格 */
.status-item {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: $uni-bg-color-section;
  border-radius: $uni-radius-md;
  padding: 20rpx 24rpx;
  margin-bottom: 0;

  .label {
    margin-bottom: 0;
  }
}

/* ===== 按钮组 ===== */
.btn-group {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  margin-top: 40rpx;
}

/* 按钮基础样式 */
.btn {
  flex: 1;
  width: auto;
  height: 88rpx;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-radius: $uni-border-radius-btn;
  font-size: $uni-font-size-md;
  font-weight: 500;
  border: none;

  &::after {
    border: none;
  }

  &:active {
    transform: scale(0.99);
  }
}

/* 取消按钮 */
.btn-cancel {
  background-color: $uni-bg-color-section;
  color: $uni-text-color-grey;
}

/* 提交按钮 */
.btn-submit {
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  box-shadow: $uni-shadow-btn;

  &:active {
    background-color: $uni-color-primary-deep;
  }
}
</style>
