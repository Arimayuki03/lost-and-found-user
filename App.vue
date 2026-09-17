<script>
	import store from './store'
	import socketIOService from './utils/socketio.js'

	export default {
		onLaunch: function() {
			// 冷启动恢复登录态：本地有 token 但 userInfo 只存在于内存中，
			// 必须拉取一次用户信息，否则聊天页 Socket 初始化（依赖 userInfo.id）会静默失败
			const token = uni.getStorageSync('token');
			if (token) {
				// 应用级建立 Socket：登录后停留在非聊天页（如首页）也能收到
				// 私聊推送并实时刷新"消息"tab 未读角标
				const startSocket = () => {
					try { socketIOService.initSocket(); } catch (e) { /* 由重连/可见性兜底 */ }
				};
				if (store.state.userInfo && store.state.userInfo.id) {
					startSocket();
				} else {
					store.dispatch('getUserInfo').then(startSocket).catch(() => {
						// 拉取失败（如 token 已过期）由请求层统一处理登出跳转
					});
				}
			}
		},
		onShow: function() {
			// 从后台切回时若已登录但连接已断，主动重建
			try { socketIOService.ensureConnected(); } catch (e) { /* ignore */ }
		},
		onHide: function() {
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css —— 跨页复制块统一收入 common.scss（U9）*/
	@import './styles/common.scss';

	/* #ifdef H5 */
	/* 隐藏用户端页面滚动条（页面窗口滚动条 + scroll-view 内部滚动条），滚动行为不受影响 */
	::-webkit-scrollbar {
		width: 0 !important;
		height: 0 !important;
		display: none !important;
		background: transparent !important;
	}

	* {
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE / 旧 Edge */
	}
	/* #endif */
</style>
