// 存储 搜索历史 的键名（避免硬编码）
const SEARCHHISTORY_KEY = 'searchHistory'
const USER_INFO_KEY = 'UserInfo'

//本地存储的用户信息
export interface UserInfoItem {
  id: number;           // 用户 ID
  username: string;     // 用户名
  avatar: string;       // 头像 URL
  rolesCode: string[];  // 角色（admin：管理员；user：普通用户）
  permsCode: string[];  // 权限
  rememberMe: boolean;  // 是否记住我
}

// 针对搜索历史的本地存储操作
export function getSearchHistoryItem() {
  const item = localStorage.getItem(SEARCHHISTORY_KEY);
  try {
    return item ? JSON.parse(item) : null;
  } catch (e) {
    // 如果解析失败，可能是旧格式的字符串，直接返回
    return item;
  }
}
export function setSearchHistoryItem(data: any) {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  localStorage.setItem(SEARCHHISTORY_KEY, jsonString) 
}
export function removeSearchHistoryItem() {
  localStorage.removeItem(SEARCHHISTORY_KEY)
}

// 针对用户信息的本地存储操作
export function getUserInfoItem() {
  const item = localStorage.getItem(USER_INFO_KEY);
  try {
    return item ? JSON.parse(item) : null;
  } catch (e) {
    // 如果解析失败，可能是旧格式的字符串，直接返回
    return item;
  }
}
export function setUserInfoItem(data: any) {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  localStorage.setItem(USER_INFO_KEY, jsonString) 
}
export function removeUserInfoItem() {
  localStorage.removeItem(USER_INFO_KEY)
}

// 针对搜索历史的会话存储操作
export function getSessionSearchHistoryItem() {
  const item = sessionStorage.getItem(SEARCHHISTORY_KEY);
  try {
    return item ? JSON.parse(item) : null;
  } catch (e) {
    // 如果解析失败，可能是旧格式的字符串，直接返回
    return item;
  }
}
export function setSessionSearchHistoryItem(data: any) {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  sessionStorage.setItem(SEARCHHISTORY_KEY, jsonString) 
}
export function removeSessionSearchHistoryItem() {
  sessionStorage.removeItem(SEARCHHISTORY_KEY)
}

// 针对用户信息的会话存储操作
export function getSessionUserInfoItem() {
  const item = sessionStorage.getItem(USER_INFO_KEY);
  try {
    return item ? JSON.parse(item) : null;
  } catch (e) {
    // 如果解析失败，可能是旧格式的字符串，直接返回
    return item;
  }
}
export function setSessionUserInfoItem(data: any) {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
  sessionStorage.setItem(USER_INFO_KEY, jsonString) 
}
export function removeSessionUserInfoItem() {
  sessionStorage.removeItem(USER_INFO_KEY)
}

export function updateUserInfoItem(userInfoItem: UserInfoItem) {
  removeSessionUserInfoItem()
  removeUserInfoItem()
  setUserInfoItem(userInfoItem)
  if (userInfoItem.rememberMe) {
    setUserInfoItem(userInfoItem)
  }else {
    setSessionUserInfoItem(userInfoItem)
  }
}