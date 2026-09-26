<template>
  <view class="chat-container">
    <!-- 聊天内容区域 -->
    <scroll-view 
      class="chat-scroll" 
      scroll-y 
      :scroll-top="scrollTop"
      :scroll-into-view="scrollIntoView"
      @scrolltoupper="loadMoreMessages"
      @scroll="handleScroll"
      upper-threshold="50"
      v-if="currentUser"
      :id="'chat-scroll-view'"
      :scroll-with-animation="false"
      :enhanced="true"
      :show-scrollbar="false"
      enable-back-to-top
    >
      <!-- 加载更多提示 -->
      <view class="loading-more" v-if="hasMoreMessages">
        <text class="loading-text">{{ isLoadingMore ? '加载中...' : '加载更多...' }}</text>
      </view>
      
      <!-- 消息列表：定位完成前保持隐藏，避免"先渲染顶部再跳到底部"的抖动 -->
      <view class="message-list" :style="{ visibility: listVisible ? 'visible' : 'hidden' }">
        <!-- :key 使用每条消息创建时补齐的稳定唯一 _key（见 ensureMessageKey），
             历史消息头插（unshift）时避免 index 复用节点导致发送中/失败/已读状态串位（M11） -->
        <block v-for="(item, index) in messages" :key="item._key">
          <!-- 显示时间，如果是第一条消息或者与上一条消息时间间隔超过5分钟 -->
          <view class="time-divider" v-if="index === 0 || shouldShowTime(item, messages[index-1])">
            <text class="time-text">{{ formatTimeForDivider(item.timestamp) }}</text>
          </view>
          
            <!-- 消息项：失败消息可点击重发（retryMessage 内部按 send_failed 守卫，其余点击无效） -->
            <view
              class="message-item"
              :class="{ 'message-self': isSelfMessage(item) }"
              :id="'msg-' + item.id"
              @tap="retryMessage(item)"
            >
              <image
                class="message-avatar"
                :src="getAvatarUrl(item)"
                mode="aspectFill"
              ></image>
              <view class="message-content-wrapper">
                <view class="message-bubble">
                  <text class="message-content">{{ item.message }}</text>
                </view>
                <!-- 发送状态：仅自己发送的消息显示（发送中/发送失败/已读/未读） -->
                <text class="message-status" :class="{ 'message-status-failed': item.send_failed }" v-if="isSelfMessage(item)">
                  {{ item.is_sending ? '发送中...' : (item.send_failed ? '发送失败，点击重发' : (item.is_read ? '已读' : '未读')) }}
                </text>
              </view>
            </view>
        </block>
      </view>
      
      <!-- 底部填充区域，防止消息被输入框遮挡 -->
      <view class="bottom-padding"></view>
    </scroll-view>
    
    <!-- 未登录提示 -->
    <view class="login-tip" v-if="!currentUser">
      <text>请先登录后再进行聊天</text>
      <button class="login-btn" @tap="goToLogin">去登录</button>
    </view>
    
    <!-- 输入框区域 -->
    <view class="input-area" v-if="currentUser">
      <input 
        class="message-input" 
        type="text" 
        v-model="inputMessage" 
        placeholder="请输入消息" 
        confirm-type="send"
        @confirm="sendMessage"
        cursor-spacing="10"
      />
      <button class="send-btn" @tap="sendMessage">发送</button>
    </view>
    
    <!-- 底部安全区域 -->
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script>

import { mapState, mapGetters, mapMutations } from 'vuex';
import { checkLogin, goToLogin, formatDate, updateMessageBadge } from '../../utils/common';
import socketIOService from '@/utils/socketio.js'; // 引入Socket.IO服务

// 会话阅读位置存储（微信行为：重新进入会话回到上次阅读位置，首次进入落在底部）
const POSITION_STORAGE_KEY = 'chat_read_position_v1';
// 恢复锚点时最多向前翻页的页数，防止极老锚点导致进入会话时长时间连续请求
const RESTORE_PAGE_LIMIT = 5;

// 消息唯一 key 生成器：本地临时消息与后端回发 temp_id 对齐共用此格式（M14），
// 加随机段避免同一毫秒内两条消息（重发场景）撞 key
const generateTempId = () => 'temp-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

export default {
  data() {
    return {
      targetUserId: null, // 聊天对象ID
      targetUser: null, // 聊天对象信息
      targetUserStatus: 'offline', // 聊天对象在线状态
      messages: [], // 消息列表
      inputMessage: '', // 输入框内容
      offset: 0, // 分页偏移量
      limit: 20, // 每页消息数量
      hasMoreMessages: false, // 是否有更多历史消息
      scrollTop: 0, // 滚动位置
      scrollIntoView: '', // 滚动到指定元素
      loginChecking: false, // 是否正在检查登录状态
      defaultAvatarUrl: '/static/default-avatar.png', // 默认头像
      isActiveChat: false, // 当前页面是否活跃
      listVisible: false, // 消息列表是否可见（完成一次性定位后才显示，消除跳动）
      atBottom: true, // 是否停留在消息底部（仅贴底时新消息才自动滚动，微信行为）
      isLoadingMore: false // 是否正在加载更多消息
    };
  },
  
  computed: {
    ...mapState({
      currentUser: state => state.userInfo // 当前登录用户信息
    })
  },
  
  onLoad(options) {
    // 获取目标用户ID
    if (options.user_id) {
      this.targetUserId = options.user_id;
      
      // 设置当前活跃聊天对象到socketio服务
      socketIOService.setCurrentChatTarget(this.targetUserId);
    } else {
      uni.showToast({
        title: '聊天对象不存在',
        icon: 'none'
      });
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
      return;
    }
    
    // 设置为活跃聊天界面
    this.isActiveChat = true;
    
    // 首次 onShow 跳过刷新：初始定位由 onLoad 的 loadChatHistory 一次性完成，
    // 二次滚动正是进入时抖动的来源
    this._firstShow = true;
    
    // 检查登录状态并初始化
    this.checkLoginAndInitialize();
  },
  
  onUnload() {
    // 离开前记录阅读位置，下次进入该会话原位恢复（微信行为）
    this.captureAndSavePosition();
    
    // 标记为非活跃状态
    this.isActiveChat = false;
    
    // 通知socketio服务页面已非活跃
    socketIOService.setActiveChatStatus(false);
    
    // 离开当前聊天房间（按私聊房间名 chat:a-b 正确退出）
    if (this.targetUserId) {
      socketIOService.leaveChatTargetRoom(this.targetUserId);
    }

    // 清理WebSocket
    this.cleanupWebSocket();

    // 停止 HTTP 轮询兜底（仅小程序端会启动轮询；H5 端此调用为空操作）
    this.stopPollingTimer();
  },

  /**
   * 小程序端轮询兜底定时器：Socket 推送降级后，页面活跃期间每 15 秒拉一次新消息。
   * 注意：方法体无条件保留——H5 端的启动调用（onShow 内）被 #ifdef 剥离，
   * 此处若也用 #ifdef 剥离会导致 onHide/onUnload 引用 undefined 报错
   */
  startPollingTimer() {
    // 防重入：先清旧定时器再起新的
    this.stopPollingTimer();
    this._pollTimerId = setInterval(() => {
      // 页面已隐藏/销毁时自清理，避免空转
      if (!this.isActiveChat) {
        this.stopPollingTimer();
        return;
      }
      this.refreshMessages();
    }, 15000);
  },

  stopPollingTimer() {
    if (this._pollTimerId) {
      clearInterval(this._pollTimerId);
      this._pollTimerId = null;
    }
  },

  onHide() {
    // 页面隐藏同样记录阅读位置
    this.captureAndSavePosition();

    // 标记为非活跃状态
    this.isActiveChat = false;

    // 通知socketio服务页面已非活跃
    socketIOService.setActiveChatStatus(false);

    // 页面隐藏时也离开聊天房间，防止后台接收消息
    if (this.targetUserId) {
      socketIOService.leaveChatTargetRoom(this.targetUserId);
    }

    // 清理WebSocket
    this.cleanupWebSocket();

    // 停止 HTTP 轮询兜底（仅小程序端会启动轮询；H5 端此调用为空操作）
    this.stopPollingTimer();
  },

  onShow() {
    // 标记为活跃状态
    this.isActiveChat = true;
    
    // 确保socketio服务知道当前聊天对象
    if (this.targetUserId) {
      socketIOService.setCurrentChatTarget(this.targetUserId, this.targetUser);
    }
    
    // 通知socketio服务页面已活跃
    socketIOService.setActiveChatStatus(true);
    
    // 如果用户已登录
    if (this.currentUser && this.currentUser.id) {
      // 首次进入不刷新：loadChatHistory 正在加载并定位，重复刷新会导致二次滚动抖动；
      // 从其它页面返回时（非首次）才增量拉取新消息
      if (this._firstShow) {
        this._firstShow = false;
      } else {
        this.refreshMessages();
      }

      // 初始化WebSocket
      this.initWebSocket();

      // #ifdef MP-WEIXIN
      // 小程序端 Socket 推送不可用（见 socketio.js 降级说明），
      // 停留本页期间用轻量 HTTP 轮询补偿接收新消息（H5 端不轮询，靠 Socket 推送）
      this.startPollingTimer();
      // #endif
    } else {
      this._firstShow = false;
      // 如果用户未登录，尝试获取用户信息
      this.checkLoginAndInitialize();
    }
    // 添加确保加入正确房间的逻辑
    if (this.currentUser && this.targetUserId) {
      // 传入目标用户ID，房间名由 socketio 服务内部生成
      // （此前误传 "chat:a-b" 房间名，导致生成 room:null 的畸形加房请求）
      socketIOService.joinChatTargetRoom(this.targetUserId)
        .then(() => {

        })
        .catch(error => {

        });
    }
  },
  
  methods: {
    // 检查登录状态并初始化
    async checkLoginAndInitialize() {
      // 避免重复检查
      if (this.loginChecking) return;
      this.loginChecking = true;
      
      try {
        // 检查本地存储中的token
        const token = uni.getStorageSync('token');
        if (!token) {
          this.showLoginTip();
          this.loginChecking = false;
          return;
        }
        
        // 如果Vuex中已有用户信息，则直接使用
        if (this.currentUser && this.currentUser.id) {
          this.initializeChat();
        } else {
          // 尝试从Store中获取用户信息
          try {
            await this.$store.dispatch('getUserInfo');
            
            // 再次检查用户信息
            if (this.currentUser && this.currentUser.id) {
              this.initializeChat();
            } else {
              this.showLoginTip();
            }
          } catch (userError) {
            this.showLoginTip();
          }
        }
      } catch (error) {
        this.showLoginTip();
      } finally {
        this.loginChecking = false;
      }
    },
    
    // 初始化聊天功能
    initializeChat() {
      // 获取聊天对象信息
      this.getTargetUserInfo();
      
      // 加载聊天记录
      this.loadChatHistory();
      
      // 只有在活跃状态下才连接WebSocket
      if (this.isActiveChat) {
        this.initWebSocket();
      }
    },
    
    // 显示登录提示
    showLoginTip() {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      });
    },
    
    // 加载聊天历史记录，并在"渲染完成→一次性定位→再显示"后揭示列表。
    // 微信行为：上次贴底则落到底部；上次停在历史中间则回到同一锚点消息顶部。
    async loadChatHistory() {
      uni.showLoading({
        title: '加载中...'
      });
      
      try {
        // 进入会话即把对方发来的全部未读一次性标为已读（含最近一页之外的历史未读）。
        // 修复：原先只逐条标记已加载的最近 20 条，旧未读永远清不掉，
        // 从聊天列表点进会话查看后退出，红点依然存在。
        // 失败不阻断加载流程，后续逐条 markNewMessagesAsRead 仍会兜底。
        try {
          await this.$api.message.markConversationAsRead(this.targetUserId);
          // 进入会话已把后端未读清零，tabBar 角标同步清零，避免返回后角标与实际未读不一致
          updateMessageBadge(0);
        } catch (markError) {
          // 批量已读失败时静默，走原有逐条标记逻辑
        }
        
        const saved = this.getSavedPosition();
        const needAnchor = !!(saved && !saved.atBottom && saved.anchorId);
        
        // 需要恢复锚点时，向后翻页直到锚点消息进入列表（有页数上限兜底）
        let allMessages = [];
        let offset = 0;
        let hasMore = true;
        let anchorFound = false;
        while (hasMore) {
          const res = await this.$api.message.getChatHistory(this.targetUserId, {
            offset,
            limit: this.limit
          });
          const page = (res && Array.isArray(res.messages)) ? res.messages : [];
          allMessages = allMessages.concat(page);
          hasMore = page.length >= this.limit;
          offset += this.limit;
          if (!needAnchor) break;
          anchorFound = allMessages.some(m => String(m.id) === String(saved.anchorId));
          if (anchorFound || allMessages.length >= RESTORE_PAGE_LIMIT * this.limit) break;
        }
        
        // 设置消息列表（按时间升序）
        this.messages = allMessages
          // 为每条历史消息补齐渲染用唯一 key（后端消息无此字段），头插翻页时 :key 才稳定
          .map(m => this.ensureMessageKey(m))
          .sort((a, b) => {
            return this.parseTime(a.timestamp) - this.parseTime(b.timestamp);
          });
        
        // 设置是否有更多消息；loadMoreMessages 会先 offset += limit 再请求，这里回退一页
        this.hasMoreMessages = hasMore;
        this.offset = Math.max(0, offset - this.limit);
        
        // 标记收到的消息为已读（批量接口失败时的逐条兜底）
        this.markNewMessagesAsRead();
        
        // 一次性定位：列表先保持隐藏，滚动落位后再揭示，杜绝"顶部→底部"反复跳动
        await this.$nextTick();
        if (needAnchor && anchorFound) {
          // 先清空再赋值，保证与上次恢复同一锚点时 watch 仍能触发
          this.scrollIntoView = '';
          await this.$nextTick();
          this.scrollIntoView = 'msg-' + saved.anchorId;
          this.atBottom = false;
        } else {
          this.scrollToBottom();
        }
        await this.$nextTick();
        this.measureViewport();
        this.listVisible = true;
        
        uni.hideLoading();
      } catch (error) {
        uni.hideLoading();
        uni.showToast({
          title: '加载失败，请稍后再试',
          icon: 'none'
        });
      }
    },
    
    // 初始化WebSocket连接
    initWebSocket() {
      try {
        // 检查用户是否已登录
        if (!this.currentUser || !this.currentUser.id) {
          return;
        }
        
        // 设置当前页面为活跃状态
        this.isActiveChat = true;
        socketIOService.setActiveChatStatus(true);
        
        // 添加消息监听
        socketIOService.addMessageListener(this.handleReceiveMessage);
        
        // 添加消息已读状态监听
        socketIOService.addMessageReadListener(this.handleMessageRead);
        
        // 添加用户状态变化监听
        socketIOService.addUserStatusListener(this.handleUserStatusChange);
        
        // 初始化Socket.IO连接
        socketIOService.initSocket();
        
        // 如果有目标用户，加入私聊房间
        if (this.targetUserId) {
          // 等待Socket连接完成后再加入房间
          this._joinRoomIntervalId = setInterval(() => {
            if (socketIOService.connected) {
              clearInterval(this._joinRoomIntervalId);
              this._joinRoomIntervalId = null;

              // 使用Promise方式加入房间
              socketIOService.joinChatTargetRoom(this.targetUserId)
                .then(result => {
                  // 更新通知用户在线状态
                  socketIOService.notifyUserOnline(this.targetUserId);
                })
                .catch(error => {
                  // 处理错误
                });
            }
          }, 500); // 每500ms检查一次连接状态

          // 设置超时，避免无限等待
          this._joinRoomTimeoutId = setTimeout(() => {
            if (this._joinRoomIntervalId) {
              clearInterval(this._joinRoomIntervalId);
              this._joinRoomIntervalId = null;
            }
            this._joinRoomTimeoutId = null;
          }, 10000); // 10秒超时
        }
      } catch (error) {
        // 处理错误
      }
    },
    
    // 清理WebSocket连接
    cleanupWebSocket() {
      // 设置当前页面为非活跃状态
      this.isActiveChat = false;
      socketIOService.setActiveChatStatus(false);

      // 移除消息监听
      socketIOService.removeMessageListener(this.handleReceiveMessage);

      // 移除消息已读状态监听
      socketIOService.removeMessageReadListener(this.handleMessageRead);

      // 移除用户状态变化监听
      socketIOService.removeUserStatusListener(this.handleUserStatusChange);

      // 清除等待连接的加房轮询定时器，避免页面销毁后回调复活房间
      if (this._joinRoomIntervalId) {
        clearInterval(this._joinRoomIntervalId);
        this._joinRoomIntervalId = null;
      }
      if (this._joinRoomTimeoutId) {
        clearTimeout(this._joinRoomTimeoutId);
        this._joinRoomTimeoutId = null;
      }

      // 清空socketio服务中的当前聊天对象
      socketIOService.clearCurrentChatTarget();

    },
    
    // 处理接收到的消息
    handleReceiveMessage(data) {
      // 主动隐藏任何可能的toast通知
      if (uni && uni.hideToast) {
        uni.hideToast();
      }

      // 如果消息不包含必要字段，则忽略
      if (!data || !data.id || !data.sender_id || !data.receiver_id) {
        return;
      }

      // 检查是否是当前聊天的消息：发送/接收双方必须恰好是 {当前用户, 聊天对象}
      // （修复：原判断前两个条件重复，且缺少"接收方是自己"的校验）
      const sid = data.sender_id !== undefined && data.sender_id !== null ? data.sender_id.toString() : '';
      const rid = data.receiver_id !== undefined && data.receiver_id !== null ? data.receiver_id.toString() : '';
      const tid = this.targetUserId !== undefined && this.targetUserId !== null ? this.targetUserId.toString() : '';
      const mid = this.currentUser && this.currentUser.id !== undefined && this.currentUser.id !== null
        ? this.currentUser.id.toString() : '';
      const isCurrentChat = !!(tid && mid && ((sid === tid && rid === mid) || (sid === mid && rid === tid)));

      // 不是当前会话的消息直接忽略，绝不能插入当前聊天界面
      if (!isCurrentChat) {
        this.updateUnreadCountForUser(data.sender_id);
        return;
      }

      // 检查消息是否已经存在于列表中
      const messageExists = this.messages.some(m => {
        // 检查固定ID的消息（ID可能是数字或字符串，统一按字符串比较）
        if (m.id !== undefined && m.id !== null && data.id !== undefined && data.id !== null &&
            m.id.toString() === data.id.toString()) return true;

        // 检查临时ID消息是否与接收到的消息匹配
        // 当本地有一个临时ID的消息，且发送者和接收者与服务器消息一致，且内容一致
        if (m.id && m.id.toString().startsWith('temp-') &&
            m.sender_id.toString() === data.sender_id.toString() &&
            m.receiver_id.toString() === data.receiver_id.toString() &&
            m.message === data.message) {

          // 更新临时消息为服务器返回的消息ID
          m.id = data.id;

          // 移除发送中状态
          m.is_sending = false;
          m.send_failed = false;

          return true;
        }

        return false;
      });

      if (!messageExists) {
        // 添加到消息列表（补齐渲染用唯一 key，保持 :key 稳定）
        this.messages.push(this.ensureMessageKey(data));

        // 如果不是自己发的，则标记为已读
        if (this.currentUser && sid !== mid) {
          this.markMessageAsRead(data.id, data.sender_id);
        }

        // 仅贴底或自己刚发的消息才滚动到底部；
        // 用户上翻阅读历史时新消息到达不打断（微信行为）
        if (this.atBottom || sid === mid) {
          this.scrollToBottom();
        }
      }
    },
    
    // 处理消息已读通知
    handleMessageRead(data) {
      if (!data || !data.message_id) {
        return;
      }
      
      // 更新消息列表中的已读状态
      const messageIndex = this.messages.findIndex(m => m.id === data.message_id);
      if (messageIndex !== -1) {
        // 更新已读状态
        this.messages[messageIndex].is_read = true;
        
        // 如果有read_at时间，也一并更新
        if (data.read_at) {
          this.messages[messageIndex].read_at = data.read_at;
        }
      }
    },
    
    // 发送消息
    async sendMessage() {
      if (!this.inputMessage.trim()) {
        return;
      }
      
      // 检查用户是否登录
      if (!this.currentUser || !this.currentUser.id) {
        return;
      }
      
      // 取得聊天对象ID
      const receiverId = this.targetUserId;
      
      if (!receiverId) {
        return;
      }
      
      // 创建本地消息对象
      const messageText = this.inputMessage.trim();
      // 临时ID与 socketio.js 的 message_sent 回执 temp_id 共用同一生成器（M14），
      // 回执到达时按 temp_id 精确匹配本条消息
      const tempId = generateTempId();

      const tempMessage = {
        id: tempId,
        sender_id: this.currentUser.id,
        receiver_id: receiverId,
        message: messageText,
        timestamp: new Date().toISOString(),
        is_read: false,
        is_sending: true, // 标记为正在发送
        send_failed: false // 是否发送失败
      };
      
      // 添加到本地消息列表
      this.messages.push(this.ensureMessageKey(tempMessage));
      
      // 清空输入框
      this.inputMessage = '';
      
      // 发送自己的消息时总是滚动到底部
      this.scrollToBottom();
      
      try {
        // 使用Socket.IO发送消息；tempId 一并传给 socket 层，
        // 供 message_sent 回执按 temp_id 精确匹配这条"发送中"的消息
        const socketSuccess = socketIOService.sendMessage(receiverId, messageText, tempId, {
          // Socket 层超时（10 秒未收回执）/断线清队列时回调：把气泡从"发送中"置为"发送失败"，供用户点击重发
          onFailed: () => this.markMessageSendFailed(tempId)
        });

        // 如果Socket.IO连接不可用，则使用HTTP API发送
        // （修复：$api 顶层不存在 sendMessage，正确入口是 $api.message.sendMessage）
        if (!socketSuccess) {
          const response = await this.$api.message.sendMessage({
            receiver_id: receiverId,
            message: messageText
          });

          if (response.success) {
            // 更新临时消息ID为服务器返回的ID
            const index = this.messages.findIndex(m => m.id === tempId);
            if (index !== -1) {
              this.messages[index].id = response.message_id;
              this.messages[index].is_sending = false; // 发送完成
            }
          } else {
            // 标记为发送失败
            this.markMessageSendFailed(tempId);
          }
        }
      } catch (error) {
        // 标记为发送失败
        this.markMessageSendFailed(tempId);
      }
    },

    // 把指定临时ID的消息置为"发送失败"状态（供发送异常路径与 Socket 发送超时回调共用）
    markMessageSendFailed(tempId) {
      const index = this.messages.findIndex(m => m.id === tempId);
      if (index !== -1) {
        this.messages[index].is_sending = false;
        this.messages[index].send_failed = true;
      }
    },

    // 点击"发送失败"的气泡重发该消息：仅 send_failed 状态响应，其余点击无效。
    // 重发复用原气泡：状态先复位为"发送中"，成功后由房间回显/message_sent 回执按 id 归位
    async retryMessage(item) {
      if (!item || !item.send_failed) return;

      // 双重防线：输入校验与登录校验失败时保持失败态，用户可再次点击
      const receiverId = item.receiver_id;
      if (!this.currentUser || !this.currentUser.id || !receiverId || !item.message) {
        return;
      }

      const tempId = item.id;

      // 复位为发送中
      item.is_sending = true;
      item.send_failed = false;

      try {
        const socketSuccess = socketIOService.sendMessage(receiverId, item.message, tempId, {
          // Socket 层超时/断线清队列时回调：重发气泡从"发送中"回到"发送失败"状态，可再次点击重发
          onFailed: () => this.markMessageSendFailed(tempId)
        });

        if (!socketSuccess) {
          const response = await this.$api.message.sendMessage({
            receiver_id: receiverId,
            message: item.message
          });

          if (response.success) {
            const index = this.messages.findIndex(m => m.id === tempId);
            if (index !== -1) {
              this.messages[index].id = response.message_id;
              this.messages[index].is_sending = false;
            }
          } else {
            this.markMessageSendFailed(tempId);
          }
        }
      } catch (error) {
        this.markMessageSendFailed(tempId);
      }
    },
    
    // 刷新消息列表 - 仅刷新一次，不使用轮询
    async refreshMessages() {
      if (!this.currentUser || !this.targetUserId) return;
      
      try {
        // 调用API获取最新消息
        const res = await this.$api.message.getChatHistory(this.targetUserId, {
          offset: 0,
          limit: 20
        });
        
        if (!res || !res.messages || res.messages.length === 0) return;
        
        // 获取当前消息ID集合用于去重
        const existingMessageIds = new Set(this.messages.map(m => {
          // 将临时ID的消息排除在外，因为它们将被服务器消息替换
          if (m.id && typeof m.id === 'string' && m.id.startsWith('temp-')) {
            return null;
          }
          return m.id;
        }).filter(id => id !== null));
        
        // 过滤出新消息
        const newMessages = res.messages.filter(m => !existingMessageIds.has(m.id));
        
        // 处理临时消息的替换
        newMessages.forEach(newMsg => {
          // 查找匹配的临时消息
          const tempMsgIndex = this.messages.findIndex(m => 
            m.id && typeof m.id === 'string' && m.id.startsWith('temp-') &&
            m.sender_id.toString() === newMsg.sender_id.toString() &&
            m.receiver_id.toString() === newMsg.receiver_id.toString() &&
            m.message === newMsg.message
          );
          
          if (tempMsgIndex !== -1) {
            // 找到匹配的临时消息，进行替换
            this.messages.splice(tempMsgIndex, 1);
          }
        });
        
        if (newMessages.length > 0) {
          // 为新消息添加发送者头像
          newMessages.forEach(msg => {
            if (msg.sender_id.toString() === this.targetUserId.toString() && this.targetUser && this.targetUser.avatar_url) {
              msg.sender_avatar_url = this.targetUser.avatar_url;
            }
          });

          // 合并消息并按时间排序（新消息补齐唯一 key，保持 :key 稳定）
          this.messages = [...this.messages, ...newMessages.map(m => this.ensureMessageKey(m))].sort((a, b) => {
            return this.parseTime(a.timestamp) - this.parseTime(b.timestamp);
          });
          
          // 标记收到的消息为已读
          newMessages.forEach(msg => {
            if (msg.sender_id.toString() === this.targetUserId.toString() && !msg.is_read) {
              this.markMessageAsRead(msg.id, msg.sender_id);
            }
          });
          
          // 仅贴底时跟随新消息滚动，阅读历史中不打断（微信行为）
          if (this.atBottom) {
            this.scrollToBottom();
          }
        }
      } catch (error) {
        // 处理错误
      }
    },
    
    // 加载更多消息（历史记录）
    async loadMoreMessages() {
      if (!this.hasMoreMessages || this.isLoadingMore) return;
      
      this.isLoadingMore = true; // 标记正在加载更多
      
      try {
        // 更新偏移量
        this.offset += this.limit;
        
        // 调用API获取更多聊天记录
        const res = await this.$api.message.getChatHistory(this.targetUserId, {
          offset: this.offset,
          limit: this.limit
        });
        
        if (res && res.messages && res.messages.length > 0) {
          // 记录当前第一条消息ID，用于加载后保持位置
          const firstMsgId = this.messages.length > 0 ? this.messages[0].id : null;

          // 按ID去重后合并（offset 分页期间若有新消息到达，页边界可能重复）；
          // 头插的历史消息同样补齐唯一 key，避免 :key=index 时节点复用串状态
          const existingIds = new Set(this.messages.map(m => String(m.id)));
          const olderMessages = res.messages.filter(m => !existingIds.has(String(m.id))).map(m => this.ensureMessageKey(m));

          // 合并消息并排序
          this.messages = [...olderMessages, ...this.messages].sort((a, b) => {
            return this.parseTime(a.timestamp) - this.parseTime(b.timestamp);
          });
        
          // 设置是否有更多消息
          this.hasMoreMessages = res.messages.length >= this.limit;
          
          // 在消息渲染后滚动到之前的位置：
          // 先清空再赋值，保证连续两次加载都以同一消息为锚点时 watch 仍会触发
          if (firstMsgId) {
            this.$nextTick(() => {
              this.scrollIntoView = '';
              this.$nextTick(() => {
                this.scrollIntoView = `msg-${firstMsgId}`;
              });
            });
          }
        } else {
          this.hasMoreMessages = false;
        }
        
        this.isLoadingMore = false; // 重置加载状态
      } catch (error) {
        // 加载失败回滚偏移量，下次触底重新请求同一页，避免跳页丢消息
        this.offset = Math.max(0, this.offset - this.limit);
        this.isLoadingMore = false; // 重置加载状态
      }
    },
    
    // 滚动到底部：单步同步定位。
    // 绑定值交替递增，确保每次都触发 watch；不再用重试定时器（抖动根源）
    scrollToBottom() {
      if (this.messages.length === 0) return;
      this.atBottom = true;
      this._scrollToken = (this._scrollToken || 0) + 1;
      this.scrollIntoView = '';
      this.scrollTop = 999999 + this._scrollToken;
    },
    
    // scroll-view 滚动事件：维护"是否贴底"状态，决定新消息是否自动跟随
    handleScroll(e) {
      const detail = e && e.detail;
      if (!detail || !this._clientHeight) return;
      this.atBottom = detail.scrollHeight - detail.scrollTop - this._clientHeight < 40;
    },
    
    // 记录滚动容器可视高度（用于贴底判定）
    measureViewport() {
      uni.createSelectorQuery().in(this).select('#chat-scroll-view').boundingClientRect(rect => {
        if (rect && rect.height) {
          this._clientHeight = rect.height;
        }
      }).exec();
    },
    
    // 为消息补齐渲染用唯一 key（_key）：服务端消息无此字段，进入本列表的每条消息
    // 都必须经过这里，保证 v-for 的 :key 在历史消息头插时依然稳定（M11）
    ensureMessageKey(message) {
      if (!message) return message;
      if (!message._key) {
        // 优先复用已有临时ID（发送中的本地消息 id 即 temp-xxx），
        // 服务端消息用其数据库 id，二者均不可能与其他消息重复
        message._key = (message.id !== undefined && message.id !== null)
          ? 'k-' + String(message.id)
          : generateTempId();
      }
      return message;
    },

    // 会话唯一键：chat:小ID-大ID（与后端房间名规则一致）
    roomKey() {
      const me = this.currentUser && this.currentUser.id;
      if (!me || !this.targetUserId) return null;
      const ids = [Number(me), Number(this.targetUserId)].sort((a, b) => a - b);
      if (isNaN(ids[0]) || isNaN(ids[1])) return null;
      return `chat:${ids[0]}-${ids[1]}`;
    },
    
    // 读取该会话上次记录的阅读位置 { atBottom, anchorId }
    getSavedPosition() {
      try {
        const room = this.roomKey();
        if (!room) return null;
        const map = JSON.parse(uni.getStorageSync(POSITION_STORAGE_KEY) || '{}');
        return map[room] || null;
      } catch (e) {
        return null;
      }
    },
    
    // 保存阅读位置（仅保留最近 50 个会话，防止存储无限膨胀）
    savePosition(position) {
      try {
        const room = this.roomKey();
        if (!room) return;
        const map = JSON.parse(uni.getStorageSync(POSITION_STORAGE_KEY) || '{}');
        map[room] = Object.assign({ ts: Date.now() }, position);
        const keys = Object.keys(map);
        if (keys.length > 50) {
          keys.sort((a, b) => (map[a].ts || 0) - (map[b].ts || 0))
            .slice(0, keys.length - 50)
            .forEach(k => delete map[k]);
        }
        uni.setStorageSync(POSITION_STORAGE_KEY, JSON.stringify(map));
      } catch (e) {
        // 存储失败不影响聊天功能
      }
    },
    
    // 离开会话时记录阅读位置：贴底存标记；停在历史中则记录视口顶部第一条消息为锚点
    captureAndSavePosition() {
      if (!this.listVisible || !this.messages.length) return;
      if (this.atBottom) {
        this.savePosition({ atBottom: true });
        return;
      }
      const query = uni.createSelectorQuery().in(this);
      query.select('#chat-scroll-view').boundingClientRect();
      query.selectAll('.message-item').boundingClientRect();
      query.exec(res => {
        try {
          const container = res[0];
          const rects = res[1];
          if (!container || !Array.isArray(rects) || rects.length === 0) {
            this.savePosition({ atBottom: true });
            return;
          }
          // DOM 顺序与 messages 升序一致，取视口下边缘可见的第一条为锚点
          const topEdge = container.top + 2;
          let idx = rects.findIndex(r => r && r.bottom > topEdge);
          if (idx === -1) idx = 0;
          const anchor = this.messages[idx];
          if (anchor && anchor.id !== undefined && anchor.id !== null &&
              String(anchor.id).indexOf('temp-') !== 0) {
            this.savePosition({ atBottom: false, anchorId: anchor.id });
          }
        } catch (e) {
          // 定位查询异常时放弃本次记录
        }
      });
    },
    
    // 格式化时间显示
    formatTime(timestamp) {
      if (!timestamp) return '';

      try {
        const messageDate = new Date(this.parseTime(timestamp));
        const now = new Date();
        
        // 今天
        if (messageDate.toDateString() === now.toDateString()) {
          return formatDate(timestamp, 'HH:mm');
        }
        
        // 昨天
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (messageDate.toDateString() === yesterday.toDateString()) {
          return '昨天 ' + formatDate(timestamp, 'HH:mm');
        }
        
        // 本周内
        const daysDiff = Math.floor((now - messageDate) / (24 * 60 * 60 * 1000));
        if (daysDiff < 7) {
          const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          return weekdays[messageDate.getDay()] + ' ' + formatDate(timestamp, 'HH:mm');
        }
        
        // 今年内
        if (messageDate.getFullYear() === now.getFullYear()) {
          return formatDate(timestamp, 'MM-DD HH:mm');
        }
        
        // 更早
        return formatDate(timestamp, 'YYYY-MM-DD HH:mm');
      } catch (error) {
        return timestamp;
      }
    },
    
    // 跳转到登录页面
    goToLogin() {
      uni.navigateTo({
        url: '/pages/login/login'
      });
    },
    
    // 判断消息是否是当前用户发送的（统一转字符串比较，避免 number/string 类型不一致）
    isSelfMessage(item) {
      if (!item || item.sender_id === undefined || item.sender_id === null) return false;
      if (!this.currentUser || this.currentUser.id === undefined || this.currentUser.id === null) return false;
      return item.sender_id.toString() === this.currentUser.id.toString();
    },

    // 解析时间戳为毫秒数
    // 兼容 "YYYY-MM-DD HH:mm:ss"（iOS JSCore 的 new Date 无法解析该格式，会得到 Invalid Date）
    parseTime(ts) {
      if (ts instanceof Date) return ts.getTime();
      if (typeof ts === 'number') return ts;
      if (typeof ts === 'string' && ts.length) {
        const normalized = (ts.indexOf('T') === -1 && ts.indexOf('Z') === -1) ? ts.replace(' ', 'T') : ts;
        const t = new Date(normalized).getTime();
        return isNaN(t) ? 0 : t;
      }
      return 0;
    },

    // 获取头像URL的方法
    getAvatarUrl(item) {
      // 如果是当前用户发送的消息
      if (this.isSelfMessage(item)) {
        return this.currentUser.avatar_url || this.defaultAvatarUrl;
      }
      
      // 如果是对方发送的消息
      // 尝试从消息数据中获取发送者头像
      if (item.sender && item.sender.avatar_url) {
        return item.sender.avatar_url;
      }
      
      // 从targetUser获取头像
      if (this.targetUser && this.targetUser.avatar_url) {
        return this.targetUser.avatar_url;
      }
      
      // 如果消息包含发送者信息
      if (item.sender_avatar_url) {
        return item.sender_avatar_url;
      }
      
      // 默认头像
      return this.defaultAvatarUrl;
    },
    
    // 获取聊天对象信息
    async getTargetUserInfo() {
      if (!this.targetUserId || !this.currentUser) {
        return;
      }
      
      try {
        // 从聊天联系人中查找目标用户
        const contactsRes = await this.$api.message.getChatContacts();
        
        if (contactsRes && Array.isArray(contactsRes)) {
          const targetContact = contactsRes.find(contact => 
            contact.id.toString() === this.targetUserId.toString() || 
            contact.user_id?.toString() === this.targetUserId.toString()
          );
          
          if (targetContact) {
            this.targetUser = targetContact;
            
            // 设置页面标题
            uni.setNavigationBarTitle({
              title: targetContact.name || targetContact.username || '聊天'
            });
            
            // 更新现有消息中的对方头像
            this.updateExistingMessagesWithAvatar();
            
            // 更新socketio服务中的聊天对象信息
            socketIOService.setCurrentChatTarget(this.targetUserId, this.targetUser);
          } else {
            await this.fetchUserInfoById(this.targetUserId);
          }
        }
      } catch (error) {
        // 尝试使用备用方式查找用户信息
        await this.fetchUserInfoById(this.targetUserId);
      }
    },
    
    // 通过ID获取用户信息（备用方案）
    async fetchUserInfoById(userId) {
      try {
        // 调用API获取用户信息
        const userInfo = await this.$api.user.getUserById(userId);
        
        if (userInfo && userInfo.id) {
          this.targetUser = {
            id: userInfo.id,
            name: userInfo.name || '用户' + userId,
            avatar_url: userInfo.avatar_url || this.defaultAvatarUrl
          };
          
          // 更新socketio服务中的聊天对象信息
          socketIOService.setCurrentChatTarget(userId, this.targetUser);
        } else {
          // 临时设置targetUser，避免头像显示为空
          if (!this.targetUser) {
            this.targetUser = {
              id: userId,
              name: '用户' + userId,
              avatar_url: this.defaultAvatarUrl
            };
            
            // 即使是默认信息，也更新socketio服务中的聊天对象信息
            socketIOService.setCurrentChatTarget(userId, this.targetUser);
          }
        }
        
        // 设置页面标题
        uni.setNavigationBarTitle({
          title: this.targetUser?.name || '聊天'
        });
        
        // 更新现有消息中的对方头像
        this.updateExistingMessagesWithAvatar();
      } catch (error) {
        // 错误处理，使用默认值
        if (!this.targetUser) {
          this.targetUser = {
            id: userId,
            name: '用户' + userId,
            avatar_url: this.defaultAvatarUrl
          };
          
          // 即使是默认信息，也更新socketio服务中的聊天对象信息
          socketIOService.setCurrentChatTarget(userId, this.targetUser);
          
          // 设置页面标题
          uni.setNavigationBarTitle({
            title: this.targetUser?.name || '聊天'
          });
        }
      }
    },
    
    // 更新现有消息中的对方头像
    updateExistingMessagesWithAvatar() {
      if (!this.targetUser || !this.targetUser.avatar_url || this.messages.length === 0) return;
      
      // 给现有的对方消息添加头像信息
      this.messages.forEach(msg => {
        if (msg.sender_id.toString() === this.targetUserId.toString() && !msg.sender_avatar_url) {
          // 添加发送者头像URL
          msg.sender_avatar_url = this.targetUser.avatar_url;
        }
      });
    },
    
    // 判断是否应该显示时间
    shouldShowTime(currentMsg, prevMsg) {
      if (!prevMsg) return true;

      // 如果时间差超过5分钟，显示时间
      return (this.parseTime(currentMsg.timestamp) - this.parseTime(prevMsg.timestamp)) > 5 * 60 * 1000;
    },
    
    // 格式化时间显示 - 仅用于时间分隔线
    formatTimeForDivider(time) {
      if (!time) return '';

      try {
        const messageDate = new Date(this.parseTime(time));
        const now = new Date();
        
        // 今天
        if (messageDate.toDateString() === now.toDateString()) {
          return formatDate(time, 'HH:mm');
        }
        
        // 昨天
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (messageDate.toDateString() === yesterday.toDateString()) {
          return '昨天 ' + formatDate(time, 'HH:mm');
        }
        
        // 本周内
        const daysDiff = Math.floor((now - messageDate) / (24 * 60 * 60 * 1000));
        if (daysDiff < 7) {
          const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
          return weekdays[messageDate.getDay()] + ' ' + formatDate(time, 'HH:mm');
        }
        
        // 今年内
        if (messageDate.getFullYear() === now.getFullYear()) {
          return formatDate(time, 'MM-DD HH:mm');
        }
        
        // 更早
        return formatDate(time, 'YYYY-MM-DD HH:mm');
      } catch (error) {
        return time;
      }
    },
    
    // 标记所有新消息为已读
    markNewMessagesAsRead() {
      if (!this.currentUser) return;
      
      // 找出所有未读的接收消息
      const unreadMessages = this.messages.filter(msg => 
        msg.sender_id.toString() === this.targetUserId.toString() && 
        msg.receiver_id.toString() === this.currentUser.id.toString() && 
        !msg.is_read
      );
      
      // 逐个标记为已读
      unreadMessages.forEach(msg => {
        this.markMessageAsRead(msg.id, msg.sender_id);
      });
    },
    
    // 标记消息为已读
    markMessageAsRead(messageId, senderId) {
      if (!messageId) {
        return;
      }
      
      if (!this.currentUser || !this.currentUser.id) {
        return;
      }
      
      if (!senderId) {
        // 尝试从消息列表中找到发送者ID
        const message = this.messages.find(m => m.id === messageId);
        if (message && message.sender_id) {
          senderId = message.sender_id;
        } else {
          return;
        }
      }
      
      // 检查确认消息是发给当前用户的
      const message = this.messages.find(m => m.id === messageId);
      if (message && message.receiver_id.toString() !== this.currentUser.id.toString()) {
        return;
      }
      
      // 如果消息已经标记为已读则跳过
      if (message && message.is_read) {
        return;
      }
      
      // 在消息列表中更新状态
      const index = this.messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        this.messages[index].is_read = true;
      }
      
      // 首先使用Socket.IO通知
      const notificationSent = socketIOService.sendMessageReadNotification({
        message_id: messageId,
        sender_id: senderId
      });
      
      if (!notificationSent) {
        // 如果Socket.IO通知失败，则使用HTTP API
        try {
          this.$api.message.markAsRead(messageId)
            .then(response => {
              // 处理响应
            })
            .catch(error => {
              // 处理错误
            });
        } catch (error) {
          // 处理错误
        }
      }
    },
    
    // 更新未读消息数量
    updateUnreadCountForUser(userId) {
      // 实现更新未读消息数量的逻辑
      // 移除显示收到新消息的通知
      /* 
      uni.showToast({
        title: '收到新消息',
        icon: 'none'
      });
      */
    },
    
    // 添加用户状态变化处理方法
    handleUserStatusChange(data) {
      if (!data || !data.user_id) {
        return;
      }
      
      // 检查是否是当前聊天对象的状态变化
      if (this.targetUserId && data.user_id.toString() === this.targetUserId.toString()) {
        // 更新状态
        this.targetUserStatus = data.status || 'offline';
        
        // 更新页面标题，添加在线状态
        if (this.targetUser) {
          const title = this.targetUser.name || this.targetUser.username || '聊天';
          const statusText = this.targetUserStatus === 'online' ? ' (在线)' : '';
          
          uni.setNavigationBarTitle({
            title: title + statusText
          });
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.chat-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $uni-bg-color-chat;
  box-sizing: border-box;
  position: relative;
  padding-bottom: 110rpx; /* 与固定输入栏高度一致 */
}

.chat-scroll {
  flex: 1;
  padding: 15rpx 20rpx; /* 减少上下padding */
  background-color: $uni-bg-color-chat;
  width: 100%;
  box-sizing: border-box;
  padding-bottom: 0; /* 将底部内边距从5rpx减少到0 */
  height: calc(100vh - 110rpx); /* 与输入栏高度一致 */
}

.loading-more {
  text-align: center;
  padding: 10rpx 0;
}

.loading-text {
  font-size: 24rpx;
  color: $uni-text-color-grey;
}

.message-list {
  width: 100%;
  box-sizing: border-box;
}

/* 底部填充区域，防止消息被输入框遮挡 */
.bottom-padding {
  height: 30rpx; /* 将底部填充高度从90rpx减少到30rpx */
  width: 100%;
}

/* 时间分隔线 */
.time-divider {
  text-align: center;
  margin: 20rpx 0; /* 减少时间分隔线的上下margin */
}

.time-text {
  display: inline-block;
  padding: 6rpx 18rpx;
  font-size: 22rpx;
  color: $uni-text-color-grey;
  background-color: rgba(255, 255, 255, 0.75);
  border-radius: $uni-radius-sm;
}

.message-item {
  display: flex;
  margin-bottom: 16rpx; /* 稍微减少消息项之间的间距 */
  position: relative;
  width: 100%;
  align-items: flex-start;
  box-sizing: border-box;
}

.message-self {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: $uni-border-color-input;
  flex-shrink: 0;
  margin: 0 15rpx;
}

.message-content-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: calc(100% - 110rpx); /* 留出头像的空间 */
}

.message-self .message-content-wrapper {
  align-items: flex-end;
}

.message-bubble {
  max-width: 100%;
  padding: 18rpx 24rpx; /* 稍微减少气泡内部padding */
  border-radius: $uni-radius-md;
  margin: 0 5rpx;
  position: relative;
  background-color: $uni-bg-color;
  word-break: break-all;
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
}

.message-self .message-bubble {
  background-color: $uni-color-chat-self;
  border-radius: $uni-radius-md;
}

.message-content {
  font-size: 32rpx;
  color: $uni-text-color-chat;
  line-height: 1.4;
  word-break: break-word;
  white-space: pre-wrap;
}

.message-status {
  font-size: $uni-font-size-caption;
  color: $uni-text-color-grey;
  margin-top: 6rpx; /* 减少状态文本的上边距 */
  margin-right: 15rpx;
  line-height: 1;
}

/* 发送失败状态：红色提示文案，与整体气泡风格一致的轻量重发提示 */
.message-status-failed {
  color: $uni-color-error;
}

.input-area {
  height: 110rpx; /* 输入区域高度 */
  background-color: $uni-bg-color;
  display: flex;
  align-items: center;
  padding: 0 24rpx;
  border-top: 1rpx solid $uni-border-color-split;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  box-shadow: 0 -2rpx 10rpx rgba(31, 41, 55, 0.04);
}

.message-input {
  flex: 1;
  height: 72rpx;
  background-color: $uni-bg-color-section;
  border-radius: 36rpx;
  padding: 0 28rpx;
  font-size: $uni-font-size-md;
  border: none;
}

.send-btn {
  width: 120rpx;
  height: 72rpx;
  line-height: 72rpx;
  background-color: $uni-color-chat-send;
  color: $uni-text-color-inverse;
  border-radius: 36rpx;
  margin-left: 16rpx;
  font-size: $uni-font-size-base;
  font-weight: 500;
  text-align: center;
  border: none;

  &::after {
    border: none;
  }
}

.login-tip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.login-btn {
  margin-top: 20rpx;
  width: 200rpx;
  height: 80rpx;
  line-height: 80rpx;
  background-color: $uni-color-primary;
  color: $uni-text-color-inverse;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.safe-area-bottom {
  height: 20rpx;
  background-color: $uni-bg-color;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 99;
}
</style> 