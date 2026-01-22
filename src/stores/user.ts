import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  getUserInfoItem, 
  setUserInfoItem, 
  getSessionUserInfoItem, 
  setSessionUserInfoItem, 
  removeUserInfoItem,
  removeSessionUserInfoItem,
  type UserInfoItem 
} from '@/utils/Storage'
import defaultAvatar from '@/assets/icons/defaultAvatar.svg'

export const useUserStore = defineStore('user', () => {
  // 初始化时尝试从本地存储获取
  const storageUserInfo = getSessionUserInfoItem() || getUserInfoItem()
  const userInfo = ref<UserInfoItem | null>(storageUserInfo)

  // 头像 URL，带默认值处理
  const avatarUrl = computed(() => {
    if (userInfo.value && userInfo.value.avatar) {
      return userInfo.value.avatar
    }
    return defaultAvatar
  })

  // 更新用户信息
  function setUserInfo(info: UserInfoItem) {
    userInfo.value = info
    
    // 判断之前是在 session 还是 local 存储，保持一致
    // 如果 rememberMe 为 true，通常在 local，否则 session
    // 这里简单判断：如果 session 有就存 session，否则存 local
    // 或者根据 info.rememberMe (如果存在)
    
    if (getSessionUserInfoItem()) {
      setSessionUserInfoItem(info)
    } else {
      // 默认为 localStorage，或者如果之前在 session 也没有，就存 local
      // 这里为了保险，可以检查 info.rememberMe
      if (info.rememberMe === false) {
         setSessionUserInfoItem(info)
      } else {
         setUserInfoItem(info)
      }
    }
  }

  // 仅更新头像
  function updateAvatar(url: string) {
    if (userInfo.value) {
      // 添加时间戳防止缓存（如果是同一个URL）
      // 但如果是 base64 或新的 OSS URL 则不需要
      // 这里假设传入的 url 已经是处理好的
      userInfo.value.avatar = url
      // 触发持久化
      setUserInfo(userInfo.value)
    }
  }

  // 仅更新用户名
  function updateUsername(name: string) {
    if (userInfo.value) {
      userInfo.value.username = name
      setUserInfo(userInfo.value)
    }
  }
  
  // 登出清理
  function clearUserInfo() {
    userInfo.value = null
    removeUserInfoItem()
    removeSessionUserInfoItem()
  }

  /**
   * 从本地存储重新刷新用户信息
   * 用于登录成功后同步状态，或响应 Storage 变化
   */
  function refreshUserInfoFromStorage() {
    if (import.meta.env.DEV) {
      console.log('[UserStore] 开始从存储刷新用户信息...')
    }
    
    try {
      // 优先从 SessionStorage 获取，其次是 LocalStorage
      const sessionUser = getSessionUserInfoItem()
      const localUser = getUserInfoItem()
      
      const storedUser = sessionUser || localUser
      
      // 验证数据完整性 (至少要有 id 和 username)
      if (storedUser && storedUser.id && storedUser.username) {
        userInfo.value = storedUser
        
        if (import.meta.env.DEV) {
          console.log('[UserStore] 用户信息已更新:', storedUser)
        }
      } else {
        // 数据不存在或无效
        if (import.meta.env.DEV) {
          console.warn('[UserStore] 存储中未发现有效用户信息，或格式错误')
        }
        // 如果存储中没有有效数据，且当前 state 有值，可能需要考虑是否清空？
        // 考虑到此动作通常在确信有数据变更时调用，如果存储空了，State 也该空
        if (!storedUser) {
           userInfo.value = null
        }
      }
    } catch (error) {
      console.error('[UserStore] 刷新用户信息失败:', error)
      // 发生错误时，为安全起见，可能需要重置状态
      userInfo.value = null
    }
  }
  
  // 监听 storage 事件以支持多标签页同步
  window.addEventListener('storage', (event) => {
    if (event.key === 'UserInfo' || event.key === 'user') {
      if (import.meta.env.DEV) {
        console.log('[UserStore] 检测到 Storage 变化，触发同步...')
      }
      refreshUserInfoFromStorage()
    }
  })

  return {
    userInfo,
    avatarUrl,
    setUserInfo,
    updateAvatar,
    updateUsername,
    clearUserInfo,
    refreshUserInfoFromStorage
  }
})
