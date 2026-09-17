<template>
  <view class="top-bg" :style="{ paddingTop: statusBarHeight + 80 + 'rpx' }">
    <!-- 返回按钮（原"<"文本字符改为 uni-icons） -->
    <view class="back-btn" :style="{ top: statusBarHeight + 20 + 'rpx' }" @tap="goBack">
      <uni-icons type="left" color="#ffffff" :size="22" />
    </view>
    <image v-if="showLogo" class="logo" src="/static/logo.png" mode="aspectFit"></image>
    <text class="title">{{ title }}</text>
    <text v-if="subtitle" class="subtitle">{{ subtitle }}</text>
  </view>
</template>

<script>
/**
 * 登录/注册/重置密码三页共用的顶部 hero（2026-09-17 重设计）：
 * 135° 品牌渐变 + 大圆角收尾，表单卡片以负 margin 叠在 hero 上形成层次。
 */
export default {
  name: 'LfAuthHeader',
  props: {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    showLogo: { type: Boolean, default: true },
  },
  emits: ['back'],
  data() {
    // 与原三页保持一致：状态栏高度（H5 为 0，默认 20）
    let statusBarHeight = 20;
    try {
      statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20;
    } catch (e) {
      statusBarHeight = 20;
    }
    return { statusBarHeight };
  },
  methods: {
    goBack() {
      this.$emit('back');
      uni.navigateBack();
    },
  },
};
</script>

<style lang="scss" scoped>
.top-bg {
  min-height: 360rpx;
  padding: 0 40rpx 100rpx; /* 底部留白给表单卡片叠层 */
  background: $uni-gradient-hero;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  border-bottom-left-radius: 48rpx;
  border-bottom-right-radius: 48rpx;
  position: relative;
  box-shadow: 0 16rpx 48rpx rgba(10, 114, 245, 0.25);
}

.back-btn {
  position: absolute;
  left: 30rpx;
  width: 64rpx;
  height: 64rpx;
  background-color: rgba(255, 255, 255, 0.22);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  &:active {
    background-color: rgba(255, 255, 255, 0.35);
  }
}

.logo {
  width: 110rpx;
  height: 110rpx;
  margin-bottom: 20rpx;
  border-radius: 28rpx;
  background-color: rgba(255, 255, 255, 0.92);
  padding: 10rpx;
  box-sizing: content-box;
}

.title {
  font-size: 40rpx;
  color: #fff;
  font-weight: 600;
  letter-spacing: 2rpx;
}

.subtitle {
  font-size: $uni-font-size-base;
  color: rgba(255, 255, 255, 0.75);
  margin-top: 12rpx;
}
</style>
