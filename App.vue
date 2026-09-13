<script>
	import store from './store'

	export default {
		onLaunch: function() {
			// 冷启动恢复登录态：本地有 token 但 userInfo 只存在于内存中，
			// 必须拉取一次用户信息，否则聊天页 Socket 初始化（依赖 userInfo.id）会静默失败
			const token = uni.getStorageSync('token');
			if (token && !store.state.userInfo) {
				store.dispatch('getUserInfo').catch(() => {
					// 拉取失败（如 token 已过期）由请求层统一处理登出跳转
				});
			}
		},
		onShow: function() {
		},
		onHide: function() {
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
