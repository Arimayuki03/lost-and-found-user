<div align="center">

# 📱 校园失物招领 · 用户端

**基于 uni-app（Vue 3）的校园失物招领平台用户端，一套代码兼容 H5 / 微信小程序 / App**

失物/招领发布 · 多条件检索 · Socket.IO 实时私信 · 多端兼容

[![uni-app](https://img.shields.io/badge/uni--app-Vue%203-2B9939?logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDJhMTAgMTAgMCAxIDAgMTAgMTBBMTAgMTAgMCAwIDAgMTIgMnoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=&logoColor=white)](https://uniapp.dcloud.net.cn/)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/tag/Arimayuki03/lost_and_found_user?label=Release)](../../releases)

</div>

---

## 📖 简介

基于 **uni-app（Vue 3）** 的校园失物招领平台**用户端**前端，一套代码兼容 **H5 / 微信小程序 / App** 多端。用户可以发布失物（丢失物品）与招领（捡到物品）信息，浏览、筛选、搜索他人发布的信息，并通过 Socket.IO 实时私信联系对方，尽快找回失物。

## 📦 相关仓库

| 仓库 | 说明 | 默认端口 |
| --- | --- | --- |
| [lost_and_found](https://github.com/Arimayuki03/lost_and_found) | Flask 后端（API、Socket.IO、匹配算法、邮件通知） | 5000 |
| [lost_and_found_user](https://github.com/Arimayuki03/lost_and_found_user) | **本项目**：用户端前端（uni-app Vue3，H5 / 微信小程序 / App） | — |
| [lost_and_found_admin](https://github.com/Arimayuki03/lost_and_found_admin) | 管理后台前端（Vue 3 + Element Plus） | 8001 |

## ✨ 功能特性

- 🔍 **信息浏览与检索（首页）**：关键词搜索、轮播图、公告栏、分类导航（电子产品 / 证件 / 钱包 / 钥匙 / 书籍 / 衣物 / 饰品）、失物 / 招领双标签列表，支持类型、分类（含自定义分类）、名称、地点、状态、发布者、时间范围等多条件组合筛选与上拉加载更多。
- 📝 **发布（失物 / 招领）**：双 Tab 独立表单——名称、分类、时间、地点、联系方式、描述（300 字计数）、图片上传；发布图片自动进行违规内容识别；未登录时引导登录 / 注册。
- 🔄 **详情与流转**：物品完整信息与状态标签展示；非本人发布可一键「联系发布者」进入私信；本人发布可「确认已找到 / 确认已归还」、重新发布、编辑、删除。
- 💬 **实时私信**：联系人列表与未读数、历史消息分页加载、Socket.IO 实时收发消息、消息已读回执、在线状态、发送失败重试。
- 👤 **个人中心**：头像更换（拍照 / 相册）、资料编辑、密码修改、更换绑定邮箱（邮箱验证码）、我的发布管理、意见反馈、关于我们、退出登录。
- 🔐 **认证体系**：注册（学号 + 邮箱查重 + 邮箱验证码）、登录、邮箱验证码重置密码；JWT 双令牌（access + refresh）自动刷新与 401 静默重试。
- 🧩 **辅助页面**：公告列表 / 详情、失物 / 拾物编辑、通用输入对话框；统一的空状态、加载更多、状态标签组件。

## 🧰 技术栈

| 类别 | 技术 / 版本 |
| --- | --- |
| 框架 | uni-app（Vue `^3.5.42`，H5 / 小程序 / App 多端） |
| 状态管理 | Vuex `^4.1.0` |
| UI 组件 | uni-ui `^1.5.6`（easycom 自动引入） |
| 实时通信 | Socket.IO Client `^4.7.5` |
| 构建工具 | Vite `^5.4.21`（uni-app CLI 编译链） |
| CSS 预处理 | Sass `^1.104.1` |
| 开发工具 | HBuilderX（推荐，导入即用） |

> 版本以 `package.json` 为准；使用 HBuilderX 开发时，其内置 uni-app 编译器也可直接运行本项目，npm 依赖主要服务于 CLI 方式构建与 Socket.IO、uni-ui 等运行时依赖。

## 🚀 快速开始

> 前置条件：先按 [lost_and_found](https://github.com/Arimayuki03/lost_and_found)（后端）README 启动后端服务（默认 `http://127.0.0.1:5000`）。

### 方式一：HBuilderX（推荐）

1. 克隆仓库并用 HBuilderX 打开本项目目录：

   ```bash
   git clone https://github.com/Arimayuki03/lost_and_found_user.git
   cd lost_and_found_user
   ```

2. 安装 npm 依赖（Socket.IO 客户端、uni-ui 等运行时依赖）：

   ```bash
   npm install
   ```

3. 确认后端地址：全项目统一使用 `config/index.js` 中的 `BASE_URL`（开发环境默认 `http://127.0.0.1:5000`），后端不在本机时只需修改这一处。
4. 通过 HBuilderX 运行到目标端：
   - **H5**：运行 → 运行到浏览器；
   - **微信小程序**：运行 → 运行到小程序模拟器 → 微信开发者工具（需在 `manifest.json` 的 `mp-weixin.appid` 填入自己的 appid）；
   - **App**：运行到手机或自定义基座（Android 端已配置相机、网络等权限）。

### 方式二：CLI（可选）

CLI 构建由 `vite.config.js` 支撑（`@` 别名映射到项目根、补 `.vue` 扩展名解析），与 HBuilderX 编译行为一致。

```bash
npm install
npm run dev:h5          # H5 开发
npm run dev:mp-weixin   # 微信小程序开发（产物导入微信开发者工具）
npm run build:h5        # H5 生产构建
npm run build:mp-weixin # 微信小程序生产构建
```

> ⚠️ 生产部署前必须在 `config/index.js` 填写 `PROD_BASE_URL`（线上 HTTPS 地址），为空时生产构建会在启动阶段显式报错兜底。

## 🏗️ 项目结构

```text
lost_and_found_user/
├── App.vue                     # 应用入口（生命周期钩子，冷启动恢复登录态）
├── main.js                     # 启动文件，注册全局 API / 工具 / Store
├── manifest.json               # 应用配置（App、小程序各端打包配置）
├── pages.json                  # 页面路由、导航栏、tabBar、easycom 配置
├── uni.scss                    # 全局样式变量
├── api/
│   └── message.js              # 消息模块 API（联系人/历史记录/发送/已读/未读数）
├── components/                 # 通用组件
│   ├── lf-auth-header/         #   认证页头部（logo + 标题）
│   ├── lf-empty/               #   空状态占位
│   ├── lf-icon-item/           #   图标条目
│   ├── lf-load-more/           #   加载更多
│   └── lf-status-tag/          #   物品状态标签
├── config/
│   ├── index.js                # 全局配置（唯一后端地址配置点 BASE_URL）
│   └── ui.js                   # UI 令牌（与 uni.scss 变量对应的 JS 侧映射）
├── utils/
│   ├── api.js                  # 全量 API 封装（用户/失物/招领/消息/反馈/公告/轮播图）
│   ├── auth.js                 # 登录态清理（退出/失效时的本地凭证统一清除）
│   ├── request.js              # 请求封装：JWT 自动刷新、401 处理、错误提示
│   ├── socketio.js             # Socket.IO 单例服务（连接、认证、房间、消息事件）
│   └── common.js               # 通用工具（日期格式化、相对时间、登录态检查等）
├── store/
│   └── index.js                # Vuex：用户信息、列表数据、登录/token 刷新等
├── styles/
│   └── common.scss             # 通用样式
├── pages/                      # 页面（按功能分组，见下文）
└── static/                     # 静态资源（logo、tabBar 图标、空状态插图）
```

## 📄 页面与功能模块

### 底部导航（tabBar）

| 标签 | 页面 | 说明 |
| --- | --- | --- |
| 首页 | `pages/index/index` | 信息浏览与检索 |
| 发布 | `pages/publish/publish` | 发布失物 / 招领信息 |
| 消息 | `pages/chat/chat-list` | 私信联系人列表 |
| 我的 | `pages/my/my` | 个人中心 |

### 主要页面

| 模块 | 页面 | 说明 |
| --- | --- | --- |
| 首页 | `pages/index/index` | 搜索、轮播图、公告栏、分类导航、双标签列表、高级筛选 |
| 认证 | `pages/login` / `pages/register` / `pages/reset-password` | 登录、注册（学号 + 邮箱验证码）、重置密码 |
| 发布 | `pages/publish/publish` | 失物 / 招领双 Tab 独立表单，图片上传与违规识别 |
| 详情 | `pages/detail/detail` | 物品详情、联系发布者、确认完成 / 编辑 / 删除 |
| 聊天 | `pages/chat/chat-list` / `pages/chat/chat` | 联系人列表、实时私聊（分页历史、已读回执） |
| 我的 | `pages/my/my` | 头像、资料、密码、换绑邮箱、退出登录 |
| 我的发布 | `pages/my-publish/my-publish` | 失物 / 招领分类管理，编辑、删除、状态标记 |
| 反馈 | `pages/feedback/feedback` | 提交并查看历史反馈 |
| 辅助 | `pages/announcement/`、`pages/edit/`、`pages/common/input-dialog` | 公告列表 / 详情、失物 / 拾物编辑、通用输入对话框 |

## 🔌 API 与认证机制

### 接口封装

- `utils/api.js`：按模块组织全部接口
  - `user`：登录、注册、验证码、邮箱/学号查重、个人资料、头像、邮箱修改、重置密码、刷新 token
  - `lostItem` / `foundItem`：列表、筛选（sift）、详情、发布、更新、删除、我的发布
  - `message`：联系人、聊天记录、发送消息、标记已读、未读数
  - `feedback` / `announcement` / `carousel` / `search`：反馈、公告、轮播图、统一搜索
- `api/message.js`：消息模块独立封装（`/user/chat/*` 系列接口）。

### 认证机制（utils/request.js）

- JWT 双令牌：access token + refresh token，存于本地存储（`token` / `refreshToken`）。
- 请求前自动检查 token：已过期则先静默刷新再请求；即将过期（剩余 < 5 分钟）也会提前刷新；401 时自动刷新并重试一次。
- 单例刷新（Promise 缓存）避免并发刷新；应用启动时通过 `setupAutoRefreshToken` 设置提前刷新的定时器。
- 刷新失败按失败类型分流：401/认证失败停止定时器并走登出；网络错误 / 5xx / 429 等其他失败按指数退避重试（5s 起步、上限 5 分钟、连续 5 次后停止），避免 0 延迟死循环。
- 刷新失败则清除本地登录态并跳转登录页。

### 实时通信（utils/socketio.js）

- 单例 `SocketIOService`：连接时携带 token 完成认证（`authenticate` → `authenticate_result`）。
- 加入个人房间接收消息；进入聊天页时按「两个用户 ID 升序拼接」规则（`chat:小ID-大ID`）加入唯一私聊房间。
- 事件：`send_private_message` / `receive_private_message`（收发消息）、`message_sent`（发送回执，按 temp_id 匹配，超时判失败）、`notify_message_read_private` / `private_message_read`（已读回执）、`user_status`（在线状态），并兼容旧版 `receive_message` / `message_read` 事件。
- 发送失败的消息在聊天页标记为「发送失败，点击重发」，可点击气泡重试。
- 自动重连（最多 5 次）、连接超时重试、页面活跃状态管理。

## 🗃️ 状态管理（store/index.js）

- `state`：用户信息、登录态、失物/招领列表、聊天列表、公告、轮播图。
- `actions`：登录（保存双 token + 拉取用户信息）、注册、重置密码、验证码、资料/头像/邮箱更新、退出登录、各类列表加载、token 刷新、反馈提交。
- `getters`：对外只读访问。

## 🤝 贡献

欢迎提交 Issue 与 Pull Request！贡献流程与规范请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。安全漏洞请勿公开提交，参见 [SECURITY.md](SECURITY.md)。

## 📄 License

[MIT](LICENSE) © 2026-Present Arimayuki03
