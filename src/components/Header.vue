<template>
  <el-header class="header">
    <div class="header-content">
      <!-- 左侧内容 -->
      <div class="left">
        <div class="logo">
          <span>待自定义</span>
        </div>
        <div class="header-buttons desktop-only">
          <el-button
            class="header-button"
            v-for="button in headerbuttons"
            :key="button.text"
            :type="button.type || 'default'"
            text
            @click="handleButtonClick(button.text)"
          >
            <span>{{ button.text }}</span>
          </el-button>
        </div>
      </div>
      
      <!-- 中间内容 (桌面端) -->
      <div class="center desktop-only">
        <!-- 搜索容器 -->
        <div class="search-container" ref="searchContainerRef">
          <el-input
            v-model="searchText"
            placeholder="请输入搜索内容"
            class="search-input"
            @focus="showSearchHistory"
            @keyup.enter="handleSearch"
            autocomplete="off"
            clearable
          >
            <template #suffix>
              <el-icon class="search-icon" @click="handleSearch">
                <Search />
              </el-icon>
            </template>
          </el-input>
          
          <!-- 搜索历史下拉面板 -->
          <el-card 
            v-show="showHistory" 
            class="search-history-panel"
            shadow="always"
          >
            <div class="history-header">
              <span>搜索历史</span>
              <el-button type="text" @click="clearHistory">清空</el-button>
            </div>
            <div 
              v-for="item in searchHistory" 
              :key="item"
              class="history-item"
              @click="selectHistory(item)"
            >
              {{ item }}
            </div>
            <div v-if="searchHistory.length === 0" class="no-history">
              暂无搜索历史
            </div>
          </el-card>
        </div>
      </div>
      
      <!-- 右侧内容 -->
      <div class="right">
        <!-- 头像及下拉框 (桌面端) -->
        <div class="nav-items desktop-only">
          <el-dropdown trigger="hover" placement="bottom-end">
            <el-avatar 
              :size="40" 
              :src="avatarUrl" 
              class="avatar-hover"
              @error="() => true"
            >
              <img :src="avatarUrl" @error="handleAvatarError" />
            </el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="goToEditor">
                  <el-icon><EditPen /></el-icon>
                  发表文章
                </el-dropdown-item>
                <el-dropdown-item @click="goToPerson">
                  <el-icon><User /></el-icon>
                  个人中心
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>

        <!-- 移动端菜单开关 -->
        <div class="mobile-toggle mobile-only" @click="toggleMobileMenu">
          <el-icon :size="24" color="#606266">
            <Close v-if="isMobileMenuOpen" />
            <IconMenu v-else />
          </el-icon>
        </div>
      </div>
    </div>

    <!-- 移动端菜单抽屉 -->
    <transition name="mobile-menu-slide">
      <div v-show="isMobileMenuOpen" class="mobile-menu">
        <div class="mobile-menu-content">
          <!-- 移动端搜索 -->
          <div class="mobile-search-section">
            <el-input
              v-model="searchText"
              placeholder="搜索..."
              @keyup.enter="handleSearch"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>

          <!-- 移动端导航链接 -->
          <div class="mobile-nav-links">
            <div 
              v-for="button in headerbuttons" 
              :key="button.text"
              class="mobile-nav-item"
              @click="handleButtonClick(button.text)"
            >
              {{ button.text }}
            </div>
          </div>

          <!-- 移动端用户信息 -->
          <div class="mobile-user-section">
            <div class="mobile-user-profile" @click="goToPerson">
              <el-avatar :size="36" :src="avatarUrl">
                <img :src="avatarUrl" @error="handleAvatarError" />
              </el-avatar>
              <span class="username">个人中心</span>
            </div>
            <div class="mobile-logout" @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </el-header>
</template>

<script lang="ts" setup>
import { User, SwitchButton, Search, Menu as IconMenu, Close, EditPen } from '@element-plus/icons-vue'
import { removeToken } from '@/utils/auth'
import { ref, computed, watch } from 'vue'
import { onClickOutside } from '@vueuse/core' 
import defaultAvatar from '@/assets/icons/defaultAvatar.svg'
import { 
  getSearchHistoryItem,
  setSearchHistoryItem,
  removeSearchHistoryItem,
  removeUserInfoItem,
  getUserInfoItem,
  getSessionUserInfoItem,
  type UserInfoItem} from '@/utils/Storage'
import { logout } from '@/api/auth'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 移动端菜单状态
const isMobileMenuOpen = ref(false)

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// 监听路由变化，跳转后自动关闭菜单
watch(
  () => router.currentRoute.value.fullPath,
  () => {
    isMobileMenuOpen.value = false
  }
)

/** 顶部导航按钮功能实现 */
// 按钮数据
const headerbuttons = [
  { type: '', text: '首页' },
  { type: 'primary', text: '标签搜索' },
  { type: 'success', text: 'success' },
] as const

/** 处理导航按钮点击 */
function handleButtonClick(text: string) {
  if (text === '首页') {
    router.push('/')
    return
  }

  if (text === '标签搜索') {
    router.push('/tag-search')
  }
}

/** 顶部导航的搜索功能实现 */
// 搜索相关数据
const searchText = ref('') // 搜索输入框内容
const showHistory = ref(false) // 控制搜索历史面板显示隐藏
const historyCache = getSearchHistoryItem()
const searchHistory = ref<string[]>(
  Array.isArray(historyCache)
    ? historyCache
    : (typeof historyCache === 'string' && historyCache.trim() ? [historyCache.trim()] : [])
) // 搜索历史数据
const searchContainerRef = ref(null) // 用于绑定搜索容器 DOM 元素

// 使用 store 中的头像
const avatarUrl = computed(() => userStore.avatarUrl)

// 处理图片加载错误，使用默认头像
function handleAvatarError(e: Event) {
  const target = e.target as HTMLImageElement
  target.src = userStore.avatarUrl // 如果加载失败，重置为 store 中的值（可能是默认头像），或者可以设置一个固定的 fallback
  // 如果 store 中的也失败了（比如是网络图片404），可以硬编码一个兜底
  target.onerror = null // 防止死循环
}


// 显示搜索历史
function showSearchHistory() {
  showHistory.value = true
}

// 执行搜索
function handleSearch() {
  const keyword = searchText.value.trim()
  if (keyword) {
    if (!searchHistory.value.includes(keyword)) {
      searchHistory.value.unshift(keyword)
      if (searchHistory.value.length > 10) {
        searchHistory.value.pop()
      }
      setSearchHistoryItem(JSON.stringify(searchHistory.value))
    }

    showHistory.value = false
    router.push({
      path: '/search',
      query: {
        keyword,
        type: 'article'
      }
    })
  }
}

// 选择历史记录
function selectHistory(item: string) {
  searchText.value = item
  showHistory.value = false
  handleSearch()
}

// 清空搜索历史
function clearHistory() {
  searchHistory.value = []
  removeSearchHistoryItem()
}

// 使用 onClickOutside 监听点击外部事件
onClickOutside(searchContainerRef, () => {
  showHistory.value = false
})

/** 登出功能实现 */
function handleLogout() {
  // 发送登出请求
  logout().then(() => {
    // 删除token
    removeToken()
    // 删除搜索历史
    removeSearchHistoryItem()
    // 删除本地存储用户信息
    removeUserInfoItem()
    userStore.clearUserInfo()
    // 弹出
    ElMessage.success('登出成功')
    // 跳转到登录页
    router.push('/Login')
  }).catch(err => {
    console.error('登出失败:', err)
    ElMessage.error('登出失败')
  })
}

/** 跳转到个人中心 */
function goToPerson() {
  router.push('/Person')
}

/** 跳转到文章编辑器 */
function goToEditor() {
  router.push('/editor')
}
</script>

<style scoped>
.avatar-hover {
  cursor: pointer;
  transition: all 0.3s ease;
}

.avatar-hover:hover {
  transform: scale(1.05);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px !important;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 0 20px;
}

.header-content {
  display: flex;
  align-items: center;
  height: 100%;
}

/** 导航栏左侧css样式 */
.left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 按钮悬停样式 */
.header-buttons .header-button span {
  display: inline-block;
  transition: transform 0.3s ease;
}

.header-buttons .header-button:hover span {
  transform: translateY(-2px);
}

/** 导航栏中间css样式 */
.center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
}

/** 导航栏右侧css样式 */
.right {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
  justify-content: flex-end;
}

.nav-items {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 搜索容器样式 */
.search-container {
  position: relative;
  width: 90%;
  max-width: 600px;
  margin: 0 20px;
}

/* 搜索输入框样式 */
.search-input {
  border-radius: 20px;
}

/* 搜索图标样式 */
.search-icon {
  cursor: pointer;
  color: #909399;
  font-size: 16px;
}

.search-icon:hover {
  color: #409eff;
}

/* 搜索历史面板样式 */
.search-history-panel {
  position: absolute;
  top: 30px;
  left: 0;
  right: 0;
  z-index: 1001;
  max-height: 300px;
  overflow-y: auto;
}

/* 历史记录头部样式 */
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #eee;
}

/* 历史记录项样式 */
.history-item {
  padding: 10px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
}

.history-item:hover {
  background-color: #f5f5f5;
}

/* 无历史记录样式 */
.no-history {
  padding: 20px;
  text-align: center;
  color: #999;
}

/* ------------------- 移动端适配样式 ------------------- */

/* 默认隐藏移动端元素 */
.mobile-only {
  display: none !important;
}

/* 媒体查询：适配移动端 (最大宽度 768px) */
@media (max-width: 768px) {
  /* 隐藏桌面端元素 */
  .desktop-only {
    display: none !important;
  }
  
  /* 显示移动端元素 */
  .mobile-only {
    display: flex !important;
  }
  
  /* 调整 Header 内边距 */
  .header {
    padding: 0 16px;
  }
  
  /* 调整左右布局对齐 */
  .left {
    justify-content: flex-start;
  }
  
  .right {
    justify-content: flex-end;
  }
}

/* 移动端汉堡菜单按钮 */
.mobile-toggle {
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-toggle:active {
  background-color: #f5f5f5;
}

/* 移动端菜单抽屉 */
.mobile-menu {
  position: fixed;
  top: 64px; /* Header 高度 */
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #fff;
  z-index: 999;
  overflow-y: auto;
  border-top: 1px solid #eee;
  /* 增加阴影提升层次感 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.mobile-menu-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: calc(100% - 40px); /* 扣除 padding */
}

/* 移动端搜索区域 */
.mobile-search-section {
  padding-bottom: 10px;
}

/* 移动端导航链接 */
.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-nav-item {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  padding: 16px;
  border-radius: 8px;
  background-color: #f9fafc;
  cursor: pointer;
  transition: all 0.2s;
  /* 最小点击区域优化 */
  min-height: 48px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.mobile-nav-item:active {
  background-color: #ecf5ff;
  color: #409eff;
}

/* 移动端用户信息区域 */
.mobile-user-section {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mobile-user-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.mobile-user-profile:active {
  background-color: #f5f7fa;
}

.username {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.mobile-logout {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #f56c6c;
  padding: 16px 12px;
  cursor: pointer;
  font-size: 16px;
  border-radius: 8px;
}

.mobile-logout:active {
  background-color: #fef0f0;
}

/* 菜单过渡动画 */
.mobile-menu-slide-enter-active,
.mobile-menu-slide-leave-active {
  transition: all 0.3s ease;
}

.mobile-menu-slide-enter-from,
.mobile-menu-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
