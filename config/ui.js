/**
 * UI 颜色常量（供 JS / 模板属性使用，如 uni-icons :color、uni.showModal confirmColor）
 *
 * 与 uni.scss 中的 token 一一对应（SCSS 变量无法在 JS 中使用），
 * 修改色值时两处必须同步：uni.scss + 本文件。
 * 页面样式表内禁止使用这些常量，样式里一律用 uni.scss 的 SCSS 变量。
 */

/** 主色（对应 $uni-color-primary） */
export const COLOR_PRIMARY = '#007AFF';
/** 主色渐变辅色（对应 $uni-color-primary-light） */
export const COLOR_PRIMARY_LIGHT = '#5AC8FA';
/** 成功/已完成（对应 $uni-color-success） */
export const COLOR_SUCCESS = '#34C759';
/** 警告（对应 $uni-color-warning） */
export const COLOR_WARNING = '#FF9500';
/** 危险/删除（对应 $uni-color-error） */
export const COLOR_ERROR = '#FF3B30';
/** 中性灰（图标未激活等场景，对应 $uni-text-color-grey #8a94a2） */
export const COLOR_GREY = '#8a94a2';
/** 更弱一级的灰（箭头/占位图标，对应 $uni-text-color-secondary #c0c6cf） */
export const COLOR_SECONDARY = '#c0c6cf';
/** 前景白（对应 $uni-text-color-inverse，用于实底按钮上的图标） */
export const COLOR_WHITE = '#ffffff';
/** 分类装饰色（仅用于首页分类导航/无图占位色块，非语义状态色） */
export const COLOR_PURPLE = '#5856D6';
export const COLOR_PINK = '#FF2D55';
export const COLOR_GOLD = '#E0A800';
export const COLOR_SLATE = '#8E8E93';
