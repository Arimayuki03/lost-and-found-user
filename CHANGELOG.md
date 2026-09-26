# 更新日志

本项目的所有重要变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循[语义化版本](https://semver.org/lang-zh-CN/)。

## [1.0.1] - 2026-09-26

2026-09-26 全量代码审查后集中修复。

### Fixed（修复）

- **高危**：令牌刷新存在两套互不感知的单例（`utils/request.js` 的 `refreshTokenSingleton` 与 `utils/api.js` 的 `refreshOnce`），两栈请求并发时会对 `/common/refresh` 发起重复刷新；且 `api.user.refreshToken` 的 401 分支是不完整登出（只清 storage + toast + reLaunch，不重置 Vuex、不关 Socket、不清角标）。收敛为 `utils/refresh-token.js` 的共享单例 `sharedRefreshToken`：两栈复用同一条在途 Promise，401 走 `forceLogout` 完整登出管道；写回凭证前校验 refreshToken 快照，登出竞态（刷新在途期间用户登出）不再把新令牌"复活"到已登出设备。
- **高危**：刷新令牌遇网络错误/5xx 被无条件当作登录过期，清空凭证强制登出（弱网/离线打开 App 即复现）。request 主链路与 uploadFile 的 4 个刷新失败 catch 点统一区分：仅认证类失败（401/无刷新令牌）才登出，网络类失败保留登录态提示重试（`utils/request.js`）。
- **高危**：聊天消息发送超时/断线后气泡永久停留"发送中"，重发机制永不触发（`sendMessage` 从不传 `onFailed` 回调）。两处调用补回调，disconnect 清队列时逐条通知页面标记失败（`pages/chat/chat.vue`、`utils/socketio.js`）。
- 首页失物/招领 tab 来回切换后触底加载把同一页数据二次拼入（switchTab 只重置页码不清列表）。全部追加分支（含搜索/分类/高级筛选）按 id 去重（`pages/index/index.vue`）。
- 并发加入私聊房间时所有在途 handler 消费同一条 `join_private_chat_result` 事件，可能把未成功加入的房间标记为已加入（此后该会话私聊静默丢失）。结果 handler 校验 `room_name` 匹配才消费（`utils/socketio.js`）。
- 详情页 `formatDate` 直接 `new Date("YYYY-MM-DD HH:mm:ss")`，iOS 全端渲染 "NaN-NaN-NaN"。空格替换为 `T` 解析并补 Invalid Date 守卫（`pages/detail/detail.vue`）。
- 刷新令牌定时器、请求链路的刷新失败路径区分认证/网络错误（与上条高危合并修复，`isAuthRefreshError` + `isNoRefreshTokenError` 分流）。
- 登出只清用户凭证，业务列表状态（lostItems/foundItems/chatList/announcements）跨账号残留；`CLEAR_USER_INFO` 一并重置（`store/index.js`）。
- AI 图片识别映射出的"钱包/钱物"类别不在发布页枚举与首页筛选中，该类别物品分类筛选永远查不到；映射值对齐枚举"钱包"（`pages/publish/publish.vue`）。
- 多个表单"用 trim 值校验、提交原始值"，首尾空格原样发给后端（登录学号、注册姓名、发布字段、反馈内容）；提交入口统一构造 trim 后 payload，密码不 trim（各表单页）。
- 进入会话批量已读后 tabBar 未读角标不刷新，与后端实际未读不一致直到下次触发；已读成功后同步清零角标（`pages/chat/chat.vue`）。

## [1.0.0] - 2026-09-21

### Added

- 初始开源版本：校园失物招领平台用户端前端。
- 失物 / 招领信息发布、浏览、多条件筛选与搜索。
- 基于 Socket.IO 的实时私信（已读回执、未读数、在线状态）。
- JWT 双令牌认证（自动刷新、401 静默重试）、邮箱验证码注册与重置密码。
- 个人中心（头像、资料、换绑邮箱、我的发布、意见反馈）、公告、轮播图等模块。
- 兼容 H5 / 微信小程序 / App 多端。

### Fixed（修复，2026-09-20 安全与可用性审查后集中修复）

- **高危**：令牌刷新定时器在非 401 失败（网络错误 / 5xx / 429）时形成 0 延迟死循环——`finally` 无条件自续 + `Math.max(0, 过期提前量)` 使 delay 恒为 0，令牌进入最后 5 分钟且刷新持续失败时疯狂请求 `/common/refresh`。重构为调度与回调分离：401/认证失败停止定时器走登出；其他失败按指数退避（5s 起步、上限 5 分钟、连续 5 次后停止），成功后恢复正常"提前 300 秒"调度（`utils/request.js`）。
- 聊天消息列表 `:key` 由数组下标改为稳定唯一 `_key`，历史消息头插重排时发送中/失败/已读等可变状态不再串位（`pages/chat/chat.vue`）。
- 消息发送回执闭环：新增 `message_sent` 回执监听（按 temp_id 匹配，10 秒超时判失败），发送失败将气泡标记为"发送失败，点击重发"并提供点击重试入口，不再永久停留"发送中"（`utils/socketio.js`、`pages/chat/chat.vue`）。
- 首页 4 处分页参数 `page_size` 改为后端实际读取的 `size`（此前恰好与默认值一致掩盖了问题）（`pages/index/index.vue`）。
- 分类筛选统一走后端：删除首页 computed 中的本地二次分类过滤（保留客户端排序），筛选来源切换时行为一致（`pages/index/index.vue`）。
- 登出清理 tabBar 消息角标：手动退出与 401 强制登出两条路径对称调用 `updateMessageBadge(0)`（`pages/my/my.vue`、`utils/auth.js`）。
- 新增 `vite.config.js`（CLI 构建配置：`@` 别名映射项目根、补 `.vue` 扩展名解析），`npm run build:h5` 等 CLI 命令不再依赖 HBuilderX 工程结构假设。
