# 更新日志

本项目的所有重要变更将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

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
