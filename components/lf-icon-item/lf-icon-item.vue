<template>
  <view class="lf-icon-item" :style="rootStyle">
    <uni-icons :type="icon" :color="solid ? iconColor : color" :size="iconSize" />
  </view>
</template>

<script>
/**
 * 菜单/分类统一图标位（2026-09-17 重设计）：
 * 默认"彩色浅 tint 圆角方块 + 同色线性图标"，替代原先实底彩圈白字的艳俗观感；
 * solid=true 时保留旧样式（实底 + 白图标），供 hero 等特殊场景使用。
 */
export default {
  name: 'LfIconItem',
  props: {
    /** uni-icons 图标类型 */
    icon: { type: String, required: true },
    /** 主题色（tint 底与图标同色） */
    color: { type: String, default: '#007AFF' },
    /** 容器尺寸 rpx */
    size: { type: Number, default: 60 },
    /** 实底模式下的图标色 */
    iconColor: { type: String, default: '#FFFFFF' },
    /** 图标字号 px */
    iconSize: { type: Number, default: 24 },
    /** 实底模式 */
    solid: { type: Boolean, default: false },
    /** 圆角 rpx（0 = 圆形） */
    radius: { type: Number, default: 18 },
  },
  computed: {
    rootStyle() {
      const base = {
        width: this.size + 'rpx',
        height: this.size + 'rpx',
        borderRadius: this.radius ? this.radius + 'rpx' : '50%',
      };
      if (this.solid) {
        base.backgroundColor = this.color;
      } else {
        base.backgroundColor = this.hexToRgba(this.color, 0.12);
      }
      return base;
    },
  },
  methods: {
    /** #RGB / #RRGGBB → rgba(r,g,b,a)，供 tint 背景使用 */
    hexToRgba(hex, alpha) {
      let h = (hex || '').replace('#', '');
      if (h.length === 3) h = h.split('').map((c) => c + c).join('');
      if (h.length !== 6) return `rgba(0, 122, 255, ${alpha})`;
      const n = parseInt(h, 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
    },
  },
};
</script>

<style lang="scss" scoped>
.lf-icon-item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.2s;
}
</style>
