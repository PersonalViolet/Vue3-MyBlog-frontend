// 存储 Token 的键名（避免硬编码）
const TOKEN_KEY = 'Authorization'

// 获取 Token
export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

// 设置 Token
export function setLocalToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token) 
}

export function setSessionToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token) 
}

// 移除 Token
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}