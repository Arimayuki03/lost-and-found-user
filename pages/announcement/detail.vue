<template>
	<view class="announcement-detail">
		<!-- 公告内容卡片 -->
		<view class="announcement-card" v-if="announcement.id">
			<view class="announcement-title">{{ announcement.title }}</view>
			<view class="announcement-meta">
				<text class="announcement-time">发布时间: {{ $utils.formatDate(announcement.created_at) }}</text>
				<text class="announcement-time" v-if="announcement.updated_at && announcement.updated_at !== announcement.created_at">
					更新时间: {{ $utils.formatDate(announcement.updated_at) }}
				</text>
			</view>
			<view class="announcement-content">{{ announcement.content }}</view>
		</view>
		
		<!-- 加载状态 -->
		<view class="loading-state" v-if="isLoading">
			<text class="loading-text">加载中...</text>
		</view>
		
		<!-- 错误状态 -->
		<view class="error-state" v-if="!isLoading && error">
			<text class="error-text">{{ error }}</text>
			<button class="retry-button" @tap="retryLoad">重试</button>
		</view>
	</view>
</template>

<script>
export default {
	/**
	 * 组件数据
	 */
	data() {
		return {
			// 公告数据
			announcement: {
				id: 0,
				title: '',
				content: '',
				created_at: '',
				updated_at: ''
			},
			// 加载状态
			isLoading: false,
			// 错误信息
			error: '',
			// 当前公告ID
			announcementId: 0
		};
	},
	
	/**
	 * 生命周期：页面加载
	 * 从路由参数获取公告ID并加载详情
	 */
	onLoad(options) {
		if (options.id) {
			this.announcementId = options.id;
			this.getAnnouncementDetail(options.id);
		}
	},
	
	methods: {
		/**
		 * 获取公告详情
		 * @param {string|number} id 公告ID
		 */
		async getAnnouncementDetail(id) {
			try {
				// 设置加载状态
				this.isLoading = true;
				this.error = '';
				
				uni.showLoading({
					title: '加载中...'
				});
				
				// 请求公告详情
				const result = await this.$api.announcement.getDetail(id);
				
				// 隐藏加载提示
				uni.hideLoading();
				this.isLoading = false;
				
				// 处理结果
				if (result) {
					this.announcement = result;
				} else {
					this.handleError('获取公告详情失败');
				}
			} catch (error) {
				this.handleError('获取公告详情失败，请重试');
			}
		},
		
		/**
		 * 处理错误情况
		 * @param {string} message 错误信息
		 */
		handleError(message) {
			// 隐藏加载状态
			uni.hideLoading();
			this.isLoading = false;
			
			// 设置错误信息
			this.error = message;
			
			// 显示错误提示
			uni.showToast({
				title: message,
				icon: 'none'
			});
		},
		
		/**
		 * 重试加载数据
		 */
		retryLoad() {
			if (this.announcementId) {
				this.getAnnouncementDetail(this.announcementId);
			}
		}
	}
};
</script>

<style lang="scss">
/* 页面整体样式 */
.announcement-detail {
	padding: 30rpx;
	background-color: #f8f8f8;
	min-height: 100vh;
}

/* 公告卡片样式 */
.announcement-card {
	background-color: #fff;
	border-radius: 20rpx;
	padding: 30rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

/* 公告标题 */
.announcement-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #333;
	margin-bottom: 20rpx;
}

/* 元数据区域样式 */
.announcement-meta {
	display: flex;
	flex-direction: column;
	margin-bottom: 30rpx;
}

/* 时间显示样式 */
.announcement-time {
	font-size: 24rpx;
	color: #999;
	margin-bottom: 6rpx;
}

/* 公告内容样式 */
.announcement-content {
	font-size: 28rpx;
	color: #666;
	line-height: 1.6;
	white-space: pre-wrap;
}

/* 加载和错误状态容器 */
.loading-state, .error-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
}

/* 加载和错误文本 */
.loading-text, .error-text {
	font-size: 28rpx;
	color: #999;
	margin-bottom: 20rpx;
}

/* 重试按钮样式 */
.retry-button {
	margin-top: 20rpx;
	background-color: #007AFF;
	color: #fff;
	font-size: 28rpx;
	padding: 10rpx 30rpx;
	border-radius: 10rpx;
}
</style> 