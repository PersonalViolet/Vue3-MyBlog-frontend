<template>
  <el-container>
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <h2>博客管理系统</h2>
        <div class="nav-items">
          <!-- <el-dropdown>
            <el-avatar :size="40" src="avatar-url" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人中心</el-dropdown-item>
                <el-dropdown-item>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown> -->
          <el-dropdown trigger="hover" placement="bottom-end">
            <el-avatar 
            :size="40" 
            src="avatar-url" 
            class="avatar-hover"
            />
            <template #dropdown>
            <el-dropdown-menu>
                <el-dropdown-item>
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
      </div>
    </el-header>
    
    <!-- 页面主体内容 -->
    <el-main class="main-content">
      <!-- 您的页面内容 -->
    </el-main>
  </el-container>
  
</template>


<script lang="ts" setup>
import { User, SwitchButton } from '@element-plus/icons-vue'
import { removeToken } from '@/utils/auth'

/** 登出功能实现 */
export function handleLogout() {
  // 发送登出请求
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
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.nav-items {
  display: flex;
  align-items: center;
  gap: 20px;
}

.main-content {
  margin-top: 64px; /* 为固定头部留出空间 */
  padding: 20px;
}
</style>

