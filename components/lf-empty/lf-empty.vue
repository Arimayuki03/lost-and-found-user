<template>
  <view class="lf-empty">
    <image class="lf-empty-image" :src="imageSrc" mode="aspectFit" />
    <text class="lf-empty-text">{{ text || defaultText }}</text>
    <text v-if="subText" class="lf-empty-sub">{{ subText }}</text>
    <button v-if="buttonText" class="lf-empty-btn" @tap="$emit('action')">{{ buttonText }}</button>
  </view>
</template>

<script>
/**
 * 统一空态组件（插画 + 文案 + 可选按钮）
 * type: items 无物品 | message 无消息 | announcement 无公告 | search 搜索无结果
 */
const IMAGES = {
  items: '/static/empty-items.png',
  message: '/static/empty-message.png',
  announcement: '/static/empty-announcement.png',
  search: '/static/empty-search.png',
};
const TEXTS = {
  items: '暂无物品',
  message: '暂无消息',
  announcement: '暂无公告',
  search: '没有找到相关物品',
};

export default {
  name: 'LfEmpty',
  props: {
    type: { type: String, default: 'items' },
    text: { type: String, default: '' },
    subText: { type: String, default: '' },
    buttonText: { type: String, default: '' },
  },
  emits: ['action'],
  computed: {
    imageSrc() {
      return IMAGES[this.type] || IMAGES.items;
    },
    defaultText() {
      return TEXTS[this.type] || TEXTS.items;
    },
  },
};
</script>

<style lang="scss" scoped>
.lf-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.lf-empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 28rpx;
  opacity: 0.9;
}

.lf-empty-text {
  font-size: $uni-font-size-md;
  color: $uni-text-color-grey;
}

.lf-empty-sub {
  font-size: $uni-font-size-caption;
  color: $uni-text-color-placeholder;
  margin-top: 12rpx;
}

.lf-empty-btn {
  margin-top: 48rpx;
  padding: 0 64rpx;
  height: 80rpx;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: $uni-font-size-base;
  color: $uni-color-primary;
  background-color: $uni-color-primary-soft;
  border-radius: $uni-border-radius-btn;
  border: none;

  &::after {
    border: none;
  }

  &:active {
    opacity: 0.7;
  }
}
</style>
