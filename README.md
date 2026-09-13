# 校园失物招领平台（用户端）

基于 **uni-app（Vue 3）** 的校园失物招领平台用户端小程序/H5/APP 前端。用户可以发布失物（丢失物品）与招领（捡到物品）信息，浏览、筛选、搜索他人发布的信息，并通过实时私信联系对方，尽快找回失物。

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 框架 | uni-app（Vue 3，兼容小程序 / H5 / App 多端） |
| 状态管理 | Vuex 4 |
| UI 组件 | uni-ui（通过 easycom 自动引入） |
| 网络请求 | uni.request 封装的统一请求模块（JWT 鉴权） |
| 实时通信 | Socket.IO Client（实时私聊、已读回执） |
| 开发工具 | HBuilderX |

## 项目结构

```
lost_and_found_user/
├── App.vue                     # 应用入口（生命周期钩子）
├── main.js                     # 启动文件，注册全局 API / 工具 / Store
├── manifest.json               # 应用配置（App、小程序各端打包配置）
├── pages.json                  # 页面路由、导航栏、tabBar、easycom 配置
├── uni.scss                    # 全局样式变量
├── api/
│   └── message.js              # 消息模块 API（联系人/历史记录/发送/已读/未读数）
├── utils/
│   ├── api.js                  # 全量 API 封装（用户/失物/招领/消息/反馈/公告/轮播图）
│   ├── request.js              # 请求封装：JWT 自动刷新、401 处理、错误提示
│   ├── socketio.js             # Socket.IO 单例服务（连接、认证、房间、消息事件）
│   └── common.js               # 通用工具（日期格式化、相对时间、登录态检查等）
├── store/
│   └── index.js                # Vuex：用户信息、列表数据、登录/token 刷新等
├── pages/                      # 页面（按功能分组，见下文）
└── static/                     # 静态资源（logo、tabBar 图标）
```

## 功能模块

### 底部导航（tabBar）

| 标签 | 页面 | 说明 |
| --- | --- | --- |
| 首页 | `pages/index/index` | 信息浏览与检索 |
| 发布 | `pages/publish/publish` | 发布失物 / 招领信息 |
| 消息 | `pages/chat/chat-list` | 私信联系人列表 |
| 我的 | `pages/my/my` | 个人中心 |

### 首页（index）

- 顶部搜索栏：按物品名称 / 描述关键词搜索。
- 轮播图：展示后台配置的轮播图（最多 5 张），无数据时显示默认 logo。
- 公告栏：垂直滚动的公告条，可跳转公告详情或公告列表。
- 分类导航：电子产品 / 证件 / 钱包 / 钥匙 / 书籍 / 衣物 / 饰品 / 全部，点击即筛选。
- 失物 / 招领双标签列表：支持正序 / 倒序切换（最新 / 最早）。
- 高级筛选面板：类型、分类（含自定义分类）、名称、地点、状态（已完成 / 未完成）、发布者、时间范围等多条件组合筛选。
- 上拉加载更多。

### 认证（login / register / reset-password）

- 自定义导航栏的登录页、注册页、重置密码页。
- 注册：学号（12 位数字，后端查重）、邮箱（查重）、邮箱验证码、密码。
- 重置密码：通过邮箱验证码完成。

### 发布（publish）

- 失物 / 招领双 Tab 独立表单：名称、分类、时间、地点、联系方式、描述（300 字计数）、图片上传（uni.chooseImage）。
- 未登录时引导登录 / 注册。

### 详情（detail）

- 展示物品完整信息与状态标签（已完成 / 审核中）。
- 非本人发布：显示「联系发布者」按钮，跳转私信聊天。
- 本人发布：可「确认已找到 / 确认已归还」（或重新发布）、编辑、删除。

### 聊天（chat-list / chat）

- 联系人列表：最近聊天对象与未读消息数。
- 私聊页：历史消息分页加载（下拉加载更早消息）、Socket.IO 实时收发消息、消息已读回执、未读数统计。

### 我的（my）

- 头像（拍照 / 相册更换）、查看/编辑个人资料（姓名、密码）、更换绑定邮箱（需邮箱验证码）。
- 我的发布（失物 / 招领分类管理，`my-publish`，支持编辑、删除、状态标记）。
- 意见反馈（`feedback`，提交并查看历史反馈）。
- 关于我们、退出登录。

### 辅助页面

- 公告列表 / 公告详情（`pages/announcement/`）。
- 失物编辑 / 拾物编辑（`pages/edit/`）。
- 通用输入对话框（`pages/common/input-dialog`）。

## API 与后端

后端为同一仓库下的 `lost_and_found`（Flask + MySQL + Redis + MinIO + Flask-SocketIO），另有管理端 `lost_and_found_admin`。

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
- 刷新失败则清除本地登录态并跳转登录页。

### 实时通信（utils/socketio.js）

- 单例 `SocketIOService`：连接时携带 token 完成认证（`authenticate` → `authenticate_result`）。
- 加入个人房间接收消息；进入聊天页时按「两个用户 ID 升序拼接」规则（`chat:小ID-大ID`）加入唯一私聊房间。
- 事件：`send_private_message` / `receive_private_message`（收发消息）、`notify_message_read_private` / `private_message_read`（已读回执）、`user_status`（在线状态），并兼容旧版 `receive_message` / `message_read` 事件。
- 自动重连（最多 5 次）、连接超时重试、页面活跃状态管理。

## 状态管理（store/index.js）

- `state`：用户信息、登录态、失物/招领列表、聊天列表、公告、轮播图。
- `actions`：登录（保存双 token + 拉取用户信息）、注册、重置密码、验证码、资料/头像/邮箱更新、退出登录、各类列表加载、token 刷新、反馈提交。
- `getters`：对外只读访问。

## 快速开始

> 前置条件：先按 `lost_and_found`（后端）README 启动后端服务（默认 `http://127.0.0.1:5000`）。

1. 用 HBuilderX 打开本项目目录（或使用 uni-app CLI）。
2. 检查后端地址：全项目统一使用 `config/index.js` 中的 `BASE_URL`（默认 `http://127.0.0.1:5000`），部署时只需修改这一处。
3. 安装 npm 依赖（Socket.IO 客户端、uni-ui）：

   ```bash
   npm install
   ```
4. 通过 HBuilderX 运行到目标端：
   - 微信小程序：运行 → 运行到小程序模拟器 → 微信开发者工具（需在 `manifest.json` 的 `mp-weixin.appid` 填入自己的 appid）；
   - H5：运行 → 运行到浏览器；
   - App：运行到手机或基座（Android 端已配置相机、网络等权限）。

## 相关项目

| 目录 | 说明 |
| --- | --- |
| `../lost_and_found` | Flask 后端（API、Socket.IO、匹配算法、邮件通知） |
| `../lost_and_found_admin` | 管理端 Web 前端（Vue + Vite） |
