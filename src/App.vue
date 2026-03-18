<script setup lang="ts">
import './assets/styles/reset.css' // 引入全局样式
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/Header.vue'
import AuthModalHost from '@/components/auth/AuthModalHost.vue'

const route = useRoute()

// 判断当前路由是否需要显示顶栏（排除 Login 和 Register）
const showHeader = computed(() => {
  return route.name !== 'Login' && route.name !== 'Register'
})
</script>

<template>
  <el-container>
    <Header v-if="showHeader" />
    <el-main :class="{ 'with-header': showHeader }">
      <router-view></router-view>
    </el-main>
    <AuthModalHost />
  </el-container>
</template>

<style scoped>
.with-header {
  margin-top: 64px; /* 为固定头部留出空间 */
}
</style>
