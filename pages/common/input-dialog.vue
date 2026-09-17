<template>
  <view class="input-dialog-container">
    <uni-card :is-shadow="false" :border="false">
      <!-- 对话框标题 -->
      <text slot="title" class="dialog-title">{{ title }}</text>
      
      <view class="dialog-content">
        <!-- 输入框组件 -->
        <uni-easyinput
          v-model="inputValue"
          :placeholder="placeholder"
          focus
        ></uni-easyinput>
        
        <!-- 按钮区域 -->
        <view class="dialog-actions">
          <button class="uni-btn cancel-btn" @tap="handleCancel">取消</button>
          <button class="uni-btn confirm-btn" @tap="handleConfirm">确认</button>
        </view>
      </view>
    </uni-card>
  </view>
</template>

<script>
/**
 * 输入对话框组件
 * 用于获取用户的单行文本输入
 */
export default {
  data() {
    return {
      title: '请输入', // 默认标题
      placeholder: '', // 输入框占位符
      inputValue: '', // 输入框值
      callbackEventName: 'confirm' // 默认回调事件名称
    };
  },
  
  /**
   * 页面加载时处理参数
   * @param {Object} options - 页面参数，可包含title、placeholder和callbackEventName
   */
  onLoad(options) {
    if (options.title) {
      this.title = decodeURIComponent(options.title);
    }
    
    if (options.placeholder) {
      this.placeholder = decodeURIComponent(options.placeholder);
    }
    
    if (options.callbackEventName) {
      this.callbackEventName = options.callbackEventName;
    }
  },
  
  methods: {
    /**
     * 处理确认按钮点击
     * 将输入值通过事件通道传回调用页面
     */
    handleConfirm() {
      const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel();
      if (!eventChannel) return;

      // 触发指定的回调事件，传递输入值
      eventChannel.emit(this.callbackEventName, {
        value: this.inputValue
      });

      // 关闭当前页面，返回上一页
      uni.navigateBack();
    },

    /**
     * 处理取消按钮点击
     * 触发cancel事件并返回上一页
     */
    handleCancel() {
      const eventChannel = this.getOpenerEventChannel && this.getOpenerEventChannel();
      if (!eventChannel) return;
      eventChannel.emit('cancel');
      uni.navigateBack();
    }
  }
};
</script>

<style lang="scss" scoped>
/* 对话框容器样式 */
.input-dialog-container {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: $uni-bg-color-grey;
}

/* 对话框标题样式 */
.dialog-title {
  font-size: $uni-font-size-title;
  font-weight: 600;
  color: $uni-text-color;
  text-align: center;
  margin-bottom: 30rpx;
}

/* 内容区域样式 */
.dialog-content {
  padding: 20rpx 0;
}

/* 按钮区域样式 */
.dialog-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 40rpx;
  gap: 24rpx;
}

/* 通用按钮样式 */
.uni-btn {
  flex: 1;
  width: auto;
  height: 84rpx;
  border-radius: $uni-border-radius-btn;
  font-size: $uni-font-size-base;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;

  &::after {
    border: none;
  }

  &:active {
    transform: scale(0.99);
  }
}

/* 取消按钮样式 */
.cancel-btn {
  background-color: $uni-bg-color-section;
  color: $uni-text-color-grey;
}

/* 确认按钮样式 */
.confirm-btn {
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  box-shadow: $uni-shadow-btn;
}
</style> 