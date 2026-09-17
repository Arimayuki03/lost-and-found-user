<template>
	<view class="detail-container">
		<!-- 加载骨架屏：首屏占位（呼吸动画样式见 common.scss .skeleton-block） -->
		<view class="skeleton-wrap" v-if="loading">
			<view class="detail-card skeleton-card">
				<view class="skeleton-block skeleton-title"></view>
				<view class="skeleton-block skeleton-subtitle"></view>
			</view>
			<view class="detail-card skeleton-card">
				<view class="skeleton-block skeleton-image"></view>
			</view>
			<view class="detail-card skeleton-card">
				<view class="skeleton-block skeleton-line"></view>
				<view class="skeleton-block skeleton-line"></view>
				<view class="skeleton-block skeleton-line skeleton-line-short"></view>
			</view>
		</view>
		
		<block v-else>
			<!-- 标题卡片 -->
			<view class="detail-card header-card">
				<view class="header-top">
					<text class="detail-title">{{ item.name }}</text>
					<lf-status-tag
						:status="item.is_completed ? 'completed' : 'open'"
						:label="item.is_completed ? (itemType === 'lost' ? '已找到' : '已归还') : (itemType === 'lost' ? '寻找中' : '招领中')"
					/>
				</view>
				<view class="header-meta">
					<uni-icons type="clock" size="13" :color="colorGrey" />
					<text class="detail-time">发布于 {{ publishedText }}</text>
				</view>
			</view>
			
			<!-- 图片卡片 -->
			<view class="detail-card image-card" v-if="item.image_url">
				<image class="detail-image" :src="item.image_url" mode="aspectFill" @click="previewImage"></image>
			</view>
			
			<!-- 信息卡片 -->
			<view class="detail-card">
				<view class="lf-section-head">
					<text class="lf-section-title">物品信息</text>
				</view>
				<view class="detail-info">
					<view class="info-item">
						<view class="info-icon"><uni-icons type="flag" size="16" :color="colorPrimary" /></view>
						<text class="info-label">物品类别</text>
						<text class="info-value">{{ item.category }}</text>
					</view>
					<view class="info-item">
						<view class="info-icon"><uni-icons type="location-filled" size="16" :color="colorPrimary" /></view>
						<text class="info-label">{{ itemType === 'lost' ? '丢失地点' : '拾取地点' }}</text>
						<text class="info-value">{{ item.location || '未知' }}</text>
					</view>
					<view class="info-item">
						<view class="info-icon"><uni-icons type="calendar" size="16" :color="colorPrimary" /></view>
						<text class="info-label">{{ itemType === 'lost' ? '丢失时间' : '拾取时间' }}</text>
						<text class="info-value">{{ formatDate(itemType === 'lost' ? item.lost_time : item.found_time) }}</text>
					</view>
					<view class="info-item">
						<view class="info-icon"><uni-icons type="phone" size="16" :color="colorPrimary" /></view>
						<text class="info-label">联系方式</text>
						<text class="info-value">{{ item.contact }}</text>
					</view>
				</view>
			</view>
			
			<!-- 描述卡片 -->
			<view class="detail-card">
				<view class="lf-section-head">
					<text class="lf-section-title">详细描述</text>
				</view>
				<text class="detail-desc">{{ item.description || '发布者未填写详细描述' }}</text>
			</view>
			
			<!-- 底部固定操作栏 -->
			<view class="action-bar">
				<!-- 非自己发布的物品显示联系按钮 -->
				<button class="bar-btn primary contact-btn" @click="contactOwner" v-if="!isMyItem">
					<uni-icons type="chatboxes-filled" size="18" color="#ffffff" style="margin-right: 10rpx" />
					联系发布者
				</button>
				
				<!-- 自己发布的物品显示管理按钮 -->
				<view class="my-item-actions" v-else>
					<button class="bar-btn ghost edit-btn" @click="editItem" :disabled="item.is_under_review">编辑</button>
					<button class="bar-btn primary status-btn" @click="toggleStatus" :disabled="item.is_under_review">
						{{ item.is_completed ? '重新发布' : (itemType === 'lost' ? '确认已找到' : '确认已归还') }}
					</button>
					<button class="bar-btn danger delete-btn" @click="deleteItem" :disabled="item.is_under_review">删除</button>
				</view>
			</view>
			
			<!-- 审核中提示 -->
			<view class="review-notice" v-if="isMyItem && item.is_under_review">
				<uni-icons type="info-filled" size="14" :color="colorWarning" />
				<text>物品信息正在审核中，暂时无法编辑或删除</text>
			</view>
		</block>
	</view>
</template>

<script>
import { BASE_URL } from '@/config';
import { COLOR_ERROR, COLOR_GREY, COLOR_PRIMARY, COLOR_WARNING } from '@/config/ui';
import { mapGetters } from 'vuex';
import { relativeTime } from '@/utils/common';
import request from '@/utils/request';

/**
 * 物品详情页组件
 * 用于展示失物招领/寻物启事的详细信息，并提供相应操作功能
 */
export default {
	data() {
		return {
			colorPrimary: COLOR_PRIMARY, // 主色（信息行图标）
			colorGrey: COLOR_GREY, // 辅助灰（时间戳图标）
			colorWarning: COLOR_WARNING, // 警告橙（审核提示图标）
			id: null, // 物品ID
			itemType: '', // 物品类型：'lost'或'found'
			isMyItem: false, // 是否为当前用户发布的物品
			isFromMyPublish: false, // 是否从"我的发布"页面进入
			loading: true, // 加载状态

			// 物品信息对象
			item: {
				id: '',
				name: '',
				category: '',
				description: '',
				location: '',
				lost_time: null,
				found_time: null,
				contact: '',
				image_url: '',
				created_at: null,
				updated_at: null,
				is_completed: false,
				is_under_review: false,
				user_id: ''
			}
		}
	},
	
	computed: {
		// 从Vuex获取用户登录状态和信息
		...mapGetters(['isLoggedIn', 'userInfo']),
		
		// API基础URL
		baseUrl() {
			return BASE_URL;
		},
		
		// 发布时间：7 天内相对化（3天前），更早显示 x月x日
		publishedText() {
			const d = this.item.created_at ? new Date(this.item.created_at) : null;
			if (!d || isNaN(d.getTime())) return '未知';
			if (Date.now() - d.getTime() < 7 * 24 * 3600 * 1000) {
				return relativeTime(d);
			}
			return `${d.getMonth() + 1}月${d.getDate()}日`;
		}
	},
	
	/**
	 * 页面加载时初始化
	 * @param {Object} options - 页面参数，包含id、type和from
	 */
	onLoad(options) {
		if (options.id && options.type) {
			this.id = options.id;
			this.itemType = options.type; // 'lost' 或 'found'

			// 检查是否是从"我的发布"页面进入
			this.isFromMyPublish = options.from === 'myPublish';

			// 标记首次显示，onShow 中跳过，避免与 onLoad 重复请求
			this._isFirstShow = true;

			// 获取物品详情
			this.getDetail();
		} else {
			// 参数错误，提示并返回
			uni.showToast({
				title: '参数错误',
				icon: 'none'
			});
			setTimeout(() => {
				uni.navigateBack();
			}, 1500);
		}
	},

	onShow() {
		// 首次显示由 onLoad 负责加载
		if (this._isFirstShow) {
			this._isFirstShow = false;
			return;
		}
		// 从编辑页保存返回后重新拉取详情，避免页面显示旧数据
		if (this.id && this.itemType) {
			this.getDetail();
		}
	},
	
	methods: {
		/**
		 * 判断物品是否是当前登录用户发布的
		 * user_id 与 userInfo.id 可能是 number/string 混用，统一转字符串比较
		 */
		checkIsMyItem() {
			this.isMyItem = !!(this.isLoggedIn && this.userInfo && this.userInfo.id !== undefined &&
				this.item.user_id !== undefined && this.item.user_id !== null &&
				this.item.user_id.toString() === this.userInfo.id.toString());
		},

		/**
		 * 获取物品详情
		 * 根据用户登录状态决定调用不同的API
		 */
		getDetail() {
			this.loading = true;
			
			// 根据登录状态选择不同的API
			if (this.isLoggedIn) {
				this.getUserItemDetail(); // 已登录用户可查看自己的物品
			} else {
				this.getPublicItemDetail(); // 游客只能查看已审核的物品
			}
		},
		
		/**
		 * 获取登录用户可见的物品详情
		 * 用户可查看自己发布的未审核/已审核物品
		 */
		getUserItemDetail() {
			const token = uni.getStorageSync('token');
			if (!token) {
				// 没有token，改用公开接口
				this.getPublicItemDetail();
				return;
			}

			// 使用用户接口获取详情（统一封装：token 过期自动刷新）
			request({
				url: `/user/${this.itemType}-items/${this.id}/detail`,
				method: 'GET'
			}).then((data) => {
				this.item = data;

				// 检查是否是当前用户发布的物品
				this.checkIsMyItem();
			}).catch((error) => {
				uni.showToast({
					title: (error && error.error) || '获取物品详情失败',
					icon: 'none',
					duration: 2000
				});

				setTimeout(() => {
					uni.navigateBack();
				}, 2000);
			}).finally(() => {
				this.loading = false;
			});
		},

		/**
		 * 获取公开的物品详情
		 * 仅已审核通过的物品对所有用户可见
		 */
		getPublicItemDetail() {
			const url = `${this.baseUrl}/common/${this.itemType}-items/${this.id}`;

			// 公开接口无需登录态；用 uni.request 直连，避免统一封装在未登录时触发刷新逻辑
			uni.request({
				url: url,
				method: 'GET',
				success: (res) => {
					if (res.statusCode === 200) {
						this.item = res.data;

						// 检查是否是当前用户发布的物品
						this.checkIsMyItem();
					} else {
						// 如果是从"我的发布"页面进入，显示特殊提示
						if (this.isFromMyPublish) {
							uni.showToast({
								title: '该物品可能正在审核中，暂时无法查看',
								icon: 'none',
								duration: 2000
							});
						} else {
							uni.showToast({
								title: '物品不存在或正在审核中',
								icon: 'none'
							});
						}

						setTimeout(() => {
							uni.navigateBack();
						}, 2000);
					}
				},
				fail: () => {
					uni.showToast({
						title: '网络错误，请稍后重试',
						icon: 'none'
					});
				},
				complete: () => {
					this.loading = false;
				}
			});
		},
		
		/**
		 * 格式化日期时间
		 * @param {string} timestamp - ISO格式的时间戳
		 * @return {string} 格式化后的日期时间字符串
		 */
		formatDate(timestamp) {
			if (!timestamp) return '未知';
			const date = new Date(timestamp);
			return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
		},
		
		/**
		 * 预览物品图片
		 * 支持全屏查看和缩放
		 */
		previewImage() {
			if (this.item.image_url) {
				uni.previewImage({
					urls: [this.item.image_url]
				});
			}
		},
		
		/**
		 * 联系物品发布者
		 * 跳转到聊天页面
		 */
		contactOwner() {
			// 检查登录状态
			if (!this.isLoggedIn) {
				uni.showModal({
					title: '提示',
					content: '请先登录后再联系发布者',
					confirmText: '去登录',
					success: (res) => {
						if (res.confirm) {
							uni.navigateTo({
								url: '/pages/login/login'
							});
						}
					}
				});
				return;
			}
			
			// 校验发布者ID存在，避免跳转到 user_id=undefined 的聊天页
			if (this.item.user_id === undefined || this.item.user_id === null || this.item.user_id === '') {
				uni.showToast({
					title: '暂时无法联系发布者',
					icon: 'none'
				});
				return;
			}

			// 跳转到聊天页面
			uni.navigateTo({
				url: `/pages/chat/chat?user_id=${this.item.user_id}`
			});
		},
		
		/**
		 * 编辑物品信息
		 * 根据物品类型跳转到对应的编辑页面
		 */
		editItem() {
			if (!this.isMyItem) return;
			
			// 根据物品类型跳转到对应的编辑页面
			uni.navigateTo({
				url: `/pages/edit/edit${this.itemType === 'lost' ? 'Lost' : 'Found'}Item?id=${this.id}`
			});
		},
		
		/**
		 * 切换物品状态
		 * 在"已找到/已归还"和"寻找中/招领中"状态间切换
		 */
		toggleStatus() {
			if (!this.isMyItem) return;
			
			const statusText = this.item.is_completed ? 
				'确定要重新发布该物品吗？' : 
				`确定要将该物品标记为${this.itemType === 'lost' ? '已找到' : '已归还'}吗？`;
			
			uni.showModal({
				title: '提示',
				content: statusText,
				success: (res) => {
					if (res.confirm) {
						this.updateItemStatus();
					}
				}
			});
		},
		
		/**
		 * 更新物品状态
		 * 向服务器发送状态更新请求
		 */
		updateItemStatus() {
			const url = `${this.baseUrl}/user/${this.itemType}-items/${this.id}`;

			request({
				url: `/user/${this.itemType}-items/${this.id}`,
				method: 'PUT',
				data: {
					is_completed: !this.item.is_completed
				}
			}).then((data) => {
				uni.showToast({
					title: '状态更新成功',
					icon: 'success'
				});

				// 更新本地数据
				this.item.is_completed = !this.item.is_completed;

				// 如果服务器返回了审核状态，更新本地数据
				if (data && data.is_under_review !== undefined) {
					this.item.is_under_review = data.is_under_review;
				}
			}).catch((error) => {
				uni.showToast({
					title: (error && error.error) || '更新失败',
					icon: 'none'
				});
			});
		},
		
		/**
		 * 删除物品
		 * 显示删除确认对话框
		 */
		deleteItem() {
			if (!this.isMyItem) return;
			
			uni.showModal({
				title: '警告',
				content: '确定要删除该物品吗？此操作不可撤销！',
				confirmColor: COLOR_ERROR,
				success: (res) => {
					if (res.confirm) {
						this.confirmDelete();
					}
				}
			});
		},
		
		/**
		 * 确认删除物品
		 * 向服务器发送删除请求
		 */
		confirmDelete() {
			request({
				url: `/user/${this.itemType}-items/${this.id}`,
				method: 'DELETE'
			}).then(() => {
				uni.showToast({
					title: '删除成功',
					icon: 'success'
				});
				setTimeout(() => {
					uni.navigateBack();
				}, 1500);
			}).catch((error) => {
				uni.showToast({
					title: (error && error.error) || '删除失败',
					icon: 'none'
				});
			});
		}
	}
}
</script>

<style lang="scss" scoped>
/* 详情页容器 */
.detail-container {
	padding: 24rpx 24rpx 180rpx; /* 底部留出自定义操作栏高度 */
	min-height: 100vh;
	background-color: $uni-bg-color-grey;
	width: 100%;
	box-sizing: border-box;
}

/* ===== 通用卡片 ===== */
.detail-card {
	background-color: $uni-bg-color;
	border-radius: $uni-border-radius-card;
	box-shadow: $uni-shadow-card;
	overflow: hidden;
	width: 100%;
	box-sizing: border-box;
	padding: 0 28rpx 28rpx;
	margin-bottom: 24rpx;

	&:last-child {
		margin-bottom: 0;
	}
}

/* 首屏骨架屏各占位块（与真实卡片结构对齐） */
.skeleton-card {
	pointer-events: none;
	padding: 32rpx 28rpx;
}

.skeleton-title {
	width: 40%;
	height: 40rpx;
	margin-bottom: 18rpx;
}

.skeleton-subtitle {
	width: 25%;
	height: 24rpx;
}

.skeleton-image {
	width: 100%;
	height: 400rpx;
	border-radius: $uni-radius-md;
}

.skeleton-line {
	width: 100%;
	height: 28rpx;
	margin-bottom: 24rpx;
}

.skeleton-line-short {
	width: 55%;
	margin-bottom: 0;
}

/* ===== 标题卡片 ===== */
.header-card {
	padding: 32rpx 28rpx;
}

.header-top {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: 18rpx;
}

.detail-title {
	font-size: 40rpx;
	font-weight: 600;
	color: $uni-text-color;
	line-height: 1.3;
	flex: 1;
	min-width: 0;
	margin-right: 20rpx;
}

.header-meta {
	display: flex;
	align-items: center;
}

.detail-time {
	font-size: $uni-font-size-caption;
	color: $uni-text-color-grey;
	margin-left: 8rpx;
}

/* ===== 图片卡片 ===== */
.image-card {
	padding: 0;
}

.detail-image {
	width: 100%;
	height: 440rpx;
	display: block;
}

/* ===== 信息列表（图标 + 标签 + 值） ===== */
.detail-info {
	width: 100%;
	box-sizing: border-box;
	padding-top: 8rpx;

	.info-item {
		display: flex;
		align-items: center;
		padding: 22rpx 0;
		border-bottom: 1rpx solid $uni-border-color-split;

		&:last-child {
			border-bottom: none;
		}

		.info-icon {
			width: 56rpx;
			height: 56rpx;
			border-radius: 50%;
			background-color: $uni-color-primary-soft;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			margin-right: 20rpx;
		}

		.info-label {
			width: 160rpx;
			color: $uni-text-color-grey;
			font-size: $uni-font-size-base;
			flex-shrink: 0;
		}

		.info-value {
			flex: 1;
			min-width: 0;
			color: $uni-text-color;
			font-size: $uni-font-size-base;
			font-weight: 500;
			word-break: break-word;
			text-align: right;
		}
	}
}

/* ===== 描述卡片 ===== */
.detail-desc {
	display: block;
	font-size: $uni-font-size-base;
	color: $uni-text-color;
	line-height: 1.8;
	margin-top: 8rpx;
	word-break: break-word;
}

/* ===== 底部固定操作栏 ===== */
.action-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 99;
	background-color: $uni-bg-color;
	padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
	box-shadow: 0 -4rpx 20rpx rgba(31, 41, 55, 0.06);
}

.bar-btn {
	height: 88rpx;
	border-radius: $uni-border-radius-btn;
	font-size: $uni-font-size-md;
	font-weight: 500;
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	line-height: 1;

	&::after {
		border: none;
	}

	&.primary {
		background-color: $uni-color-primary;
		color: $uni-text-color-inverse;
		box-shadow: $uni-shadow-btn;

		&:active {
			background-color: $uni-color-primary-deep;
		}
	}

	&.ghost {
		background-color: $uni-bg-color;
		color: $uni-text-color;
		border: 2rpx solid $uni-border-color;
	}

	&.danger {
		background-color: $uni-color-error-soft;
		color: $uni-color-error;
	}

	&[disabled] {
		opacity: $uni-opacity-disabled;
	}
}

/* 非本人：联系发布者占满 */
.contact-btn {
	width: 100%;
}

/* 本人：编辑 / 状态 / 删除 三键 */
.my-item-actions {
	display: flex;
	gap: 20rpx;

	.bar-btn {
		flex: 1;
	}

	.status-btn {
		flex: 1.4;
	}
}

/* 审核提示（操作栏上方浮条） */
.review-notice {
	position: fixed;
	left: 24rpx;
	right: 24rpx;
	bottom: 148rpx;
	z-index: 98;
	display: flex;
	align-items: center;
	justify-content: center;
	background-color: $uni-color-warning-soft;
	border-radius: $uni-radius-md;
	padding: 16rpx 20rpx;

	text {
		font-size: $uni-font-size-caption;
		color: $uni-color-warning;
		margin-left: 8rpx;
	}
}
</style>
