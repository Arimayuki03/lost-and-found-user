<template>
  <view class="lf-load-more">
    <template v-if="loading">
      <uni-icons type="spinner-cycle" class="lf-spin" :size="18" color="#999999" />
      <text class="lf-load-more-text">加载中...</text>
    </template>
    <text v-else-if="finished" class="lf-load-more-text">{{ nomoreText }}</text>
  </view>
</template>

<script>
/**
 * 触底加载提示：loading 转圈图标 + "没有更多了"
 * 替代各列表页纯文字"加载中.../没有更多数据了"
 */
export default {
  name: 'LfLoadMore',
  props: {
    loading: { type: Boolean, default: false },
    finished: { type: Boolean, default: false },
    nomoreText: { type: String, default: '没有更多了' },
  },
};
</script>

<style lang="scss" scoped>
.lf-load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
  min-height: 48rpx;
}

.lf-load-more-text {
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
  margin-left: 8rpx;
}

.lf-spin {
  animation: lf-rotate 1s linear infinite;
}

@keyframes lf-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
