<template>
  <text class="lf-status-tag" :class="'status-' + status">{{ label }}</text>
</template>

<script>
/**
 * 统一状态标签（2026-09-17 重设计）：
 * "浅 tint 底 + 同色文字"风格，一处定义颜色映射。
 * status:
 *  - open       进行中（寻找中/招领中）→ 主色
 *  - completed  已完成（已找到/已归还）→ 成功绿
 *  - reviewing  审核中 → 警告橙
 *  - reviewed   已审核 → 成功绿
 *  - lost       失物类型 → 危险红
 *  - found      招领类型 → 成功绿
 *  - closed     中性/关闭 → 灰
 */
export default {
  name: 'LfStatusTag',
  props: {
    status: { type: String, default: 'open' },
    label: { type: String, required: true },
  },
};
</script>

<style lang="scss" scoped>
.lf-status-tag {
  font-size: $uni-font-size-caption;
  padding: 6rpx 16rpx;
  border-radius: $uni-radius-xs;
  white-space: nowrap;
  flex-shrink: 0;
  font-weight: 500;
  line-height: 1.3;
}

.status-open {
  color: $uni-color-primary;
  background-color: $uni-color-primary-soft;
}

.status-completed,
.status-reviewed,
.status-found {
  color: $uni-color-success;
  background-color: $uni-color-success-soft;
}

.status-reviewing {
  color: $uni-color-warning;
  background-color: $uni-color-warning-soft;
}

.status-lost {
  color: $uni-color-error;
  background-color: $uni-color-error-soft;
}

.status-closed {
  color: $uni-text-color-grey;
  background-color: $uni-bg-color-section;
}
</style>
