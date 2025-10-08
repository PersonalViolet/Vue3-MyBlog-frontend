// 存储 搜索历史 的键名（避免硬编码）
const searchHistory_KEY = 'searchHistory'



// 针对搜索历史的本地存储操作
export function getSearchHistoryItem() {
  return localStorage.getItem(searchHistory_KEY)
}
export function setSearchHistoryItem(token: any) {
  localStorage.setItem(searchHistory_KEY, token) 
}
export function removeSearchHistoryItem() {
  localStorage.removeItem(searchHistory_KEY)
}