<template>
	<view class="index-container">
		<!-- 搜索栏 -->
		<view class="search-bar">
			<view class="search-input-box">
				<uni-icons type="search" size="18" :color="colorGrey"></uni-icons>
				<input 
					class="search-input" 
					type="text" 
					v-model="searchKeyword" 
					placeholder="请输入物品名称或描述" 
					confirm-type="search"
					@confirm="handleSearch"
				/>
				<uni-icons v-if="searchKeyword" type="clear" size="18" :color="colorGrey" @click="clearSearch"></uni-icons>
				<view class="search-btn" @tap="handleSearch">搜索</view>
			</view>
		</view>
		
		<!-- 轮播图 -->
		<swiper class="banner" indicator-dots autoplay circular :interval="3000" :duration="500">
			<swiper-item v-for="(item, index) in limitedCarouselImages" :key="index">
				<image :src="item.image_url" mode="aspectFill" class="banner-image"></image>
			</swiper-item>
			<!-- 无轮播图时的品牌占位卡（替代 logo 拉伸） -->
			<swiper-item v-if="limitedCarouselImages.length === 0">
				<view class="banner-placeholder">
					<view class="banner-placeholder-info">
						<text class="banner-title">校园失物招领</text>
						<text class="banner-sub">拾获一份善意 · 归还一份温暖</text>
					</view>
					<image class="banner-logo" src="/static/logo.png" mode="aspectFit"></image>
				</view>
			</swiper-item>
		</swiper>
		
		<!-- 公告栏 -->
		<view class="notice-bar">
			<uni-icons type="notification-filled" size="18" :color="colorWarning"></uni-icons>
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
		
		<!-- 高级筛选面板（遮罩 + 右侧滑入） -->
		<view class="filter-mask" v-if="showFilterPanel" @tap="toggleFilterPanel"></view>
		<view class="filter-panel" :class="{ open: showFilterPanel }">
			<view class="filter-header">
				<text class="filter-title">高级筛选</text>
				<view class="filter-close" @tap="toggleFilterPanel"><uni-icons type="closeempty" size="18" :color="colorGrey"></uni-icons></view>
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
				<lf-icon-item
					class="category-icon"
					:class="{ 'category-icon-active': selectedCategory === item.value }"
					:icon="item.glyph"
					:color="item.color"
					:size="80"
					:icon-size="34"
				/>
				<text class="category-name" :class="{ 'active': selectedCategory === item.value }">{{ item.label }}</text>
			</view>
		</view>
		
		<!-- 切换标签：失物/招领分段控件 + 筛选/排序图标按钮 -->
		<view class="tabs">
			<view class="lf-segment tabs-segment">
				<view class="lf-segment-item" :class="{ active: activeTab === 'lost' }" @tap="switchTab('lost')">失物信息</view>
				<view class="lf-segment-item" :class="{ active: activeTab === 'found' }" @tap="switchTab('found')">招领信息</view>
			</view>
			<view class="tabs-actions">
				<view class="tab-action" :class="{ active: isAdvancedFilterActive || showFilterPanel }" @tap="toggleFilterPanel">
					<uni-icons type="settings" size="20" :color="(isAdvancedFilterActive || showFilterPanel) ? colorPrimary : colorGrey"></uni-icons>
				</view>
				<view class="tab-action" @tap="toggleSortOrder">
					<uni-icons :type="sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'" size="20" :color="colorGrey"></uni-icons>
				</view>
			</view>
		</view>
		
		<!-- 列表内容 -->
		<scroll-view 
			class="item-list lf-card-list" 
			scroll-y 
			@scrolltolower="loadMore"
			refresher-enabled
			:refresher-triggered="isRefreshing"
			@refresherrefresh="onRefresh"
		>
			<!-- 首屏骨架屏：数据返回前占位（呼吸动画样式见 common.scss .skeleton-block） -->
				<view class="item-grid" v-if="!firstLoaded">
					<view class="item-card skeleton-card" v-for="i in 4" :key="'skeleton-' + i">
						<view class="skeleton-block skeleton-image"></view>
						<view class="item-info">
							<view class="skeleton-block skeleton-line-name"></view>
							<view class="skeleton-block skeleton-line-tag"></view>
							<view class="skeleton-block skeleton-line-desc"></view>
							<view class="skeleton-block skeleton-line-meta"></view>
						</view>
					</view>
				</view>

			<!-- 筛选结果提示 -->
			<view class="filter-result-tip" v-if="isAdvancedFilterActive">
				<text class="filter-result-text">筛选结果</text>
				<view class="filter-result-reset" @tap="clearSearch">清除筛选</view>
			</view>
			
			<view class="item-grid" v-if="firstLoaded && activeTab === 'lost' && !isAdvancedFilterActive && filteredLostItems.length > 0">
				<view class="item-card" v-for="item in filteredLostItems" :key="item.id" @tap="goToDetail('lost', item.id)">
					<image v-if="item.image_url" class="item-image" :src="item.image_url" mode="aspectFill"></image>
					<view v-else class="item-image item-image-placeholder" :style="{ backgroundColor: categoryColor(item.category) }">
						<text class="placeholder-text">{{ item.category || '未分类' }}</text>
					</view>
					<view class="item-info">
						<view class="item-name-row">
							<text class="item-name">{{ item.name }}</text>
							<text class="item-time">{{ $utils.relativeTime(item.lost_time) }}</text>
						</view>
						<view class="item-tags">
							<lf-status-tag :status="item.is_completed ? 'completed' : 'open'" :label="item.is_completed ? '已找到' : '寻找中'" />
							<text class="item-category">{{ item.category }}</text>
						</view>
						<text class="item-desc">{{ item.description }}</text>
						<view class="item-footer">
							<uni-icons class="location-icon" type="location-filled" size="12" :color="colorPrimary"></uni-icons>
							<text class="item-location">{{ item.location || '未填写地点' }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 招领列表（双列卡片） -->
			<view class="item-grid" v-if="firstLoaded && activeTab === 'found' && !isAdvancedFilterActive && filteredFoundItems.length > 0">
				<view class="item-card" v-for="item in filteredFoundItems" :key="item.id" @tap="goToDetail('found', item.id)">
					<image v-if="item.image_url" class="item-image" :src="item.image_url" mode="aspectFill"></image>
					<view v-else class="item-image item-image-placeholder" :style="{ backgroundColor: categoryColor(item.category) }">
						<text class="placeholder-text">{{ item.category || '未分类' }}</text>
					</view>
					<view class="item-info">
						<view class="item-name-row">
							<text class="item-name">{{ item.name }}</text>
							<text class="item-time">{{ $utils.relativeTime(item.found_time) }}</text>
						</view>
						<view class="item-tags">
							<lf-status-tag :status="item.is_completed ? 'completed' : 'open'" :label="item.is_completed ? '已归还' : '招领中'" />
							<text class="item-category">{{ item.category }}</text>
						</view>
						<text class="item-desc">{{ item.description }}</text>
						<view class="item-footer">
							<uni-icons class="location-icon" type="location-filled" size="12" :color="colorPrimary"></uni-icons>
							<text class="item-location">{{ item.location || '未填写地点' }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 筛选结果列表（双列卡片） -->
			<view class="item-grid" v-if="firstLoaded && isAdvancedFilterActive && filteredItems.length > 0">
				<view class="item-card" v-for="item in filteredItems" :key="item.id" @tap="goToDetail(item.item_type || (filterType === 'lost' ? 'lost' : 'found'), item.id)">
					<image v-if="item.image_url" class="item-image" :src="item.image_url" mode="aspectFill"></image>
					<view v-else class="item-image item-image-placeholder" :style="{ backgroundColor: categoryColor(item.category) }">
						<text class="placeholder-text">{{ item.category || '未分类' }}</text>
					</view>
					<view class="item-info">
						<view class="item-name-row">
							<text class="item-name">{{ item.name }}</text>
							<text class="item-time">{{ $utils.relativeTime((item.item_type === 'found' || filterType === 'found') ? item.found_time : item.lost_time) }}</text>
						</view>
						<view class="item-tags">
							<lf-status-tag :status="item.is_completed ? 'completed' : 'open'" :label="item.is_completed ? (item.item_type === 'found' || filterType === 'found' ? '已归还' : '已找到') : (item.item_type === 'found' || filterType === 'found' ? '招领中' : '寻找中')" />
							<text class="item-category">{{ item.category }}</text>
							<lf-status-tag :status="(item.item_type === 'found' || filterType === 'found') ? 'found' : 'lost'" :label="(item.item_type === 'found' || filterType === 'found') ? '招领' : '失物'" />
						</view>
						<text class="item-desc">{{ item.description }}</text>
						<view class="item-footer">
							<uni-icons class="location-icon" type="location-filled" size="12" :color="colorPrimary"></uni-icons>
							<text class="item-location">{{ item.location || '未填写地点' }}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 触底加载提示（列表非空才显示，避免与空态同屏） -->
			<lf-load-more v-if="firstLoaded && !isEmptyList" :loading="isLoadingMore" :finished="!hasMore" />


			<!-- 空状态 -->
			<lf-empty
				v-if="firstLoaded && isEmptyList"
				:type="(searchKeyword || isAdvancedFilterActive || selectedCategory) ? 'search' : 'items'"
				:text="(searchKeyword || isAdvancedFilterActive || selectedCategory) ? '没有找到相关物品' : '暂无物品'"
			/>
		</scroll-view>
		

	</view>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { checkLogin, goToLogin } from '../../utils/common';
import { COLOR_PRIMARY, COLOR_GREY, COLOR_SUCCESS, COLOR_WARNING, COLOR_ERROR, COLOR_PURPLE, COLOR_PINK, COLOR_GOLD, COLOR_SLATE } from '@/config/ui';
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue';
import uniDatetimePicker from '@dcloudio/uni-ui/lib/uni-datetime-picker/uni-datetime-picker.vue';

export default {
	components: {
		uniIcons,
		uniDatetimePicker
	},
	data() {
		return {
			colorPrimary: COLOR_PRIMARY, // 主色（uni-icons 激活色，与 token 同步）
			colorGrey: COLOR_GREY, // 未激活图标色
			colorWarning: COLOR_WARNING, // 公告铃铛色
			activeTab: 'lost', // 当前激活的标签：lost-失物，found-招领
			searchKeyword: '', // 搜索关键词
			selectedCategory: '', // 选中的分类
			page: 1, // 当前页码
			pageSize: 10, // 每页数量
			hasMore: true, // 是否有更多数据
			isRefreshing: false, // 是否正在刷新
			isLoadingMore: false, // 是否正在加载更多（防触底重入）
			firstLoaded: false, // 首屏数据是否已加载完成（未完成时列表区显示骨架屏）
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
				{ value: '电子产品', label: '电子产品', glyph: 'gear', color: COLOR_WARNING },
				{ value: '证件', label: '证件', glyph: 'staff', color: COLOR_PRIMARY },
				{ value: '钱包', label: '钱包', glyph: 'wallet', color: COLOR_SUCCESS },
				{ value: '钥匙', label: '钥匙', glyph: 'locked', color: COLOR_ERROR },
				{ value: '书籍', label: '书籍', glyph: 'list', color: COLOR_PURPLE },
				{ value: '衣物', label: '衣物', glyph: 'cart', color: COLOR_PINK },
				{ value: '饰品', label: '饰品', glyph: 'star', color: COLOR_GOLD },
				{ value: '', label: '全部', glyph: 'bars', color: COLOR_SLATE }
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

		// 当前视图列表是否为空（决定空态展示）
		isEmptyList() {
			if (this.isAdvancedFilterActive) return this.filteredItems.length === 0;
			return this.activeTab === 'lost' ? this.filteredLostItems.length === 0 : this.filteredFoundItems.length === 0;
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
			// 首屏加载用列表区骨架屏占位，不弹 loading 弹窗（避免闪烁叠加）；
			// 二次加载（下拉刷新/切分类）仍用弹窗提示
			const first = !this.firstLoaded;
			if (!first) {
				uni.showLoading({
					title: '加载中...'
				});
			}
			
			// 添加超时处理
			const timeout = setTimeout(() => {
				if (!first) uni.hideLoading();
				this.isRefreshing = false;
				this.firstLoaded = true;
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
				if (!first) uni.hideLoading();
			} catch (error) {
				clearTimeout(timeout); // 清除超时
				if (!first) uni.hideLoading();
				uni.showToast({
					title: '加载失败，请稍后再试',
					icon: 'none'
				});
			} finally {
				this.firstLoaded = true;
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
		
		// 无图物品的分类色块：与分类导航同源取色，未知分类（AI 自定义等）回退主色
		categoryColor(category) {
			const hit = this.categories.find((c) => c.value === category);
			return (hit && hit.color) || COLOR_PRIMARY;
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

<style lang="scss" scoped>
.index-container {
	min-height: 100vh;
	background-color: $uni-bg-color-grey;
	position: relative;
}

/* ===== 搜索栏（吸顶） ===== */
.search-bar {
	position: sticky;
	top: 0;
	z-index: 90;
	padding: 20rpx $uni-spacing-page;
	background-color: $uni-bg-color;
	box-shadow: 0 2rpx 12rpx rgba(31, 41, 55, 0.04);
}

.search-input-box {
	height: 76rpx;
	background-color: $uni-bg-color-section;
	border-radius: 38rpx;
	display: flex;
	align-items: center;
	padding: 0 12rpx 0 28rpx;
}

.search-input {
	flex: 1;
	height: 76rpx;
	font-size: $uni-font-size-base;
	min-width: 0;
}

.search-btn {
	font-size: $uni-font-size-base;
	color: $uni-text-color-inverse;
	background-color: $uni-color-primary;
	padding: 0 30rpx;
	height: 56rpx;
	line-height: 56rpx;
	border-radius: 28rpx;
	margin-left: 12rpx;
	text-align: center;
	font-weight: 500;
	flex-shrink: 0;

	&:active {
		background-color: $uni-color-primary-deep;
	}
}

/* ===== 轮播图 ===== */
.banner {
	height: 300rpx;
	width: calc(100% - #{$uni-spacing-page} * 2);
	margin: $uni-spacing-gap auto 0;
	border-radius: $uni-radius-lg;
	overflow: hidden;
	box-shadow: $uni-shadow-card;
}

.banner-image {
	width: 100%;
	height: 100%;
}

/* 无轮播图时的品牌占位卡 */
.banner-placeholder {
	width: 100%;
	height: 100%;
	background: $uni-gradient-hero;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 44rpx;
	box-sizing: border-box;
}

.banner-placeholder-info {
	display: flex;
	flex-direction: column;
}

.banner-title {
	font-size: 40rpx;
	font-weight: 600;
	color: $uni-text-color-inverse;
	letter-spacing: 2rpx;
}

.banner-sub {
	font-size: $uni-font-size-caption;
	color: rgba(255, 255, 255, 0.75);
	margin-top: 14rpx;
}

.banner-logo {
	width: 140rpx;
	height: 140rpx;
	border-radius: 32rpx;
	background-color: rgba(255, 255, 255, 0.92);
	padding: 12rpx;
	box-sizing: content-box;
}

/* ===== 公告栏 ===== */
.notice-bar {
	display: flex;
	align-items: center;
	background-color: $uni-bg-color;
	padding: 20rpx $uni-spacing-card;
	margin-top: $uni-spacing-gap;
	border-radius: $uni-border-radius-card;
	width: calc(100% - #{$uni-spacing-page} * 2);
	box-sizing: border-box;
	margin-left: auto;
	margin-right: auto;
	box-shadow: $uni-shadow-card;
}

.notice-swiper {
	flex: 1;
	height: 60rpx;
	margin: 0 20rpx;
	min-width: 0;
}

.notice-item {
	display: flex;
	align-items: center;
	height: 60rpx;
}

.notice-text {
	font-size: $uni-font-size-sm;
	color: $uni-text-color;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	flex: 1;
}

.notice-new {
	font-size: $uni-font-size-caption;
	color: $uni-color-error;
	background-color: $uni-color-error-soft;
	padding: 2rpx 12rpx;
	border-radius: $uni-radius-xs;
	margin-left: 12rpx;
	flex-shrink: 0;
}

.notice-more-btn {
	font-size: $uni-font-size-caption;
	color: $uni-color-primary;
	background-color: $uni-color-primary-soft;
	padding: 8rpx 22rpx;
	border-radius: 24rpx;
	text-align: center;
	flex-shrink: 0;

	&:active {
		opacity: 0.7;
	}
}

/* ===== 搜索状态提示 ===== */
.search-status {
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: $uni-bg-color;
	padding: 20rpx $uni-spacing-card;
	margin-top: $uni-spacing-gap;
	border-radius: $uni-border-radius-card;
	width: calc(100% - #{$uni-spacing-page} * 2);
	box-sizing: border-box;
	margin-left: auto;
	margin-right: auto;
	box-shadow: $uni-shadow-card;
}

.search-status-text {
	font-size: $uni-font-size-sm;
	color: $uni-text-color-grey;
	margin-right: 10rpx;
	flex: 1;
	min-width: 0;
}

/* ===== 分类导航 ===== */
.category-nav {
	display: flex;
	flex-wrap: wrap;
	padding: 28rpx 10rpx 8rpx;
	background-color: $uni-bg-color;
	margin-top: $uni-spacing-gap;
	border-radius: $uni-border-radius-card;
	width: calc(100% - #{$uni-spacing-page} * 2);
	box-sizing: border-box;
	margin-left: auto;
	margin-right: auto;
	box-shadow: $uni-shadow-card;
}

.category-item {
	width: 25%;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 24rpx;
}

/* 分类图标选中反馈：作用于 lf-icon-item 根节点（class 经组件标签透传） */
.category-icon {
	transition: transform 0.2s;
}

.category-icon-active {
	transform: scale(1.12);
}

.category-name {
	font-size: $uni-font-size-caption;
	color: $uni-text-color;
	margin-top: 10rpx;
	transition: color 0.2s;
}

.category-name.active {
	color: $uni-color-primary;
	font-weight: 600;
}

/* ===== 主 tab（分段控件 + 图标按钮） ===== */
.tabs {
	display: flex;
	align-items: center;
	height: 96rpx;
	background-color: $uni-bg-color;
	margin-top: $uni-spacing-gap;
	border-radius: $uni-border-radius-card;
	width: calc(100% - #{$uni-spacing-page} * 2);
	box-sizing: border-box;
	margin-left: auto;
	margin-right: auto;
	padding: 0 16rpx;
	box-shadow: $uni-shadow-card;
}

.tabs-segment {
	flex: 1;
	margin-right: 8rpx;
}

/* 主 tab 右侧的筛选/排序图标按钮 */
.tabs-actions {
	display: flex;
	align-items: center;
	flex-shrink: 0;
}

.tab-action {
	width: 72rpx;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: $uni-radius-sm;

	&.active {
		background-color: $uni-color-primary-soft;
	}

	&:active {
		background-color: $uni-bg-color-hover;
	}
}

/* ===== 高级筛选面板（遮罩 + 右侧滑入） ===== */
.filter-mask {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: $uni-bg-color-mask;
	z-index: 998;
	animation: lf-fade-in 0.25s ease;
}

.filter-panel {
	position: fixed;
	top: 0;
	right: 0;
	width: 82%;
	height: 100vh;
	background-color: $uni-bg-color;
	z-index: 999;
	box-shadow: $uni-shadow-raised;
	padding: 30rpx;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	transform: translateX(105%);
	transition: transform 0.28s cubic-bezier(0.32, 0.72, 0.35, 1);

	&.open {
		transform: translateX(0);
	}
}

.filter-scroll {
	flex: 1;
	overflow-y: auto;
}

.filter-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding-bottom: 24rpx;
	border-bottom: 1rpx solid $uni-border-color-split;
}

.filter-title {
	font-size: $uni-font-size-lg;
	font-weight: 600;
	color: $uni-text-color;
}

.filter-close {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background-color: $uni-bg-color-section;
	display: flex;
	align-items: center;
	justify-content: center;

	&:active {
		background-color: $uni-bg-color-hover;
	}
}

.filter-section {
	margin-top: 32rpx;
}

.filter-section-title {
	font-size: $uni-font-size-base;
	color: $uni-text-color;
	font-weight: 600;
	margin-bottom: 20rpx;
	display: block;
}

.filter-tags {
	display: flex;
	flex-wrap: wrap;
}

.filter-tag {
	padding: 12rpx 28rpx;
	background-color: $uni-bg-color-section;
	border-radius: 28rpx;
	margin-right: 18rpx;
	margin-bottom: 18rpx;
	font-size: $uni-font-size-caption;
	color: $uni-text-color-grey;
	border: 2rpx solid transparent;
	transition: all 0.15s;
}

.filter-tag.active {
	background-color: $uni-color-primary-soft;
	color: $uni-color-primary;
	font-weight: 500;
	border-color: rgba($uni-color-primary, 0.35);
}

.filter-input {
	width: 100%;
	height: 76rpx;
	background-color: $uni-bg-color-section;
	border-radius: $uni-radius-md;
	padding: 0 24rpx;
	font-size: $uni-font-size-sm;
	margin-bottom: 10rpx;
	box-sizing: border-box;
}

.filter-buttons {
	margin-top: 30rpx;
	display: flex;
	justify-content: space-between;
	padding-top: 24rpx;
	border-top: 1rpx solid $uni-border-color-split;
}

.filter-btn {
	width: 45%;
	height: 84rpx;
	border-radius: 42rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: $uni-font-size-base;
	font-weight: 500;
}

.filter-btn.reset {
	background-color: $uni-bg-color-section;
	color: $uni-text-color-grey;
}

.filter-btn.apply {
	background-color: $uni-color-primary;
	color: $uni-text-color-inverse;
	box-shadow: $uni-shadow-btn;

	&:active {
		background-color: $uni-color-primary-deep;
	}
}

/* ===== 筛选结果提示 ===== */
.filter-result-tip {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20rpx $uni-spacing-card;
	background-color: $uni-color-primary-softer;
	border: 2rpx solid rgba($uni-color-primary, 0.15);
	border-radius: $uni-border-radius-card;
	margin-bottom: 20rpx;
	width: calc(100% - #{$uni-spacing-page} * 2);
	box-sizing: border-box;
	margin-left: auto;
	margin-right: auto;
}

.filter-result-text {
	font-size: $uni-font-size-sm;
	color: $uni-color-primary;
	font-weight: 600;
}

.filter-result-reset {
	font-size: $uni-font-size-caption;
	color: $uni-text-color-grey;
	padding: 6rpx 20rpx;
	background-color: $uni-bg-color;
	border-radius: 24rpx;
}

/* ===== 列表卡片内标签 ===== */
.item-tags {
	display: flex;
	flex-shrink: 0;
	max-width: 100%;
	overflow: visible;
	gap: 8rpx;
}

.item-category {
	font-size: $uni-font-size-caption;
	color: $uni-color-primary;
	background-color: $uni-color-primary-soft;
	padding: 4rpx 14rpx;
	border-radius: $uni-radius-xs;
	flex-shrink: 0;
	white-space: nowrap;
}

/* ===== 列表容器 ===== */
.item-list {
	height: calc(100vh - 640rpx);
	padding: 20rpx 10rpx calc(40rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	width: 100%;
	overflow-x: hidden;
}

/* ===== 双列卡片网格（基础卡片样式见 common.scss .lf-card-list） ===== */
.item-grid {
	display: flex;
	flex-wrap: wrap;
	padding: 0 5rpx;
}

.item-grid .item-card {
	flex-direction: column;
	width: calc(50% - 10rpx);
	margin: 0 5rpx 20rpx;
	padding: 0;
	overflow: hidden;
}

.item-grid .item-image {
	width: 100%;
	height: 240rpx;
	margin-right: 0;
	border-radius: 0;
}

/* 骨架屏行 */
.skeleton-card {
	pointer-events: none;
}

.skeleton-image {
	width: 100%;
	height: 240rpx;
	border-radius: 0;
}

.skeleton-line-name {
	width: 60%;
	height: 32rpx;
	margin-bottom: 14rpx;
}

.skeleton-line-tag {
	width: 40%;
	height: 28rpx;
	margin-bottom: 14rpx;
}

.skeleton-line-desc {
	width: 100%;
	height: 24rpx;
	margin-bottom: 10rpx;
}

.skeleton-line-meta {
	width: 70%;
	height: 24rpx;
	margin-top: 16rpx;
}

/* 无图物品的分类色块占位 */
.item-image-placeholder {
	display: flex;
	align-items: center;
	justify-content: center;
}

.placeholder-text {
	color: $uni-text-color-inverse;
	font-size: $uni-font-size-md;
	font-weight: 600;
	letter-spacing: 1rpx;
}

.item-grid .item-info {
	/* 根因修复：默认 content-box 时 width:100% + padding 会撑出卡片右侧约 20rpx，
	   时间被 .item-card 的 overflow:hidden 裁掉（表现为"时间显示被遮挡"） */
	box-sizing: border-box;
	width: 100%;
	max-width: 100%;
	padding: 18rpx 22rpx 22rpx;
}

/* 名称行：名称弹性截断 + 时间固定右侧不缩放，时间不会再被挤压或遮挡 */
.item-name-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	width: 100%;
	margin-bottom: 10rpx;
}

.item-grid .item-name {
	flex: 1;
	min-width: 0;
	max-width: 100%;
	margin-bottom: 0;
}

.item-grid .item-tags {
	margin-bottom: 12rpx;
	flex-wrap: wrap; /* 窄卡放不下 3 个标签时换行，避免溢出卡片 */
}

.item-grid .item-desc {
	margin-bottom: 12rpx;
}

/* 底部地点行：细线分隔 + 整行省略号截断，超长地点不再顶到时间 */
.item-grid .item-footer {
	justify-content: flex-start;
	margin-top: auto;
	padding-top: 14rpx;
	border-top: 1rpx solid $uni-border-color-split;
}

.location-icon {
	flex-shrink: 0;
	margin-right: 6rpx;
}

.item-grid .item-location {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.item-time {
	font-size: $uni-font-size-caption;
	color: $uni-text-color-grey;
	white-space: nowrap;
	flex-shrink: 0; /* 时间永远完整展示，不参与挤压 */
	margin-left: 12rpx;
}

/* ===== 筛选面板日期选择 ===== */
.date-picker-container {
	width: 100%;
}

.date-picker-item {
	display: flex;
	align-items: center;
	margin-bottom: 20rpx;
}

.date-picker-label {
	font-size: $uni-font-size-sm;
	color: $uni-text-color-grey;
	width: 150rpx;
}

.date-picker-component {
	flex: 1;
}
</style>
