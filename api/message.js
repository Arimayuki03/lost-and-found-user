import request from '../utils/request';

/**
 * 获取当前用户的聊天联系人列表
 * @returns {Promise} 返回联系人列表的Promise对象
 */
export function getChatContacts() {
  return request({
    url: '/user/chat/contacts',
    method: 'GET'
  });
}

/**
 * 获取与指定用户的聊天历史记录
 * @param {string|number} receiverId 接收者用户ID
 * @param {Object} params 分页参数
 * @param {number} [params.offset] 起始位置
 * @param {number} [params.limit] 获取数量
 * @returns {Promise} 返回聊天历史记录的Promise对象
 */
export function getChatHistory(receiverId, params = {}) {
  // 构建基础URL
  const url = `/user/chat/history/${receiverId}`;
  
  // 添加查询参数
  let queryParams = {};
  if (params.offset !== undefined) {
    queryParams.offset = params.offset;
  }
  if (params.limit !== undefined) {
    queryParams.limit = params.limit;
  }
  
  return request({
    url,
    method: 'GET',
    data: queryParams
  });
}

/**
 * 发送消息
 * @param {Object} data 消息数据对象
 * @param {string|number} data.receiverId 接收者ID
 * @param {string} data.content 消息内容
 * @param {string} [data.type] 消息类型，默认为text
 * @returns {Promise} 返回发送结果的Promise对象
 */
export function sendMessage(data) {
  return request({
    url: '/user/chat/message',
    method: 'POST',
    data
  });
}

/**
 * 标记消息为已读状态
 * @param {string|number} messageId 需要标记为已读的消息ID
 * @returns {Promise} 返回操作结果的Promise对象
 */
export function markAsRead(messageId) {
  return request({
    url: `/user/chat/mark/${messageId}`,
    method: 'POST'
  });
}

/**
 * 获取当前用户的未读消息数量
 * @returns {Promise} 返回未读消息数量的Promise对象
 */
export function getUnreadCount() {
  return request({
    url: '/user/chat/unread-count',
    method: 'GET'
  });
}

// 导出所有消息相关API
export default {
  getChatContacts,
  getChatHistory,
  sendMessage,
  markAsRead,
  getUnreadCount
}; 