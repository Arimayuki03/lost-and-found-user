<template>
	<view class="index-container">
		<!-- 搜索栏 -->
		<view class="search-bar">
			<view class="search-input-box">
				<uni-icons type="search" size="18" color="#999"></uni-icons>
				<input 
					class="search-input" 
					type="text" 
					v-model="searchKeyword" 
					placeholder="请输入物品名称或描述" 
					confirm-type="search"
					@confirm="handleSearch"
				/>
				<uni-icons v-if="searchKeyword" type="clear" size="18" color="#999" @click="clearSearch"></uni-icons>
				<view class="search-btn" @tap="handleSearch">搜索</view>
			</view>
		</view>
		
		<!-- 轮播图 -->
		<swiper class="banner" indicator-dots autoplay circular :interval="3000" :duration="500">
			<swiper-item v-for="(item, index) in limitedCarouselImages" :key="index">
				<image :src="item.image_url" mode="aspectFill" class="banner-image"></image>
			</swiper-item>
			<!-- 默认轮播图 -->
			<swiper-item v-if="limitedCarouselImages.length === 0">
				<image src="/static/logo.png" mode="aspectFill" class="banner-image"></image>
			</swiper-item>
		</swiper>
		
		<!-- 公告栏 -->
		<view class="notice-bar">
			<uni-icons type="notification-filled" size="18" color="#FF9500"></uni-icons>
			<swiper class="notice-swiper" vertical autoplay circular :interval="3000" :duration="500">
				<swiper-item v-for="(item, index) in announcements" :key="index">
					<view class="notice-item" @tap="viewAnnouncementDetail(item)">
						<text class="notice-text">{{ item.title }}</text>
						<text v-if="item.updated_at && item.updated_at !== item.created_at" class="notice-new">新</text>
					</view>
				</swiper-item>
				<swiper-item v-if="announcements && announcements.length === 0">
					<view class="notice-item">
						<text class="notice-text">暂无公告信息</text>
					</view>
				</swiper-item>
			</swiper>
			<view class="notice-more-btn" @tap="viewAllAnnouncements">更多</view>
		</view>
		
		<!-- 搜索状态提示 -->
		<view class="search-status" v-if="searchKeyword || selectedCategory || isAdvancedFilterActive">
			<text class="search-status-text">
				{{ searchStatusText }}
			</text>
			<view class="notice-more-btn" @tap="clearSearch">重置</view>
		</view>
		
		<!-- 高级筛选面板 -->
		<view class="filter-panel" v-if="showFilterPanel">
			<view class="filter-header">
				<text class="filter-title">高级筛选</text>
				<uni-icons type="close" size="20" color="#666" @click="toggleFilterPanel"></uni-icons>
			</view>
			
			<scroll-view scroll-y class="filter-scroll">
				<view class="filter-section">
					<text class="filter-section-title">筛选类型</text>
					<view class="filter-tags">
						<view 
							class="filter-tag" 
							:class="{ 'active': filterType === 'lost' }"
							@tap="filterType = 'lost'"
						>
							失物信息
						</view>
						<view 
							class="filter-tag" 
							:class="{ 'active': filterType === 'found' }"
							@tap="filterType = 'found'"
						>
							招领信息
						</view>
					</view>
				</view>
				
				<view class="filter-section">
					<text class="filter-section-title">分类</text>
					<view class="filter-tags">
						<view 
							class="filter-tag" 
							:class="{ 'active': selectedCategory === item.value }"
							v-for="(item, index) in categories" 
							:key="index"
							@tap="selectFilterCategory(item.value)"
						>
							{{ item.label }}
						</view>
					</view>
					<input 
						class="filter-input" 
						type="text" 
						v-model="customCategory" 
						placeholder="输入自定义分类"
					/>
				</view>
				
				<view class="filter-section">
					<text class="filter-section-title">名称</text>
					<input 
						class="filter-input" 
						type="text" 
						v-model="filterName" 
						placeholder="输入物品名称关键词"
					/>
				</view>
				
				<view class="filter-section">
					<text class="filter-section-title">地点</text>
					<input 
						class="filter-input" 
						type="text" 
						v-model="filterLocation" 
						placeholder="输入地点关键词"
					/>
				</view>
				
				<view class="filter-section">
					<text class="filter-section-title">状态</text>
					<view class="filter-tags">
						<view 
							class="filter-tag" 
							:class="{ 'active': filterStatus === 'all' }"
							@tap="filterStatus = 'all'"
						>
							全部
						</view>
						<view 
							class="filter-tag" 
							:class="{ 'active': filterStatus === 'completed' }"
							@tap="filterStatus = 'completed'"
						>
							已完成
						</view>
						<view 
							class="filter-tag" 
							:class="{ 'active': filterStatus === 'uncompleted' }"
							@tap="filterStatus = 'uncompleted'"
						>
							未完成
						</view>
					</view>
				</view>
				
				<view class="filter-section">
					<text class="filter-section-title">用户ID</text>
					<input 
						class="filter-input" 
						type="number" 
						v-model="filterUserId" 
						placeholder="输入用户ID"
					/>
				</view>
				
				<view class="filter-section">
					<text class="filter-section-title">时间段</text>
					<view class="date-picker-container">
						<view class="date-picker-item">
							<text class="date-picker-label">开始时间：</text>
							<uni-datetime-picker 
								type="datetime" 
								v-model="filterStartTime" 
								:clearIcon="false"
								format="yyyy-MM-dd HH:mm"
								class="date-picker-component"
							/>
						</view>
						
						<view class="date-picker-item">
							<text class="date-picker-label">结束时间：</text>
							<uni-datetime-picker 
								type="datetime" 
								v-model="filterEndTime" 
								:clearIcon="false"
								format="yyyy-MM-dd HH:mm"
								class="date-picker-component"
							/>
						</view>
					</view>
				</view>
			</scroll-view>
			
			<view class="filter-buttons">
				<view class="filter-btn reset" @tap="resetFilter">重置</view>
				<view class="filter-btn apply" @tap="applyFilter">应用筛选</view>
			</view>
		</view>
		
		<!-- 分类导航 -->
		<view class="category-nav">
			<view 
				class="category-item" 
				v-for="(item, index) in categories" 
				:key="index"
				@tap="selectCategory(item.value)"
			>
				<view class="category-icon" :class="{ 'active': selectedCategory === item.value }" :style="{ backgroundColor: item.color }">
					<text class="icon-text">{{ item.icon }}</text>
				</view>
				<text class="category-name" :class="{ 'active': selectedCategory === item.value }">{{ item.label }}</text>
			</view>
		</view>
		
		<!-- 切换标签 -->
		<view class="tabs">
			<view 
				class="tab-item" 
				:class="{ active: activeTab === 'lost' }"
				@tap="switchTab('lost')"
			>
				<uni-icons type="paperplane" size="18" :color="activeTab === 'lost' ? '#007AFF' : '#666'" style="margin-right: 4rpx;"></uni-icons>
				失物信息
			</view>
			<view 
				class="tab-item"
				@tap="toggleFilterPanel"
			>
				<uni-icons type="settings" size="18" color="#666" style="margin-right: 4rpx;"></uni-icons>
				筛选
			</view>
			<view 
				class="tab-item"
				@tap="toggleSortOrder"
			>
				<uni-icons :type="sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'" size="18" color="#666" style="margin-right: 4rpx;"></uni-icons>
				{{ sortOrderText }}
			</view>
			<view 
				class="tab-item" 
				:class="{ active: activeTab === 'found' }"
				@tap="switchTab('found')"
			>
				<uni-icons type="paperplane-filled" size="18" :color="activeTab === 'found' ? '#007AFF' : '#666'" style="margin-right: 4rpx;"></uni-icons>
				招领信息
			</view>
		</view>
		
		<!-- 列表内容 -->
		<scroll-view 
			class="item-list" 
			scroll-y 
			@scrolltolower="loadMore"
			refresher-enabled
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
		>
			<!-- 筛选结果提示 -->
			<view class="filter-result-tip" v-if="isAdvancedFilterActive">
				<text class="filter-result-text">筛选结果</text>
				<view class="filter-result-reset" @tap="clearSearch">清除筛选</view>
			</view>
			
			<!-- 失物列表 -->
			<block v-if="activeTab === 'lost' && !isAdvancedFilterActive && filteredLostItems.length > 0">
				<view
					class="item-card"
					v-for="item in filteredLostItems"
					:key="item.id"
					@tap="goToDetail('lost', item.id)"
				>
					<image class="item-image" :src="item.image_url" mode="aspectFill"></image>
					<view class="item-info">
						<view class="item-header">
							<text class="item-name">{{ item.name }}</text>
							<view class="item-tags">
								<text class="item-status" :class="{ 'completed': item.is_completed }">{{ item.is_completed ? '已找到' : '寻找中' }}</text>
								<text class="item-category">{{ item.category }}</text>
							</view>
						</view>
						<text class="item-desc">{{ item.description }}</text>
						<view class="item-footer">
							<text class="item-location">{{ item.location }}</text>
							<text class="item-time">{{ $utils.formatDate(item.lost_time, 'YYYY-MM-DD') }} {{ $utils.relativeTime(item.lost_time) }}</text>
						</view>
					</view>
				</view>
			</block>
			
			<!-- 招领列表 -->
			<block v-if="activeTab === 'found' && !isAdvancedFilterActive && filteredFoundItems.length > 0">
				<view
					class="item-card"
					v-for="item in filteredFoundItems"
					:key="item.id"
					@tap="goToDetail('found', item.id)"
				>
					<image class="item-image" :src="item.image_url" mode="aspectFill"></image>
					<view class="item-info">
						<view class="item-header">
							<text class="item-name">{{ item.name }}</text>
							<view class="item-tags">
								<text class="item-status" :class="{ 'completed': item.is_completed }">{{ item.is_completed ? '已归还' : '招领中' }}</text>
								<text class="item-category">{{ item.category }}</text>
							</view>
						</view>
						<text class="item-desc">{{ item.description }}</text>
						<view class="item-footer">
							<text class="item-location">{{ item.location }}</text>
							<text class="item-time">{{ $utils.formatDate(item.found_time, 'YYYY-MM-DD') }} {{ $utils.relativeTime(item.found_time) }}</text>
						</view>
					</view>
				</view>
			</block>
			
			<!-- 筛选结果列表 -->
			<block v-if="isAdvancedFilterActive && filteredItems.length > 0">
				<view
					class="item-card"
					v-for="item in filteredItems"
					:key="item.id"
					@tap="goToDetail(item.item_type || (filterType === 'lost' ? 'lost' : 'found'), item.id)"
				>
					<image class="item-image" :src="item.image_url" mode="aspectFill"></image>
					<view class="item-info">
						<view class="item-header">
							<text class="item-name">{{ item.name }}</text>
							<view class="item-tags">
								<text class="item-status" :class="{ 'completed': item.is_completed }">{{ item.is_completed ? (item.item_type === 'found' || filterType === 'found' ? '已归还' : '已找到') : (item.item_type === 'found' || filterType === 'found' ? '招领中' : '寻找中') }}</text>
								<text class="item-category">{{ item.category }}</text>
								<text class="item-type" :class="item.item_type || filterType">{{ (item.item_type === 'found' || filterType === 'found') ? '招领' : '失物' }}</text>
							</view>
						</view>
						<text class="item-desc">{{ item.description }}</text>
						<view class="item-footer">
							<text class="item-location">{{ item.location }}</text>
							<text class="item-time">{{ $utils.formatDate(item.item_type === 'found' || filterType === 'found' ? item.found_time : item.lost_time, 'YYYY-MM-DD') }} {{ $utils.relativeTime(item.item_type === 'found' || filterType === 'found' ? item.found_time : item.lost_time) }}</text>
						</view>
					</view>
				</view>
			</block>
			
			<!-- 加载更多 -->
			<view class="loading-more" v-if="hasMore">
				<text class="loading-text">加载中...</text>
			</view>
			<view class="loading-more" v-else>
				<text class="loading-text">没有更多数据了</text>
			</view>
			
			<!-- 空状态 -->
			<view class="empty-state" v-if="(activeTab === 'lost' && !isAdvancedFilterActive && filteredLostItems.length === 0) || (activeTab === 'found' && !isAdvancedFilterActive && filteredFoundItems.length === 0) || (isAdvancedFilterActive && filteredItems.length === 0)">
				<image class="empty-image" src="/static/logo.png" mode="aspectFit"></image>
				<text class="empty-text">暂无数据</text>
			</view>
		</scroll-view>
		

	</view>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { checkLogin, goToLogin } from '../../utils/common';
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue';
import uniDatetimePicker from '@dcloudio/uni-ui/lib/uni-datetime-picker/uni-datetime-picker.vue';

export default {
	components: {
		uniIcons,
		uniDatetimePicker
	},
	data() {
		return {
			activeTab: 'lost', // 当前激活的标签：lost-失物，found-招领
			searchKeyword: '', // 搜索关键词
			selectedCategory: '', // 选中的分类
			page: 1, // 当前页码
			pageSize: 10, // 每页数量
			hasMore: true, // 是否有更多数据
			isRefreshing: false, // 是否正在刷新
			isLoadingMore: false, // 是否正在加载更多（防触底重入）
			appliedFilterParams: null, // 高级筛选"应用"时的参数快照（翻页复用，避免面板中途修改导致两页条件不一致）
			appliedFilterType: null, // 高级筛选"应用"时的类型快照（lost/found）
			announcements: [], // 公告列表
			showFilterPanel: false, // 是否显示筛选面板
			filterType: 'lost', // 筛选类型：lost-失物，found-招领
			filterLocation: '', // 筛选地点
			filterName: '', // 筛选名称
			customCategory: '', // 自定义分类
			filterStatus: 'all', // 筛选状态：all-全部，completed-已完成，uncompleted-未完成
			filterUserId: '', // 筛选用户ID
			filterStartTime: '', // 筛选开始时间
			filterEndTime: '', // 筛选结束时间
			isAdvancedFilterActive: false, // 是否启用了高级筛选
			filteredItems: [], // 筛选结果列表
			sortOrder: 'desc', // 排序方式：desc-倒序（最新在前），asc-正序（最早在前）
			categories: [
				{ value: '电子产品', label: '电子产品', icon: '电', color: '#FF9500' },
				{ value: '证件', label: '证件', icon: '证', color: '#007AFF' },
				{ value: '钱包', label: '钱包', icon: '钱', color: '#4CD964' },
				{ value: '钥匙', label: '钥匙', icon: '钥', color: '#FF3B30' },
				{ value: '书籍', label: '书籍', icon: '书', color: '#5856D6' },
				{ value: '衣物', label: '衣物', icon: '衣', color: '#FF2D55' },
				{ value: '饰品', label: '饰品', icon: '饰', color: '#E0A800' },
				{ value: '', label: '全部', icon: '全', color: '#8E8E93' }
			]
		};
	},
	
	computed: {
		...mapState({
			lostItems: state => state.lostItems,
			foundItems: state => state.foundItems,
			carouselImages: state => state.carouselImages
		}),
		
		// 限制轮播图最多显示5张
		limitedCarouselImages() {
			return this.carouselImages.slice(0, 5);
		},
		
		// 排序文本
		sortOrderText() {
			return this.sortOrder === 'desc' ? '最新' : '最早';
		},
		
		// 过滤后的失物列表
		filteredLostItems() {
			let items = this.lostItems;
			
			// 按分类筛选
			if (this.selectedCategory) {
				items = items.filter(item => item.category === this.selectedCategory);
			}
			
			// 按时间排序
			items = [...items].sort((a, b) => {
				const timeA = new Date(a.lost_time).getTime();
				const timeB = new Date(b.lost_time).getTime();
				return this.sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
			});
			
			// 不再在计算属性中进行关键词搜索，而是在 handleSearch 方法中处理
			
			return items;
		},
		
		// 过滤后的招领列表
		filteredFoundItems() {
			let items = this.foundItems;
			
			// 按分类筛选
			if (this.selectedCategory) {
				items = items.filter(item => item.category === this.selectedCategory);
			}
			
			// 按时间排序
			items = [...items].sort((a, b) => {
				const timeA = new Date(a.found_time).getTime();
				const timeB = new Date(b.found_time).getTime();
				return this.sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
			});
			
			// 不再在计算属性中进行关键词搜索，而是在 handleSearch 方法中处理
			
			return items;
		},
		
		// 搜索状态文本
		searchStatusText() {
			let text = '当前';
			let hasContent = false;
			
			if (this.searchKeyword) {
				text += `搜索"${this.searchKeyword}"`;
				hasContent = true;
			}
			
			if (this.selectedCategory) {
				text += hasContent ? '，' : '';
				text += `分类为"${this.selectedCategory}"`;
				hasContent = true;
			}
			
			if (this.isAdvancedFilterActive) {
				text += hasContent ? '，' : '';
				text += `使用高级筛选`;
				hasContent = true;
				
				if (this.filterType) {
					text += `（${this.filterType === 'lost' ? '失物' : '招领'}）`;
				}
				
				// 添加时间筛选信息
				if (this.filterStartTime || this.filterEndTime) {
					text += '，时间范围:';
					if (this.filterStartTime) {
						const startTimeDisplay = typeof this.filterStartTime === 'string' 
							? this.filterStartTime 
							: this.$utils.formatDate(this.filterStartTime, 'YYYY-MM-DD HH:mm');
						text += ` 从${startTimeDisplay}`;
					}
					
					if (this.filterEndTime) {
						const endTimeDisplay = typeof this.filterEndTime === 'string'
							? this.filterEndTime
							: this.$utils.formatDate(this.filterEndTime, 'YYYY-MM-DD HH:mm');
						text += ` 到${endTimeDisplay}`;
					}
				}
			}
			
			return text;
		}
	},
	
	onLoad() {
		// 标记首次显示，onShow 中跳过，避免 onLoad+onShow 背靠背双份加载
		this._isFirstShow = true;
		// 加载数据
		this.loadData();
		// 加载公告
		this.getAnnouncements();
	},

	onShow() {
		// 首次显示由 onLoad 负责加载
		if (this._isFirstShow) {
			this._isFirstShow = false;
			return;
		}
		// 每次显示页面时刷新数据
		this.loadData();
		// 刷新公告
		this.getAnnouncements();
	},
	
	methods: {
		...mapActions([
			'getLostItems',
			'getFoundItems',
			'getCarouselImages',
			'getAnnouncements'
		]),
		
		// 获取公告列表
		async getAnnouncements() {
			try {
				const params = {
					page: 1,
					size: 5, // 只获取最新的5条公告
					sort_by: 'created_at',
					sort_order: 'desc'
				};
				
				const result = await this.$api.announcement.getList(params);
				
				if (result && result.items) {
					this.announcements = result.items;
				} else {
				}
			} catch (error) {
			}
		},
		
		// 查看公告详情
		viewAnnouncementDetail(announcement) {
			uni.navigateTo({
				url: `/pages/announcement/detail?id=${announcement.id}`
			});
		},
		
		// 查看所有公告
		viewAllAnnouncements() {
			uni.navigateTo({
				url: '/pages/announcement/list'
			});
		},
		
		// 加载数据
		async loadData() {
			uni.showLoading({
				title: '加载中...'
			});
			
			// 添加超时处理
			const timeout = setTimeout(() => {
				uni.hideLoading();
				this.isRefreshing = false;
				uni.showToast({
					title: '加载超时，请检查网络',
					icon: 'none'
				});
			}, 10000); // 10秒超时
			
			try {
				// 重置页码
				this.page = 1;
				this.hasMore = true;
				
				// 并行加载数据
				await Promise.all([
					this.getLostItems({ page: this.page, page_size: this.pageSize }),
					this.getFoundItems({ page: this.page, page_size: this.pageSize }),
					this.getCarouselImages()
				]);
				
				clearTimeout(timeout); // 清除超时
				uni.hideLoading();
			} catch (error) {
				clearTimeout(timeout); // 清除超时
				uni.hideLoading();
				uni.showToast({
					title: '加载失败，请稍后再试',
					icon: 'none'
				});
			}
		},
		
		// 切换标签
		switchTab(tab) {
			this.activeTab = tab;
			// 如果有高级筛选激活，则清除筛选
			if (this.isAdvancedFilterActive) {
				this.clearAdvancedFilter();
			}
			// 重置页码和加载更多状态
			this.page = 1;
			this.hasMore = true;
		},
		
		// 选择分类
		async selectCategory(category, isRefresh = false) {
			// 如果高级筛选处于激活状态，先清除高级筛选
			if (this.isAdvancedFilterActive) {
				this.clearAdvancedFilter();
			}
			
			// 如果点击的是当前已选中的分类，且不是刷新操作，则取消选择
			if (category === this.selectedCategory && !isRefresh) {
				this.selectedCategory = '';
				// 重新加载所有数据
				await this.loadData();
				return;
			}
			
			// 更新选中的分类（如果不是刷新操作）
			if (!isRefresh) {
				this.selectedCategory = category;
			}
			
			// 重置页码和加载更多状态
			this.page = 1;
			this.hasMore = true;
			
			uni.showLoading({
				title: '加载中...'
			});
			
			try {
				// 在请求前捕获 tab 快照，防止响应返回时已切到另一 tab 导致数据写错列表
				const activeTab = this.activeTab;

				// 准备筛选参数
				const params = {
					category: this.selectedCategory, // 使用 this.selectedCategory 而不是 category
					page: this.page,
					size: this.pageSize
				};

				// 根据发起请求时的 tab 快照调用对应的筛选接口
				let result;
				if (activeTab === 'lost') {
					result = await this.$api.lostItem.sift(params);
					if (result && result.items) {
						this.$store.commit('SET_LOST_ITEMS', result.items);
					} else {
						// 如果没有结果，设置为空数组
						this.$store.commit('SET_LOST_ITEMS', []);
					}
				} else {
					result = await this.$api.foundItem.sift(params);
					if (result && result.items) {
						this.$store.commit('SET_FOUND_ITEMS', result.items);
					} else {
						// 如果没有结果，设置为空数组
						this.$store.commit('SET_FOUND_ITEMS', []);
					}
				}
				
				// 更新是否有更多数据
				if (result && result.total) {
					this.hasMore = result.total > (this.page * this.pageSize);
				} else {
					// 如果没有 total 字段或者 total 为 0，则设置 hasMore 为 false
					this.hasMore = false;
				}
				
				uni.hideLoading();
			} catch (error) {
				uni.hideLoading();
				// 筛选失败时，确保 hasMore 为 false
				this.hasMore = false;
				uni.showToast({
					title: '加载失败，请稍后再试',
					icon: 'none'
				});
			}
		},
		
		// 搜索
		async handleSearch() {
			// 如果搜索关键词为空，则不执行搜索
			if (!this.searchKeyword.trim()) {
				uni.showToast({
					title: '请输入搜索关键词',
					icon: 'none'
				});
				return;
			}
			
			// 重置页码和加载更多状态
			this.page = 1;
			this.hasMore = true;
			
			uni.showLoading({
				title: '搜索中...'
			});
			
			try {
				// 在请求前捕获 tab 快照，防止响应返回时已切到另一 tab 导致数据写错列表
				const activeTab = this.activeTab;

				// 准备搜索参数
				const params = {
					query: this.searchKeyword,
					page: this.page,
					size: this.pageSize,
					category: this.selectedCategory,
					type: activeTab === 'lost' ? 'lost' : 'found'
				};

				// 调用统一搜索接口
				const result = await this.$api.search.searchItems(params);

				// 根据发起搜索时的 tab 快照更新数据
				if (activeTab === 'lost') {
					this.$store.commit('SET_LOST_ITEMS', result.items || []);
				} else {
					this.$store.commit('SET_FOUND_ITEMS', result.items || []);
				}
				
				// 更新是否有更多数据
				if (result && result.total) {
					this.hasMore = result.total > (this.page * this.pageSize);
				} else {
					// 如果没有 total 字段或者 total 为 0，则设置 hasMore 为 false
					this.hasMore = false;
				}
				
				uni.hideLoading();
			} catch (error) {
				uni.hideLoading();
				// 搜索失败时，确保 hasMore 为 false，避免显示加载中
				this.hasMore = false;
				uni.showToast({
					title: '搜索失败，请稍后再试',
					icon: 'none'
				});
			}
		},
		
		// 加载更多
		async loadMore() {
			if (!this.hasMore || this.isLoadingMore) return;

			this.isLoadingMore = true;
			this.page++;

			// 在请求发起前捕获快照，避免 await 返回时页面状态已变化：
			// tab 快照防止"失物第2页数据被追加进招领列表"的跨 tab 竞态
			const activeTab = this.activeTab;
			// 高级筛选使用"应用"时刻的参数快照，而不是筛选面板当前值
			const appliedFilterParams = this.appliedFilterParams;
			const appliedFilterType = this.appliedFilterType;

			try {
				let res;

				// 如果有搜索关键词，使用搜索接口
				if (this.searchKeyword) {
					// 准备搜索参数
					const params = {
						query: this.searchKeyword,
						page: this.page,
						size: this.pageSize,
						category: this.selectedCategory,
						type: activeTab === 'lost' ? 'lost' : 'found'
					};

					// 调用统一搜索接口
					res = await this.$api.search.searchItems(params);

					// 使用 tab 快照更新数据
					if (activeTab === 'lost') {
						if (res.items && res.items.length > 0) {
							this.$store.commit('SET_LOST_ITEMS', [...this.lostItems, ...res.items]);
						} else {
							this.hasMore = false;
						}
					} else {
						if (res.items && res.items.length > 0) {
							this.$store.commit('SET_FOUND_ITEMS', [...this.foundItems, ...res.items]);
						} else {
							this.hasMore = false;
						}
					}
				}
				// 如果有高级筛选条件，使用筛选接口（复用应用时刻的参数快照）
				else if (this.isAdvancedFilterActive && appliedFilterParams) {
					const params = {
						...appliedFilterParams,
						page: this.page,
						size: this.pageSize
					};

					// 根据应用筛选时的类型快照调用对应的筛选接口
					if (appliedFilterType === 'lost') {
						res = await this.$api.lostItem.sift(params);

						if (res.items && res.items.length > 0) {
							const newItems = res.items.map(item => ({...item, item_type: 'lost'}));
							this.filteredItems = [...this.filteredItems, ...newItems];
						} else {
							this.hasMore = false;
						}
					} else {
						res = await this.$api.foundItem.sift(params);

						if (res.items && res.items.length > 0) {
							const newItems = res.items.map(item => ({...item, item_type: 'found'}));
							this.filteredItems = [...this.filteredItems, ...newItems];
						} else {
							this.hasMore = false;
						}
					}
				}
				// 如果只有分类筛选，使用分类筛选接口
				else if (this.selectedCategory) {
					// 准备筛选参数
					const params = {
						category: this.selectedCategory,
						page: this.page,
						size: this.pageSize
					};

					// 根据当前标签页调用对应的筛选接口
					if (activeTab === 'lost') {
						res = await this.$api.lostItem.sift(params);

						if (res.items && res.items.length > 0) {
							this.$store.commit('SET_LOST_ITEMS', [...this.lostItems, ...res.items]);
						} else {
							this.hasMore = false;
						}
					} else {
						res = await this.$api.foundItem.sift(params);

						if (res.items && res.items.length > 0) {
							this.$store.commit('SET_FOUND_ITEMS', [...this.foundItems, ...res.items]);
						} else {
							this.hasMore = false;
						}
					}
				}
				else {
					// 没有搜索条件和分类筛选，使用原来的接口
					if (activeTab === 'lost') {
						res = await this.$api.lostItem.getList({
							page: this.page,
							page_size: this.pageSize
						});

						if (res.items && res.items.length > 0) {
							this.$store.commit('SET_LOST_ITEMS', [...this.lostItems, ...res.items]);
						} else {
							this.hasMore = false;
						}
					} else {
						res = await this.$api.foundItem.getList({
							page: this.page,
							page_size: this.pageSize
						});

						if (res.items && res.items.length > 0) {
							this.$store.commit('SET_FOUND_ITEMS', [...this.foundItems, ...res.items]);
						} else {
							this.hasMore = false;
						}
					}
				}
			} catch (error) {
				// 加载失败回滚页码，下次触底重新请求同一页，避免跳页
				this.page--;
				uni.showToast({
					title: '加载失败，请稍后再试',
					icon: 'none'
				});
			} finally {
				this.isLoadingMore = false;
			}
		},
		
		// 跳转到详情页
		goToDetail(type, id) {
			// 检查登录状态
			if (!checkLogin()) {
				// 显示提示信息
				uni.showModal({
					title: '提示',
					content: '请先登录或注册后再查看详情',
					confirmText: '去登录',
					cancelText: '返回',
					success: (res) => {
						if (res.confirm) {
							// 用户点击"去登录"，跳转到登录页面
							goToLogin();
						}
					}
				});
				return;
			}
			
			uni.navigateTo({
				url: `/pages/detail/detail?type=${type}&id=${id}`
			});
		},
		
		// 跳转到发布页
		goToPublish() {
			// 检查登录状态，未登录则先跳转到登录页
			if (!checkLogin()) {
				uni.showModal({
					title: '提示',
					content: '发布信息需要先登录，是否前往登录？',
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
			
			uni.navigateTo({
				url: '/pages/publish/publish'
			});
		},
		
		// 清除搜索
		async clearSearch() {
			// 如果搜索关键词为空，则不执行任何操作
			if (!this.searchKeyword && !this.selectedCategory && !this.isAdvancedFilterActive) {
				return;
			}
			
			// 清空搜索关键词和筛选条件
			this.searchKeyword = '';
			this.selectedCategory = '';
			this.filterLocation = '';
			this.filterName = '';
			this.customCategory = '';
			this.filterStatus = 'all';
			this.filterUserId = '';
			this.filterStartTime = '';
			this.filterEndTime = '';
			this.isAdvancedFilterActive = false;
			this.filteredItems = [];
			// 同步清除"应用"时刻的参数快照
			this.appliedFilterParams = null;
			this.appliedFilterType = null;

			// 重新加载数据
			await this.loadData();
			
			// 提示用户
			uni.showToast({
				title: '已重置搜索',
				icon: 'none',
				duration: 1500
			});
		},
		
		// 切换筛选面板显示状态
		toggleFilterPanel() {
			this.showFilterPanel = !this.showFilterPanel;
		},
		
		// 在筛选面板中选择分类
		selectFilterCategory(category) {
			this.selectedCategory = category === this.selectedCategory ? '' : category;
		},
		
		// 重置筛选条件
		resetFilter() {
			this.selectedCategory = '';
			this.filterLocation = '';
			this.filterName = '';
			this.customCategory = '';
			this.filterStatus = 'all';
			this.filterUserId = '';
			this.filterStartTime = '';
			this.filterEndTime = '';
		},
		
		// 应用筛选条件
		async applyFilter() {
			// 标记高级筛选为激活状态
			this.isAdvancedFilterActive = true;
			
			// 重置页码和加载更多状态
			this.page = 1;
			this.hasMore = true;
			
			uni.showLoading({
				title: '筛选中...'
			});
			
			try {
				// 准备筛选参数
				const params = {
					page: this.page,
					size: this.pageSize
				};
				
				// 添加分类筛选参数（优先使用自定义分类）
				if (this.customCategory) {
					params.category = this.customCategory;
				} else if (this.selectedCategory) {
					params.category = this.selectedCategory;
				}
				
				// 添加名称筛选参数
				if (this.filterName) {
					params.name = this.filterName;
				}
				
				// 添加地点筛选参数
				if (this.filterLocation) {
					params.location = this.filterLocation;
				}
				
				// 添加状态筛选参数
				if (this.filterStatus !== 'all') {
					params.is_completed = this.filterStatus === 'completed' ? 'true' : 'false';
				}
				
				// 添加用户ID筛选参数
				if (this.filterUserId) {
					params.user_id = this.filterUserId;
				}
				
				// 添加时间段筛选参数
				if (this.filterStartTime) {
					params.start_time = typeof this.filterStartTime === 'string' 
						? this.filterStartTime 
						: this.$utils.formatDate(this.filterStartTime, 'YYYY-MM-DD HH:mm:00');
				}
				
				if (this.filterEndTime) {
					params.end_time = typeof this.filterEndTime === 'string'
						? this.filterEndTime
						: this.$utils.formatDate(this.filterEndTime, 'YYYY-MM-DD HH:mm:59');
				}

				// 保存"应用"时刻的参数快照，loadMore 翻页时复用这套条件，
				// 避免用户中途修改面板未应用导致两页数据来自不同条件
				this.appliedFilterParams = { ...params };
				this.appliedFilterType = this.filterType;

				// 根据筛选类型调用对应的筛选接口
				let result;
				if (this.filterType === 'lost') {
					result = await this.$api.lostItem.sift(params);
					if (result && result.items) {
						this.filteredItems = result.items.map(item => ({...item, item_type: 'lost'}));
					} else {
						// 如果没有结果，设置为空数组
						this.filteredItems = [];
					}
					// 切换到失物标签页
					this.activeTab = 'lost';
				} else {
					result = await this.$api.foundItem.sift(params);
					if (result && result.items) {
						this.filteredItems = result.items.map(item => ({...item, item_type: 'found'}));
					} else {
						// 如果没有结果，设置为空数组
						this.filteredItems = [];
					}
					// 切换到招领标签页
					this.activeTab = 'found';
				}
				
				// 更新是否有更多数据
				if (result && result.total) {
					this.hasMore = result.total > (this.page * this.pageSize);
				} else {
					// 如果没有 total 字段或者 total 为 0，则设置 hasMore 为 false
					this.hasMore = false;
				}
				
				// 关闭筛选面板
				this.showFilterPanel = false;
				
				uni.hideLoading();
				
				// 提示用户筛选已应用
				uni.showToast({
					title: `已筛选${this.filterType === 'lost' ? '失物' : '招领'}信息`,
					icon: 'none',
					duration: 1500
				});
			} catch (error) {
				uni.hideLoading();
				// 筛选失败时，确保 hasMore 为 false
				this.hasMore = false;
				uni.showToast({
					title: '筛选失败，请稍后再试',
					icon: 'none'
				});
			}
		},
		
		// 刷新列表
		async onRefresh() {
			this.isRefreshing = true;
			
			try {
				// 如果有搜索关键词，使用搜索接口
				if (this.searchKeyword) {
					await this.handleSearch();
				}
				// 如果有高级筛选条件，使用筛选接口
				else if (this.isAdvancedFilterActive) {
					await this.applyFilter();
				}
				// 如果只有分类筛选，使用分类筛选接口
				else if (this.selectedCategory) {
					await this.selectCategory(this.selectedCategory, true);
				}
				// 没有任何筛选条件，使用普通加载
				else {
					await this.loadData();
				}
			} catch (error) {
				// 刷新失败时，确保 hasMore 为 false
				this.hasMore = false;
				uni.showToast({
					title: '刷新失败，请稍后再试',
					icon: 'none'
				});
			} finally {
				// 确保无论如何都会结束刷新状态
				this.isRefreshing = false;
			}
		},
		
		// 清除高级筛选但保留其他搜索条件
		clearAdvancedFilter() {
			this.isAdvancedFilterActive = false;
			this.filteredItems = [];
			this.filterName = '';
			this.customCategory = '';
			this.filterLocation = '';
			this.filterStatus = 'all';
			this.filterUserId = '';
			this.filterStartTime = '';
			this.filterEndTime = '';
			// 同步清除"应用"时刻的参数快照
			this.appliedFilterParams = null;
			this.appliedFilterType = null;
			
			// 添加一个轻提示，告知用户高级筛选已清除
			uni.showToast({
				title: '已清除高级筛选',
				icon: 'none',
				duration: 1500
			});
		},
		
		// 切换排序方式
		toggleSortOrder() {
			this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
			// 如果有高级筛选结果，也需要重新排序
			if (this.isAdvancedFilterActive && this.filteredItems.length > 0) {
				this.filteredItems = [...this.filteredItems].sort((a, b) => {
					const timeA = new Date(a.item_type === 'found' || this.filterType === 'found' ? a.found_time : a.lost_time).getTime();
					const timeB = new Date(b.item_type === 'found' || this.filterType === 'found' ? b.found_time : b.lost_time).getTime();
					return this.sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
				});
			}
			
			// 添加提示信息
			uni.showToast({
				title: this.sortOrder === 'desc' ? '已按最新时间排序' : '已按最早时间排序',
				icon: 'none',
				duration: 1500
			});
		}
	}
};
</script>

<style lang="scss">
.index-container {
	min-height: 100vh;
	background-color: #f8f8f8;
	position: relative;
}

.search-bar {
	padding: 20rpx 30rpx;
	background-color: #fff;
}

.search-input-box {
	height: 70rpx;
	background-color: #f2f2f2;
	border-radius: 35rpx;
	display: flex;
	align-items: center;
	padding: 0 30rpx;
}

.search-icon-img {
	width: 32rpx;
	height: 32rpx;
	margin-right: 10rpx;
}

.search-input {
	flex: 1;
	height: 70rpx;
	font-size: 28rpx;
}

.search-btn {
	font-size: 28rpx;
	color: #fff;
	background-color: #007AFF;
	padding: 0 20rpx;
	height: 50rpx;
	line-height: 50rpx;
	border-radius: 25rpx;
	margin-left: 10rpx;
	text-align: center;
	font-weight: 500;
}

.banner {
	height: 300rpx;
	width: 100%;
}

.banner-image {
	width: 100%;
	height: 100%;
	border-radius: 0;
	overflow: hidden;
}

.notice-bar {
	display: flex;
	align-items: center;
	background-color: #fff;
	padding: 15rpx 30rpx;
	margin-top: 20rpx;
	border-radius: 20rpx;
	width: calc(100% - 20rpx);
	box-sizing: border-box;
	margin-left: auto;
	margin-right: auto;
}

.notice-swiper {
	flex: 1;
	height: 60rpx;
	margin: 0 20rpx;
}

.notice-item {
	display: flex;
	align-items: center;
	height: 60rpx;
}

.notice-text {
	font-size: 26rpx;
	color: #333;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
}

.notice-new {
	font-size: 20rpx;
	color: #fff;
	background-color: #FF3B30;
	padding: 2rpx 8rpx;
	border-radius: 10rpx;
	margin-left: 10rpx;
}

.notice-more {
	font-size: 24rpx;
	color: #007AFF;
	padding: 0 10rpx;
}

.notice-more-btn {
	font-size: 24rpx;
	color: #ffffff;
	background-color: #007AFF;
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
	text-align: center;
}

.search-status {
	display: flex;
	align-items: center;
	background-color: #fff;
	padding: 15rpx 30rpx;
	margin-top: 20rpx;
	border-radius: 20rpx;
	width: calc(100% - 20rpx);
	box-sizing: border-box;
	margin-left: auto;
	margin-right: auto;
}

.search-status-text {
	font-size: 26rpx;
	color: #333;
	margin-right: 10rpx;
}

.category-nav {
	display: flex;
	flex-wrap: wrap;
	padding: 20rpx;
	background-color: #fff;
	margin-top: 20rpx;
	border-radius: 20rpx;
	width: calc(100% - 20rpx);
	box-sizing: border-box;
	margin-left: auto;
	margin-right: auto;
}

.category-item {
	width: 25%;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 20rpx;
}

.category-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 10rpx;
	transition: all 0.3s;
}

.category-icon.active {
	transform: scale(1.1);
	box-shadow: 0 0 10rpx rgba(0, 0, 0, 0.2);
}

.icon-text {
	color: #fff;
	font-size: 32rpx;
	font-weight: bold;
}

.category-name {
	font-size: 24rpx;
	color: #333;
	transition: all 0.3s;
}

.category-name.active {
	color: #007AFF;
	font-weight: bold;
}

.tabs {
	display: flex;
	height: 80rpx;
	background-color: #fff;
	margin-top: 20rpx;
	position: relative;
	border-radius: 20rpx;
	width: calc(100% - 20rpx);
	box-sizing: border-box;
	margin-left: auto;
	margin-right: auto;
}

.tab-item {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
	color: #666;
	position: relative;
}

.tab-item.active {
	color: #007AFF;
	font-weight: bold;
}

.tab-item.active::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 60rpx;
	height: 4rpx;
	background-color: #007AFF;
	border-radius: 2rpx;
}

.filter-panel {
	position: fixed;
	top: 0;
	right: 0;
	width: 80%;
	height: 100vh;
	background-color: #fff;
	z-index: 999;
	box-shadow: -4rpx 0 20rpx rgba(0, 0, 0, 0.1);
	padding: 30rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

.filter-scroll {
	flex: 1;
	overflow-y: auto;
}

.filter-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-bottom: 30rpx;
	border-bottom: 1rpx solid #eee;
}

.filter-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.filter-section {
	margin-top: 30rpx;
}

.filter-section-title {
	font-size: 28rpx;
	color: #333;
	margin-bottom: 20rpx;
	display: block;
}

.filter-tags {
	display: flex;
	flex-wrap: wrap;
}

.filter-tag {
	padding: 10rpx 20rpx;
	background-color: #f2f2f2;
	border-radius: 30rpx;
	margin-right: 20rpx;
	margin-bottom: 20rpx;
	font-size: 24rpx;
	color: #666;
}

.filter-tag.active {
	background-color: #007AFF;
	color: #fff;
}

.filter-input {
	width: 100%;
	height: 70rpx;
	background-color: #f2f2f2;
	border-radius: 10rpx;
	padding: 0 20rpx;
	font-size: 26rpx;
	margin-bottom: 10rpx;
}

.filter-buttons {
	margin-top: 30rpx;
	display: flex;
	justify-content: space-between;
	padding-top: 30rpx;
	border-top: 1rpx solid #eee;
}

.filter-btn {
	width: 45%;
	height: 80rpx;
	border-radius: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 28rpx;
}

.filter-btn.reset {
	background-color: #f2f2f2;
	color: #666;
}

.filter-btn.apply {
	background-color: #007AFF;
	color: #fff;
}

.filter-result-tip {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx;
	background-color: #f0f8ff;
	border-radius: 20rpx;
	margin-bottom: 20rpx;
	width: calc(100% - 20rpx);
	box-sizing: border-box;
	margin-left: auto;
	margin-right: auto;
}

.filter-result-text {
	font-size: 26rpx;
	color: #007AFF;
	font-weight: bold;
}

.filter-result-reset {
	font-size: 24rpx;
	color: #666;
	padding: 6rpx 16rpx;
	background-color: #fff;
	border-radius: 20rpx;
}

.item-tags {
	display: flex;
	flex-shrink: 0;
	max-width: 100%;
	overflow: visible;
}

.item-category {
	font-size: 24rpx;
	color: #fff;
	background-color: #007AFF;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	flex-shrink: 0;
	white-space: nowrap;
	margin-left: 5rpx;
}

.item-status {
	font-size: 24rpx;
	color: #fff;
	background-color: #FF9500;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	margin-right: 5rpx;
	flex-shrink: 0;
	white-space: nowrap;
}

.item-status.completed {
	background-color: #4CD964;
}

.item-type {
	font-size: 24rpx;
	color: #fff;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	margin-left: 5rpx;
	flex-shrink: 0;
	white-space: nowrap;
}

.item-type.lost {
	background-color: #FF3B30;
}

.item-type.found {
	background-color: #4CD964;
}

.item-list {
	height: calc(100vh - 600rpx);
	padding: 20rpx 10rpx;
	box-sizing: border-box;
	width: 100%;
	overflow-x: hidden;
}

.item-card {
	display: flex;
	background-color: #fff;
	border-radius: 20rpx;
	padding: 20rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
	width: calc(100% - 20rpx);
	box-sizing: border-box;
	margin-left: auto;
	margin-right: auto;
}

.item-image {
	width: 160rpx;
	height: 160rpx;
	border-radius: 10rpx;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.item-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	width: calc(100% - 180rpx);
	max-width: calc(100% - 180rpx);
}

.item-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10rpx;
	width: 100%;
	overflow: visible;
}

.item-name {
	font-size: 32rpx;
	color: #333;
	font-weight: bold;
	flex-shrink: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	max-width: 50%;
}

.item-desc {
	font-size: 26rpx;
	color: #666;
	margin-bottom: 10rpx;
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	line-clamp: 2;
	-webkit-box-orient: vertical;
}

.item-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: auto;
	width: 100%;
}

.item-location {
	font-size: 24rpx;
	color: #999;
	flex-shrink: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-right: 10rpx;
	max-width: 50%;
}

.item-time {
	font-size: 24rpx;
	color: #999;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	flex-shrink: 0;
	text-align: right;
	max-width: 50%;
}

.loading-more {
	text-align: center;
	padding: 20rpx 0;
}

.loading-text {
	font-size: 24rpx;
	color: #999;
}

.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 100rpx 0;
}

.empty-image {
	width: 200rpx;
	height: 200rpx;
	margin-bottom: 20rpx;
}

.empty-text {
	font-size: 28rpx;
	color: #999;
}

.float-btn {
	position: fixed;
	right: 30rpx;
	bottom: 100rpx;
	width: 100rpx;
	height: 100rpx;
	background: linear-gradient(to right, #007AFF, #5AC8FA);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 20rpx rgba(0, 122, 255, 0.3);
}

.float-btn-icon {
	font-size: 50rpx;
	color: #fff;
	font-weight: bold;
}

.date-picker-container {
	width: 100%;
}

.date-picker-item {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.date-picker-label {
	font-size: 26rpx;
	color: #666;
	width: 150rpx;
}

.date-picker-component {
	flex: 1;
}
</style>
