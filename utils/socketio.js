import { io } from 'socket.io-client';
import store from '@/store/index.js';
import { BASE_URL } from '@/config';
import { updateMessageBadge } from '@/utils/common.js';

class SocketIOService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.connecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isActiveChat = false;
    this.messageCallbacks = [];
    this.messageReadCallbacks = [];
    this.socketUrl = BASE_URL;
    this.currentChatTarget = null;
    this._joinedRooms = [];
    this.userStatusCallbacks = [];
    this._badgeRefreshTimer = null;
    // 待确认发送队列：tempId -> { timer, onSent, onFailed }（M14）
    // message_sent 回执按 temp_id 命中即标记已发送；10 秒超时未收到回执则按发送失败处理
    this._pendingSends = new Map();

    // #ifdef H5
    // 页面重新可见时（切回标签页/从后台恢复）若已登录但未连接，主动重建连接。
    // 后台标签页定时器被浏览器节流时，socket.io 的重试会暂停，回到前台由此入口兜底自愈。
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.ensureConnected();
        }
      });
    }
    // #endif
  }

  /**
   * 确保连接可用：已登录且未连接/未在连接时重建 Socket
   */
  ensureConnected() {
    try {
      const token = uni.getStorageSync('token');
      const userInfo = store.state.userInfo;
      if (!token || !userInfo || !userInfo.id) return;
      if (!this.connected && !this.connecting) {
        this.initSocket();
      }
    } catch (e) {
      // 静默：重建失败时由 socket.io 重试或下次可见性事件再触发
    }
  }

  /**
   * 收消息事件统一入口：若消息是发给"我"且当前没有在看该会话，刷新未读角标
   */
  _handleIncomingForBadge(data) {
    try {
      if (!data || !data.sender_id || !data.receiver_id) return;
      const myId = store.state.userInfo && store.state.userInfo.id !== undefined && store.state.userInfo.id !== null
        ? String(store.state.userInfo.id) : '';
      if (!myId || String(data.receiver_id) !== myId) return;
      const viewingThisChat = this.isActiveChat && this.currentChatTarget &&
        String(this.currentChatTarget.id) === String(data.sender_id);
      if (!viewingThisChat) {
        this.refreshUnreadBadge();
      }
    } catch (e) {
      // 角标刷新失败不影响消息分发
    }
  }

  /**
   * 收到非当前会话的来消息时，防抖刷新"消息"tab 未读角标
   */
  refreshUnreadBadge() {
    if (this._badgeRefreshTimer) clearTimeout(this._badgeRefreshTimer);
    this._badgeRefreshTimer = setTimeout(() => {
      this._badgeRefreshTimer = null;
      const token = uni.getStorageSync('token');
      if (!token) return;
      uni.request({
        url: BASE_URL + '/user/chat/unread-count',
        method: 'GET',
        header: { 'Authorization': 'Bearer ' + token },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300 && res.data) {
            updateMessageBadge(res.data.total_unread || 0);
          }
        },
        fail: () => {}
      });
    }, 500);
  }

  /**
   * 初始化Socket.IO连接
   * 建立与服务器的WebSocket连接并设置事件监听
   */
  initSocket() {
    // #ifdef MP-WEIXIN
    // 小程序运行时 engine.io 取不到 globalThis.WebSocket，socket.io-client 永远连不上，
    // 且会触发无限重连空转耗电。本轮明确降级：不发连接，由调用方（chat.vue 等）的
    // HTTP 轮询兜底接收新消息
    console.warn('[socket] 小程序端暂不支持实时推送，已降级为 HTTP 轮询模式');
    return;
    // #endif
    // 确保用户已登录
    try {
      // 修改获取用户信息的方式
      const currentUser = store.state.userInfo;  // 直接从store.state中获取userInfo
      
      // 增加检查逻辑
      if (!currentUser) {
        return;
      }
      
      if (!currentUser.id) {
        return;
      }
      
      // 如果已经在连接中或已连接，则不再重复连接
      if (this.connecting || this.connected) {
        return;
      }
      
      this.connecting = true;
      
      // 关闭现有连接
      this.close();
      
      // 获取token
      const token = uni.getStorageSync('token');
      if (!token) {
        this.connecting = false;
        return;
      }
      
        // 创建Socket.IO连接
        try {
          // token 快照仅写入 engine.io 的 query（无法函数化，仅作参考不计为认证依据）；
          // 认证以 auth 函数为准：socket.io-client 支持函数 auth，每次连接/重连时重新求值，
          // 避免"建连后换发新 token，重连仍携带旧 token 快照"导致认证失败
          const token = uni.getStorageSync('token');
          this.socket = io(this.socketUrl, {
            transports: ['websocket'],
            auth: (cb) => cb({ token: uni.getStorageSync('token') }),
            query: {
              token: token
            },
          extraHeaders: {
            Authorization: `Bearer ${token}`  // 添加标准JWT授权头
          },
          reconnection: true,
          // 无限重试（配合退避上限）：此前 attempts=5×5s≈25s 后永久放弃，
          // 长时间断网后停留在聊天页不会自愈
          reconnectionAttempts: Infinity,
          reconnectionDelay: 5000,
          reconnectionDelayMax: 15000,
          timeout: 20000
        });
        
        // 添加连接超时处理
        const connectionTimeout = setTimeout(() => {
          if (!this.connected) {
            this.connecting = false;
            // 重新尝试连接
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnectAttempts++;
              setTimeout(() => {
                this.initSocket();
              }, 3000);
            }
          }
        }, 10000);  // 10秒超时
        
        // 监听连接事件
        this.socket.on('connect', () => {
          clearTimeout(connectionTimeout);  // 清除连接超时定时器
          this.connected = true;
          this.connecting = false;
          this.reconnectAttempts = 0;
          
          // 确保token存在
          if (!token) {
            return;
          }
          
          // 获取当前用户信息进行验证
          const currentUser = store.state.userInfo;
          if (!currentUser || !currentUser.id) {
            // 即使用户信息不完整，仍然尝试认证，因为token可能是有效的
          }
          
          // 发送认证并加入房间
          try {
            this.authenticate(token);
          } catch (error) {
            // 处理认证错误
          }
        });
        
        // 监听断开连接事件
        this.socket.on('disconnect', (reason) => {
          this.connected = false;
          this.connecting = false;
          // 服务端房间随连接断开而失效，必须清空本地缓存，重连成功后重新加入
          this._joinedRooms = [];
          // 断开时清空待确认发送队列的定时器（连接断了收不到回执，由页面侧标记失败/重发）
          this._pendingSends.forEach((pending) => clearTimeout(pending.timer));
          this._pendingSends.clear();
          // 注意：不要置空 this.socket —— 保留引用让 socket.io 内置重连继续工作，
          // 重连成功后会再次触发 connect → authenticate → joinRoom 重新入房
        });
        
        // 监听连接错误
        this.socket.on('connect_error', (error) => {
          this.connected = false;
          this.connecting = false;
          // 仅计数用于日志/认证失败重试判断；不再置空 socket——
          // 置空会让 socket.io 内置的无限重连被人为终止（原 attempts 耗尽即永久放弃）
          this.reconnectAttempts++;
        });
        
        // 监听消息事件
        this.registerDefaultEvents();
        
      } catch (error) {
        this.connecting = false;
      }
    } catch (error) {
      this.connecting = false;
    }
  }
  
  /**
   * 关闭Socket.IO连接
   */
  close() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    // 断开后服务端房间全部失效，清空本地已加入房间缓存
    this._joinedRooms = [];
    // 清空待确认发送队列，避免其定时器在重连后误触发
    if (this._pendingSends) {
      this._pendingSends.forEach((pending) => clearTimeout(pending.timer));
      this._pendingSends.clear();
    }
  }
  
  /**
   * 发送认证消息
   */
  authenticate(token) {
    if (!this.socket || !this.connected) {
      return;
    }
    
    // 检查token是否存在
    if (!token) {
      return;
    }
    
    // 检查用户信息是否存在
    const currentUser = store.state.userInfo;
    if (!currentUser || !currentUser.id) {
      // 继续认证，可能服务器端会返回用户信息
    }
    
    try {
      // 修复：先监听服务器认证结果事件，再发送认证请求
      // 确保监听器在触发事件前已注册
      const authResultHandler = (data) => {
        try {
          if (data && data.success) {
            // 重新检查用户信息是否存在，可能在认证过程中已更新
            if (store.state.userInfo && store.state.userInfo.id) {
              try {
                this.joinRoom();
              } catch (error) {
                // 处理加入房间失败
              }
            }
          } else {
            // 如果认证失败，可以尝试重新连接
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              // 先断开当前连接再重试：连接本身是通的、只是认证失败，
              // 若不 close，initSocket 开头的 connected/connecting 守卫会拦下重试导致空转
              this.close();
              // 延迟一段时间后重新连接
              setTimeout(() => {
                this.initSocket();
              }, 3000);
            }
          }
        } catch (e) {
          // 处理认证结果事件错误
        }
      };
      
      // 移除之前可能存在的监听器，避免重复
      this.socket.off('authenticate_result');
      
      // 添加新的监听器
      this.socket.on('authenticate_result', authResultHandler);
      
      // 发送认证请求，不使用回调
      this.socket.emit('authenticate', { 
        token: token,
        authorization: `Bearer ${token}` // 添加标准授权格式
      });
    } catch (error) {
      // 处理发送认证消息错误
    }
  }
  
  /**
   * 加入房间
   * @deprecated 旧版加入房间方法，保留向后兼容，建议使用joinChatTargetRoom
   */
  joinRoom() {
    if (!this.socket || !this.connected) return;
    
    try {
      // 修改获取用户信息的方式
      const currentUser = store.state.userInfo;
      
      // 增强检查，确保currentUser存在且有id属性
      if (!currentUser) {
        return;
      }
      
      if (!currentUser.id) {
        return;
      }
      
      const token = uni.getStorageSync('token');
      if (!token) {
        return;
      }
      
      // 监听加入房间的状态消息
      const statusHandler = (data) => {
        try {
          if (data && data.user_id) {
            if (data.msg && data.msg.includes('已加入房间')) {
              // 只有当房间状态消息与当前用户ID相关时才处理
              if (data.user_id.toString() === currentUser.id.toString()) {
                // 成功加入自己的房间
              }
            }
          }
        } catch (e) {
          // 处理房间状态消息错误
        }
      };
      
      // 监听错误消息
      const errorHandler = (errorData) => {
        if (errorData && errorData.originEvent === 'join') {
          // 加入房间失败
        }
      };
      
      // 添加临时监听器
      this.socket.on('status', statusHandler);
      this.socket.on('error', errorHandler);
      
      // 1. 加入自己的私人房间，用于接收发给自己的消息
      this.socket.emit('join', {
        room: currentUser.id.toString(),
        token: token,
        authorization: `Bearer ${token}` // 添加标准授权头
      });
      
      // 2. 查找当前活跃聊天对象，如果存在则也加入其私聊房间
      if (this.isActiveChat && this.currentChatTarget) {
        const targetUser = this.currentChatTarget;
        if (targetUser && targetUser.id) {
          // 使用新的joinChatTargetRoom方法加入私聊房间
          setTimeout(() => {
            this.joinChatTargetRoom(targetUser.id);
          }, 500); // 稍微延迟加入私聊房间，避免请求冲突
        }
      }
      
      // 10秒后自动移除监听器，避免内存泄漏
      setTimeout(() => {
        this.socket.off('status', statusHandler);
        this.socket.off('error', errorHandler);
      }, 10000);
      
    } catch (error) {
      // 处理加入房间错误
    }
  }
  
  /**
   * 加入与特定用户的聊天房间
   * @param {string|number} targetUserId 目标用户ID
   * @returns {Promise} 返回一个Promise，表示加入房间的结果
   */
  joinChatTargetRoom(targetUserId) {
    if (!this.socket || !this.connected) {
      return Promise.reject(new Error('Socket未连接'));
    }
    
    try {
      // 获取当前用户信息
      const currentUser = store.state.userInfo;
      
      // 检查用户信息
      if (!currentUser || !currentUser.id) {
        return Promise.reject(new Error('用户信息不完整'));
      }
      
      // 检查目标用户ID
      if (!targetUserId) {
        return Promise.reject(new Error('目标用户ID不存在'));
      }
      
      // 获取token
      const token = uni.getStorageSync('token');
      if (!token) {
        return Promise.reject(new Error('Token不存在'));
      }
      
      // 生成唯一房间名
      const roomName = this.generateUniqueRoomName(currentUser.id, targetUserId);

      // 房间名生成失败（ID非法，如误把房间名当用户ID传入）时直接失败，
      // 避免向服务器发出 room: null 的畸形加房请求
      if (!roomName) {
        return Promise.reject(new Error('无法生成房间名，请检查用户ID'));
      }

      // 检查是否已经加入该房间
      if (this._joinedRooms && this._joinedRooms.includes(roomName)) {
        // 仍然更新当前聊天目标
        if (!this.currentChatTarget || this.currentChatTarget.id !== targetUserId) {
          this.currentChatTarget = { id: targetUserId };
        }

        return Promise.resolve({ success: true, room_name: roomName, already_joined: true });
      }

      return new Promise((resolve, reject) => {
        // 注册与移除使用同一个具名函数引用，确保监听器一定会被清理
        const resultHandler = (data) => {
          clearTimeout(timeout);
          this.socket.off('join_private_chat_result', resultHandler);

          if (data && data.success) {
            // 记录已加入的房间
            if (!this._joinedRooms) this._joinedRooms = [];
            if (!this._joinedRooms.includes(roomName)) {
              this._joinedRooms.push(roomName);
            }

            // 成功后，更新当前聊天目标
            if (!this.currentChatTarget || this.currentChatTarget.id !== targetUserId) {
              this.currentChatTarget = { id: targetUserId };
            }

            resolve(data);
          } else {
            const error = (data && data.error) ? data.error : '未知错误';
            reject(new Error(error));
          }
        };

        // 设置超时
        const timeout = setTimeout(() => {
          this.socket.off('join_private_chat_result', resultHandler);
          reject(new Error('加入房间请求超时'));
        }, 10000); // 10秒超时

        // 监听加入私聊房间的结果
        this.socket.on('join_private_chat_result', resultHandler);
        
        // 发送加入私聊房间的请求，确保参数名与后端一致
        this.socket.emit('join_private_chat', {
          room: roomName,                      // 房间名
          user_id: currentUser.id.toString(),  // 当前用户ID
          target_id: targetUserId.toString(),  // 目标用户ID
          token: token,                        // 令牌
          authorization: `Bearer ${token}`     // 标准授权格式
        });
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }
  
  /**
   * 离开房间
   * @param {string} roomId 房间ID或房间名
   */
  leaveRoom(roomId) {
    if (!this.socket || !this.connected) return;
    
    if (!roomId) {
      return;
    }
    
    const token = uni.getStorageSync('token');
    if (!token) {
      return;
    }
    
    try {
      // 判断是否是私聊房间名（以chat:开头）
      if (typeof roomId === 'string' && roomId.startsWith('chat:')) {
        // 离开私聊房间
        this.socket.emit('leave_private_chat', {
          room_name: roomId,
          token: token,
          authorization: `Bearer ${token}`
        });
      } else {
        // 离开普通房间
        this.socket.emit('leave', {
          room: roomId.toString(),
          token: token,
          authorization: `Bearer ${token}`
        });
      }
    } catch (error) {
      // 处理离开房间错误
    }
  }
  
  /**
   * 离开与特定用户的私聊房间
   * 与 joinChatTargetRoom 对应：内部生成 chat:a-b 房间名并发送 leave_private_chat
   * @param {string|number} targetUserId 目标用户ID
   * @returns {boolean} 是否成功发送离开请求
   */
  leaveChatTargetRoom(targetUserId) {
    if (!this.socket || !this.connected) {
      return false;
    }

    const currentUser = store.state.userInfo;
    if (!currentUser || !currentUser.id || !targetUserId) {
      return false;
    }

    const roomName = this.generateUniqueRoomName(currentUser.id, targetUserId);
    if (!roomName) {
      return false;
    }

    const token = uni.getStorageSync('token');
    if (!token) {
      return false;
    }

    try {
      this.socket.emit('leave_private_chat', {
        room_name: roomName,
        token: token,
        authorization: `Bearer ${token}`
      });
      // 同步本地房间缓存
      this._joinedRooms = (this._joinedRooms || []).filter(r => r !== roomName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 注册 message_sent 回执监听（initSocket 时随 registerDefaultEvents 一次性注册）。
   * 后端发送成功后回发 { success, message_id, room_name, temp_id }（chat.py:331-336），
   * 此前该事件被完全丢弃——发送失败或未入房收不到房间回显时气泡永久停留在"发送中"。
   * 这里只把"发送中"置为"已发送"，不插入消息：房间回显（receive_private_message）
   * 会按消息 id 匹配临时消息并归位，两侧互补去重，不会双写。
   */
  handleSentReceipt(data) {
    try {
      if (!data || !data.temp_id || !this._pendingSends.has(data.temp_id)) {
        return;
      }
      const pending = this._pendingSends.get(data.temp_id);
      clearTimeout(pending.timer);
      this._pendingSends.delete(data.temp_id);
      if (data.success && typeof pending.onSent === 'function') {
        pending.onSent(data);
      } else if (!data.success && typeof pending.onFailed === 'function') {
        pending.onFailed(data);
      }
    } catch (error) {
      // 回执处理失败不影响消息收发主流程
    }
  }

  /**
   * 发送消息
   * @param {string|number} receiverId 接收者ID
   * @param {string} message 消息内容
   * @param {string} [tempId] 本地消息的临时ID（chat.vue 生成），用于与后端 message_sent
   *                 回执的 temp_id 对齐匹配；不传时内部自行生成（仅超时失败回调可用）
   * @param {Object} [callbacks] { onSent, onFailed } 发送结果回调（可选）
   * @returns {boolean} 是否成功发出（socket 不可用/参数非法返回 false）
   */
  sendMessage(receiverId, message, tempId, callbacks) {
    // 检查socket连接状态
    if (!this.socket || !this.connected) {
      return false;
    }

    // 检查接收者ID
    if (!receiverId) {
      return false;
    }

    // 检查消息内容
    if (!message || (typeof message === 'string' && message.trim() === '')) {
      return false;
    }

    // 获取token
    const token = uni.getStorageSync('token');
    if (!token) {
      return false;
    }

    // 获取当前用户信息
    const currentUser = store.state.userInfo;
    if (!currentUser || !currentUser.id) {
      // 不阻止发送，因为token可能是有效的
    }

    try {
      // 临时ID：优先复用 chat.vue 生成的本地消息 temp id（与 message_sent 回执对齐），
      // 未传时内部生成兜底，保证消息可追踪（M14：此前生成的 messageId 无任何前端消费）
      const messageId = tempId || `msg_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

      // 生成私聊房间名
      const roomName = this.generateUniqueRoomName(currentUser.id, receiverId);
      if (!roomName) {
        return false;
      }

      // 登记"发送中"状态与结果回调：回执到达或超时后按 temp_id 命中处理
      if (tempId) {
        // 同一 tempId 重复登记（如快速重发）时先清理旧的等待项
        const previous = this._pendingSends.get(tempId);
        if (previous) clearTimeout(previous.timer);

        const pending = {
          timer: setTimeout(() => {
            // 10 秒未收到 message_sent 回执视为发送失败（服务端未入库/未入房）。
            // 房间回显后到的情况极少见；若之后回显到达，会按消息 id 正常归位清除状态
            this._pendingSends.delete(tempId);
            if (callbacks && typeof callbacks.onFailed === 'function') {
              try {
                callbacks.onFailed({ temp_id: tempId, error: '发送超时' });
              } catch (e) {
                // 业务回调异常不影响服务本身
              }
            }
          }, 10000),
          onSent: callbacks && typeof callbacks.onSent === 'function' ? callbacks.onSent : null,
          onFailed: callbacks && typeof callbacks.onFailed === 'function' ? callbacks.onFailed : null
        };
        this._pendingSends.set(tempId, pending);
      }

      // 发送消息到私聊房间，确保属性名与后端一致
      this.socket.emit('send_private_message', {
        receiver_id: receiverId,
        room_name: roomName,  // 使用room_name替代room
        message: message,
        token: token,
        authorization: `Bearer ${token}`,
        message_id: messageId  // 后端原样作为 temp_id 回发（chat.py:335）
      });

      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 发送消息已读通知
   */
  sendMessageReadNotification(data) {
    // 检查Socket.IO连接状态
    if (!this.socket || !this.connected) {
      return false;
    }
    
    // 检查data是否存在
    if (!data) {
      return false;
    }
    
    // 检查必要参数
    if (!data.message_id) {
      return false;
    }
    
    if (!data.sender_id) {
      return false;
    }
    
    // 获取token
    const token = uni.getStorageSync('token');
    if (!token) {
      return false;
    }
    
    // 获取当前用户ID
    const currentUser = store.state.userInfo;
    if (!currentUser || !currentUser.id) {
      return false;
    }
    
    // 生成私聊房间名
    const roomName = this.generateUniqueRoomName(currentUser.id, data.sender_id);
    if (!roomName) {
      return false;
    }
    
    // 确保已加入发送者的房间，以便发送者可以接收到已读通知
    this.joinChatTargetRoom(data.sender_id)
      .catch(error => {
        // 加入聊天房间失败，但继续尝试发送已读通知
      })
      .finally(() => {
        // 准备通知数据，确保参数名称与后端一致
        const messageData = {
          message_id: data.message_id,
          sender_id: data.sender_id,
          room_name: roomName,
          user_id: currentUser.id.toString(),  // 当前用户ID (接收者)
          token: token,
          authorization: `Bearer ${token}`
        };
        
        try {
          // 发送私聊消息已读通知
          this.socket.emit('notify_message_read_private', messageData);
        } catch (error) {
          return false;
        }
      });
    
    return true;
  }
  
  /**
   * 注册默认事件监听
   */
  registerDefaultEvents() {
    try {
      if (!this.socket) {
        return;
      }
      
      // 消息的回调监听器集合
      this.messageCallbacks = this.messageCallbacks || [];
      
      // 消息已读回调集合
      this.messageReadCallbacks = this.messageReadCallbacks || [];
      
      // 接收消息 - 旧版本接口，保留向后兼容
      this.socket.on('receive_message', (data) => {
        try {
          this._handleIncomingForBadge(data);
          this.messageCallbacks.forEach(callback => {
            try {
              callback(data);
            } catch (e) {
              // 处理消息回调处理错误
            }
          });
        } catch (error) {
          // 处理接收消息事件时出错
        }
      });
      
      // 接收私聊消息 - 新版本接口
      this.socket.on('receive_private_message', (data) => {
        try {
          this._handleIncomingForBadge(data);
          this.messageCallbacks.forEach(callback => {
            try {
              callback(data);
            } catch (e) {
              // 处理私聊消息回调处理错误
            }
          });
        } catch (error) {
          // 处理私聊消息事件时出错
        }
      });
      
      // 消息已读 - 旧版本接口，保留向后兼容
      this.socket.on('message_read', (data) => {
        try {
          this.triggerMessageReadCallbacks(data);
        } catch (error) {
          // 处理消息已读事件时出错
        }
      });
      
      // 私聊消息已读 - 新版本接口
      this.socket.on('private_message_read', (data) => {
        try {
          this.triggerMessageReadCallbacks(data);
        } catch (error) {
          // 处理私聊消息已读事件时出错
        }
      });
      
      // 加入私聊房间的结果由 joinChatTargetRoom 内注册的具名监听器处理，
      // 此处不再重复注册全局监听（避免与临时监听器重复消费同一次结果）

      // 发送回执：后端入库成功后向发送者回发 message_sent（含 temp_id），
      // 按回执把对应本地消息从"发送中"置为"已发送"（M14）
      this.socket.on('message_sent', (data) => {
        try {
          this.handleSentReceipt(data);
        } catch (error) {
          // 处理发送达回执事件时出错
        }
      });

      // 服务器错误
      this.socket.on('error', (data) => {
        try {
          // 判断是否需要重新认证
          if (data && (data.code === 401 || (data.error && data.error.includes('认证')))) {
            // 尝试重新认证
          }
        } catch (error) {
          // 处理服务器错误事件时出错
        }
      });
      
      // 认证结果
      this.socket.on('authenticate_result', (data) => {
        try {
          if (data.success) {
            // 如果服务器返回了用户ID，但本地没有，可以尝试获取用户信息
            if (data.user_id && (!store.state.userInfo || !store.state.userInfo.id)) {
              // 在这里可以触发获取用户信息的操作
            }
          } else {
            // 判断是否需要重新登录
            if (data.error && (data.error.includes('过期') || data.error.includes('无效'))) {
              // 建议重新登录
            }
          }
        } catch (error) {
          // 处理认证结果事件时出错
        }
      });
      
      // 添加对新类型事件的监听
      this.socket.on('reconnect', (attemptNumber) => {
        // 重连成功后重新认证
        const token = uni.getStorageSync('token');
        if (token) {
          // 重连成功，重新进行认证
        }
      });
      
      this.socket.on('reconnect_attempt', (attemptNumber) => {
        // 尝试第几次重连...
      });
      
      this.socket.on('reconnect_error', (error) => {
        // Socket.IO重连错误
      });
      
      this.socket.on('reconnect_failed', () => {
        // Socket.IO重连失败，已达到最大重试次数
      });
      
      // 注册用户状态监听
      this.socket.on('user_status_change', (data) => {
        try {
          if (data && data.user_id) {
            // 用户状态变化
          }
        } catch (error) {
          // 处理用户状态变化消息时出错
        }
      });
      
    } catch (error) {
      // 注册默认事件监听时出错
    }
  }
  
  /**
   * 触发消息已读回调
   */
  triggerMessageReadCallbacks(data) {
    if (!data || !data.message_id) {
      return;
    }
    
    try {
      this.messageReadCallbacks.forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          // 处理消息已读回调处理错误
        }
      });
    } catch (error) {
      // 触发消息已读回调时出错
    }
  }
  
  /**
   * 添加消息监听回调
   */
  addMessageListener(callback) {
    try {
      if (typeof callback === 'function') {
        // 检查是否已添加过相同的回调函数
        const exists = this.messageCallbacks.some(cb => cb === callback);
        if (!exists) {
          this.messageCallbacks.push(callback);
        }
      } else {
        // 添加的回调不是函数类型
      }
    } catch (error) {
      // 添加消息监听回调时出错
    }
  }
  
  /**
   * 移除消息监听回调
   */
  removeMessageListener(callback) {
    try {
      if (typeof callback === 'function') {
        const oldLength = this.messageCallbacks.length;
        this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
        const newLength = this.messageCallbacks.length;
        if (oldLength !== newLength) {
          // 已移除消息监听回调，移除了几个回调
        }
      } else {
        // 移除的回调不是函数类型
      }
    } catch (error) {
      // 移除消息监听回调时出错
    }
  }
  
  /**
   * 添加消息已读监听回调
   */
  addMessageReadListener(callback) {
    try {
      if (typeof callback === 'function') {
        // 初始化回调数组（如果不存在）
        if (!this.messageReadCallbacks) {
          this.messageReadCallbacks = [];
        }
        
        // 检查是否已添加过相同的回调函数
        const exists = this.messageReadCallbacks.some(cb => cb === callback);
        if (!exists) {
          this.messageReadCallbacks.push(callback);
        }
      } else {
        // 添加的消息已读回调不是函数类型
      }
    } catch (error) {
      // 添加消息已读监听回调时出错
    }
  }
  
  /**
   * 移除消息已读监听回调
   */
  removeMessageReadListener(callback) {
    try {
      if (!this.messageReadCallbacks) return;
      
      if (typeof callback === 'function') {
        const oldLength = this.messageReadCallbacks.length;
        this.messageReadCallbacks = this.messageReadCallbacks.filter(cb => cb !== callback);
        const newLength = this.messageReadCallbacks.length;
        if (oldLength !== newLength) {
          // 已移除消息已读监听回调，移除了几个回调
        }
      } else {
        // 移除的消息已读回调不是函数类型
      }
    } catch (error) {
      // 移除消息已读监听回调时出错
    }
  }
  
  /**
   * 设置聊天页面活跃状态
   */
  setActiveChatStatus(isActive) {
    const previousState = this.isActiveChat;
    this.isActiveChat = isActive;
    
    // 如果变为活跃且未连接，则尝试连接
    if (isActive && !this.connected && !this.connecting) {
      try {
        // 检查用户是否已登录
        const token = uni.getStorageSync('token');
        const userInfo = store.state.userInfo;
        
        if (token && userInfo && userInfo.id) {
          // 聊天页面变为活跃且未连接：重建 Socket.IO 连接
          // （此前该分支只有注释没有调用，导致断网后回到聊天页不自愈）
          this.initSocket();
        } else {
          // 用户未登录，不建立Socket.IO连接
        }
      } catch (error) {
        // 设置活跃状态时出错
      }
    } 
    // 如果从非活跃变为活跃，并且已经连接，确保加入了聊天对象的房间
    else if (isActive && !previousState && this.connected && this.currentChatTarget) {
      try {
        // 聊天页面从非活跃变为活跃，确保加入了聊天对象房间
        this.joinChatTargetRoom(this.currentChatTarget.id);
      } catch (error) {
        // 重新加入聊天对象房间时出错
      }
    }
    // 如果从活跃变为非活跃，可以考虑执行一些清理操作
    else if (!isActive && previousState) {
      // 聊天页面变为非活跃，执行清理操作
      
      // 可以选择离开聊天对象的房间，但保持自己的房间连接，以便接收消息通知
      if (this.connected && this.currentChatTarget) {
        // 注释掉以下行，以保持在聊天对象房间中，确保能接收到消息已读通知
        // this.leaveRoom(this.currentChatTarget.id);
      }
    }
  }

  /**
   * 设置当前聊天对象
   * 在开始聊天时调用此方法
   */
  setCurrentChatTarget(targetUserId, targetUserInfo = null) {
    if (!targetUserId) {
      return;
    }
    
    // 如果有详细信息，存储它
    if (targetUserInfo) {
      // 如果应用有Vuex存储，可以将活跃聊天对象信息存储在全局状态中
      // store.commit('setActiveChatUser', targetUserInfo);
      
      // 临时存储在服务实例中
      this.currentChatTarget = targetUserInfo;
    } else {
      // 仅存储ID
      this.currentChatTarget = { id: targetUserId };
    }
    
    // 如果已连接，则加入该用户的房间
    if (this.socket && this.connected) {
      this.joinChatTargetRoom(targetUserId);
    }
  }

  /**
   * 清空当前聊天对象
   * 退出聊天页时调用；setCurrentChatTarget(null) 是无效调用（空参直接 return），
   * 必须用本方法才能真正清空，避免重连时自动重join旧会话房间
   */
  clearCurrentChatTarget() {
    this.currentChatTarget = null;
  }

  /**
   * 生成唯一的聊天房间名
   * 规则：将两个用户ID按升序排列，拼接成形如 "chat:smaller_id-larger_id" 的字符串
   * @param {string|number} userId1 用户ID1
   * @param {string|number} userId2 用户ID2
   * @returns {string} 唯一的房间名
   */
  generateUniqueRoomName(userId1, userId2) {
    // 转换为数字进行比较
    const id1 = parseInt(userId1);
    const id2 = parseInt(userId2);
    
    if (isNaN(id1) || isNaN(id2)) {
      return null;
    }
    
    // 按升序排列
    const smallerId = Math.min(id1, id2);
    const largerId = Math.max(id1, id2);
    
    // 生成唯一房间名
    return `chat:${smallerId}-${largerId}`;
  }

  /**
   * 通知用户在线状态
   * @param {string|number} targetUserId 目标用户ID
   * @returns {boolean} 是否成功发送通知
   */
  notifyUserOnline(targetUserId) {
    if (!this.socket || !this.connected) {
      return false;
    }
    
    try {
      // 获取当前用户信息
      const currentUser = store.state.userInfo;
      
      // 检查用户信息
      if (!currentUser || !currentUser.id) {
        return false;
      }
      
      // 检查目标用户ID
      if (!targetUserId) {
        return false;
      }
      
      // 获取token
      const token = uni.getStorageSync('token');
      if (!token) {
        return false;
      }
      
      // 生成唯一房间名
      const roomName = this.generateUniqueRoomName(currentUser.id, targetUserId);
      
      // 发送在线状态通知
      this.socket.emit('user_status', {
        room: roomName,
        user_id: currentUser.id.toString(),
        target_id: targetUserId.toString(),
        status: 'online',
        token: token,
        authorization: `Bearer ${token}`
      });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 添加用户状态变化监听器
   * @param {Function} callback 回调函数，接收状态变化数据
   */
  addUserStatusListener(callback) {
    if (typeof callback !== 'function') {
      return;
    }
    
    if (!this.userStatusCallbacks) {
      this.userStatusCallbacks = [];
    }
    
    // 避免重复添加相同的回调函数
    if (!this.userStatusCallbacks.includes(callback)) {
      this.userStatusCallbacks.push(callback);
    }
  }

  /**
   * 移除用户状态变化监听器
   * @param {Function} callback 要移除的回调函数
   */
  removeUserStatusListener(callback) {
    if (!this.userStatusCallbacks || !callback) return;
    
    const index = this.userStatusCallbacks.indexOf(callback);
    if (index !== -1) {
      this.userStatusCallbacks.splice(index, 1);
    }
  }
}

// 创建单例
const socketIOService = new SocketIOService();

export default socketIOService; 