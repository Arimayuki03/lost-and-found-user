<template>
	<view class="announcement-list">
		<!-- 公告列表项 -->
		<view 
			class="announcement-item" 
			v-for="(item, index) in announcements" 
			:key="index"
			@tap="goToDetail(item.id)"
		>
			<view class="announcement-content">
				<view class="announcement-title">{{ item.title }}</view>
				<view class="announcement-desc">{{ item.content }}</view>
			</view>
			<view class="announcement-time">
				<text>{{ $utils.formatDate(item.created_at) }}</text>
				<text v-if="item.updated_at && item.updated_at !== item.created_at" class="updated-tag">已更新</text>
			</view>
		</view>
		
		<!-- 加载状态 -->
		<view class="loading-more" v-if="isLoading">
			<text class="loading-text">加载中...</text>
		</view>
		
		<!-- 空状态 -->
		<lf-empty v-if="!isLoading && announcements.length === 0" type="announcement" text="暂无公告" />
	</view>
</template>

<script>
export default {
	/**
	 * 组件数据
	 */
	data() {
		return {
			// 公告列表数据
			announcements: [],
			// 加载状态
			isLoading: false
		};
	},
	
	/**
	 * 生命周期：页面加载
	 * 获取公告列表数据
	 */
	onLoad() {
		this.getAnnouncementList();
	},
	
	/**
	 * 下拉刷新事件处理
	 * 重新获取公告列表，完成后停止刷新动画
	 */
	onPullDownRefresh() {
		this.getAnnouncementList().then(() => {
			uni.stopPullDownRefresh();
		});
	},
	
	methods: {
		/**
		 * 获取公告列表数据
		 * 按创建时间降序排列，最新的公告在最前面
		 * @returns {Promise} 返回获取结果的Promise
		 */
		async getAnnouncementList() {
			try {
				// 显示加载状态
				this.setLoading(true);
				
				// 设置排序参数
				const params = {
					sort_by: 'created_at',
					sort_order: 'desc'
				};
				
				// 请求公告列表
				const result = await this.$api.announcement.getList(params);
				
				// 处理响应结果
				if (result && result.items) {
					this.announcements = result.items;
				} else {
					this.handleError('获取公告列表失败');
				}
			} catch (error) {
				this.handleError('获取公告列表失败');
			} finally {
				// 无论成功失败都关闭加载状态
				this.setLoading(false);
			}
		},
		
		/**
		 * 设置加载状态
		 * @param {Boolean} status 是否显示加载中
		 */
		setLoading(status) {
			this.isLoading = status;
			
			if (status) {
				uni.showLoading({
					title: '加载中...'
				});
			} else {
				uni.hideLoading();
			}
		},
		
		/**
		 * 处理错误情况
		 * @param {String} message 错误提示消息
		 */
		handleError(message) {
			// 重置数据
			this.announcements = [];
			
			// 显示错误提示
			uni.showToast({
				title: message,
				icon: 'none'
			});
		},
		
		/**
		 * 跳转到公告详情页
		 * @param {Number|String} id 公告ID
		 */
		goToDetail(id) {
			uni.navigateTo({
				url: `/pages/announcement/detail?id=${id}`
			});
		}
	}
};
</script>

<style lang="scss" scoped>
/* 公告列表容器 */
.announcement-list {
	padding: 24rpx;
	background-color: $uni-bg-color-grey;
	min-height: 100vh;
}

/* 公告列表项 */
.announcement-item {
	background-color: $uni-bg-color;
	border-radius: $uni-border-radius-card;
	padding: 30rpx;
	margin-bottom: 20rpx;
	box-shadow: $uni-shadow-card;
	transition: transform 0.15s;

	&:active {
		transform: scale(0.99);
	}
}

/* 公告内容区域 */
.announcement-content {
	margin-bottom: 20rpx;
}

/* 公告标题 */
.announcement-title {
	font-size: $uni-font-size-lg;
	font-weight: 600;
	color: $uni-text-color;
	margin-bottom: 12rpx;
	line-height: 1.4;
}

/* 公告描述（内容预览） */
.announcement-desc {
	font-size: $uni-font-size-sm;
	color: $uni-text-color-grey;
	line-height: 1.6;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
}

/* 公告时间和标签区域 */
.announcement-time {
	font-size: $uni-font-size-caption;
	color: $uni-text-color-grey;
	text-align: right;
	display: flex;
	justify-content: flex-end;
	align-items: center;
}

/* 已更新标签 */
.updated-tag {
	margin-left: 12rpx;
	background-color: $uni-color-warning-soft;
	color: $uni-color-warning;
	padding: 4rpx 12rpx;
	border-radius: $uni-radius-xs;
	font-size: $uni-font-size-caption;
	font-weight: 500;
}

/* 加载更多区域 */
.loading-more {
	text-align: center;
	padding: 20rpx 0;
}

/* 加载文本 */
.loading-text {
	font-size: 24rpx;
	color: $uni-text-color-grey;
}

/* 空状态容器 */

/* 空状态图片 */

/* 空状态文本 */
</style> 