<template>
	<view class="detail-container">
		<!-- 加载状态 -->
		<view class="loading-container" v-if="loading">
			<uni-load-more status="loading" :content-text="loadingText"></uni-load-more>
		</view>
		
		<!-- 物品详情卡片 -->
		<view class="detail-card" v-else>
			<!-- 详情页头部 -->
			<view class="detail-header">
				<text class="detail-title">{{ item.name }}</text>
				<view class="status-tag" :class="{'completed': item.is_completed}">
					{{ item.is_completed ? (itemType === 'lost' ? '已找到' : '已归还') : (itemType === 'lost' ? '寻找中' : '招领中') }}
				</view>
				<text class="detail-time">发布时间：{{ formatDate(item.created_at) }}</text>
			</view>
			
			<!-- 详情内容区域 -->
			<view class="detail-content">
				<!-- 物品图片 -->
				<view class="detail-images" v-if="item.image_url">
					<image :src="item.image_url" mode="aspectFill" @click="previewImage"></image>
				</view>
				
				<!-- 物品信息列表 -->
				<view class="detail-info">
					<view class="info-item">
						<text class="info-label">物品类别：</text>
						<text class="info-value">{{ item.category }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">{{ itemType === 'lost' ? '丢失地点：' : '拾取地点：' }}</text>
						<text class="info-value">{{ item.location || '未知' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">{{ itemType === 'lost' ? '丢失时间：' : '拾取时间：' }}</text>
						<text class="info-value">{{ formatDate(itemType === 'lost' ? item.lost_time : item.found_time) }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">联系方式：</text>
						<text class="info-value">{{ item.contact }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">物品ID：</text>
						<text class="info-value">{{ item.id || '未知' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">发布者ID：</text>
						<text class="info-value">{{ item.user_id || '未知' }}</text>
					</view>
					<view class="info-item">
						<text class="info-label">创建时间：</text>
						<text class="info-value">{{ formatDate(item.created_at) }}</text>
					</view>
					<view class="info-item description">
						<text class="info-label">详细描述：</text>
						<text class="info-value">{{ item.description }}</text>
					</view>
				</view>
			</view>
			
			<!-- 底部操作区域 -->
			<view class="detail-footer">
				<!-- 非自己发布的物品显示联系按钮 -->
				<button class="contact-btn" @click="contactOwner" v-if="!isMyItem">联系发布者</button>
				
				<!-- 自己发布的物品显示管理按钮 -->
				<view class="my-item-actions" v-else>
					<button class="edit-btn" @click="editItem" :disabled="item.is_under_review">编辑</button>
					<button class="status-btn" @click="toggleStatus" :disabled="item.is_under_review">
						{{ item.is_completed ? '重新发布' : (itemType === 'lost' ? '确认已找到' : '确认已归还') }}
					</button>
					<button class="delete-btn" @click="deleteItem" :disabled="item.is_under_review">删除</button>
				</view>
				
				<!-- 审核中提示 -->
				<view class="review-notice" v-if="isMyItem && item.is_under_review">
					<text>物品信息正在审核中，暂时无法编辑或删除</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { BASE_URL } from '@/config';
import { mapGetters } from 'vuex';

/**
 * 物品详情页组件
 * 用于展示失物招领/寻物启事的详细信息，并提供相应操作功能
 */
export default {
	data() {
		return {
			id: null, // 物品ID
			itemType: '', // 物品类型：'lost'或'found'
			isMyItem: false, // 是否为当前用户发布的物品
			isFromMyPublish: false, // 是否从"我的发布"页面进入
			loading: true, // 加载状态
			
			// 加载提示文本
			loadingText: {
				contentdown: '加载中...',
				contentrefresh: '加载中...',
				contentnomore: '没有更多数据了'
			},
			
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
			
			// 使用用户接口获取详情
			const url = `${this.baseUrl}/user/${this.itemType}-items/${this.id}/detail`;
			
			uni.request({
				url: url,
				method: 'GET',
				header: {
					'Authorization': `Bearer ${token}`
				},
				success: (res) => {
					if (res.statusCode === 200) {
						this.item = res.data;

						// 检查是否是当前用户发布的物品
						this.checkIsMyItem();
					} else {
						uni.showToast({
							title: (res.data && res.data.error) || '获取物品详情失败',
							icon: 'none',
							duration: 2000
						});

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
		 * 获取公开的物品详情
		 * 仅已审核通过的物品对所有用户可见
		 */
		getPublicItemDetail() {
			const url = `${this.baseUrl}/common/${this.itemType}-items/${this.id}`;

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
			
			uni.request({
				url: url,
				method: 'PUT',
				header: {
					'Authorization': `Bearer ${uni.getStorageSync('token')}`,
					'Content-Type': 'application/json'
				},
				data: {
					is_completed: !this.item.is_completed
				},
				success: (res) => {
					if (res.statusCode === 200) {
						uni.showToast({
							title: '状态更新成功',
							icon: 'success'
						});
						
						// 更新本地数据
						this.item.is_completed = !this.item.is_completed;
						
						// 如果服务器返回了审核状态，更新本地数据
						if (res.data && res.data.is_under_review !== undefined) {
							this.item.is_under_review = res.data.is_under_review;
						}
					} else {
						uni.showToast({
							title: res.data?.error || '更新失败',
							icon: 'none'
						});
					}
				},
				fail: () => {
					uni.showToast({
						title: '网络错误，请稍后重试',
						icon: 'none'
					});
				}
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
				confirmColor: '#FF0000',
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
			const url = `${this.baseUrl}/user/${this.itemType}-items/${this.id}`;
			
			uni.request({
				url: url,
				method: 'DELETE',
				header: {
					'Authorization': `Bearer ${uni.getStorageSync('token')}`
				},
				success: (res) => {
					if (res.statusCode === 200) {
						uni.showToast({
							title: '删除成功',
							icon: 'success'
						});
						setTimeout(() => {
							uni.navigateBack();
						}, 1500);
					} else {
						uni.showToast({
							title: res.data?.error || '删除失败',
							icon: 'none'
						});
					}
				},
				fail: () => {
					uni.showToast({
						title: '网络错误，请稍后重试',
						icon: 'none'
					});
				}
			});
		}
	}
}
</script>

<style lang="scss">
/* 详情页容器 */
.detail-container {
	padding: 20rpx;
	min-height: 100vh;
	background-color: #f5f5f5;
	width: 100%;
	box-sizing: border-box;
	
	/* 加载状态容器 */
	.loading-container {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 80vh;
	}
	
	/* 详情卡片 */
	.detail-card {
		background-color: #fff;
		border-radius: 12rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
		overflow: hidden;
		width: 100%;
		box-sizing: border-box;
		
		/* 详情头部 */
		.detail-header {
			padding: 30rpx;
			border-bottom: 1rpx solid #f5f5f5;
			position: relative;
			
			/* 标题 */
			.detail-title {
				font-size: 36rpx;
				font-weight: bold;
				color: #333;
				display: block;
				margin-bottom: 10rpx;
				padding-right: 150rpx;
			}
			
			/* 状态标签 */
			.status-tag {
				position: absolute;
				top: 30rpx;
				right: 30rpx;
				background-color: #007AFF;
				color: #fff;
				font-size: 24rpx;
				padding: 6rpx 20rpx;
				border-radius: 30rpx;
				
				&.completed {
					background-color: #8F8F8F;
				}
			}
			
			/* 时间显示 */
			.detail-time {
				font-size: 24rpx;
				color: #999;
			}
		}
		
		/* 详情内容区 */
		.detail-content {
			padding: 30rpx;
			box-sizing: border-box;
			width: 100%;
			
			/* 图片区域 */
			.detail-images {
				margin-bottom: 30rpx;
				
				image {
					width: 100%;
					height: 400rpx;
					border-radius: 8rpx;
				}
			}
			
			/* 信息列表 */
			.detail-info {
				width: 100%;
				box-sizing: border-box;
				
				/* 信息项 */
				.info-item {
					margin-bottom: 20rpx;
					display: flex;
					align-items: flex-start;
					
					/* 标签 */
					.info-label {
						width: 200rpx;
						color: #666;
						font-size: 28rpx;
						flex-shrink: 0;
					}
					
					/* 值 */
					.info-value {
						flex: 1;
						color: #333;
						font-size: 28rpx;
						word-break: break-word;
					}
					
					/* 描述信息特殊样式 */
					&.description {
						display: block;
						width: 100%;
						padding-right: 0;
						margin-right: 0;
						
						.info-label {
							display: block;
							width: 100%;
							margin-bottom: 10rpx;
						}
						
						.info-value {
							display: block;
							margin-top: 10rpx;
							line-height: 1.6;
							width: 100%;
							text-align: left;
							word-break: break-all;
							padding-right: 0;
							margin-right: 0;
							max-width: 100%;
						}
					}
				}
			}
		}
		
		/* 底部操作区 */
		.detail-footer {
			padding: 30rpx;
			border-top: 1rpx solid #f5f5f5;
			
			/* 联系按钮 */
			.contact-btn {
				background-color: #007AFF;
				color: #fff;
				border-radius: 50rpx;
				font-size: 30rpx;
				height: 80rpx;
				line-height: 80rpx;
			}
			
			/* 我的物品操作按钮组 */
			.my-item-actions {
				display: flex;
				justify-content: space-between;
				
				button {
					flex: 1;
					margin: 0 10rpx;
					font-size: 28rpx;
					height: 80rpx;
					line-height: 80rpx;
					border-radius: 50rpx;
					
					&:first-child {
						margin-left: 0;
					}
					
					&:last-child {
						margin-right: 0;
					}
					
					&[disabled] {
						opacity: 0.6;
					}
				}
				
				/* 编辑按钮 */
				.edit-btn {
					background-color: #007AFF;
					color: #fff;
				}
				
				/* 状态切换按钮 */
				.status-btn {
					background-color: #FF9500;
					color: #fff;
				}
				
				/* 删除按钮 */
				.delete-btn {
					background-color: #FF3B30;
					color: #fff;
				}
			}
			
			/* 审核提示 */
			.review-notice {
				margin-top: 20rpx;
				text-align: center;
				
				text {
					font-size: 24rpx;
					color: #FF9500;
				}
			}
		}
	}
}
</style> 