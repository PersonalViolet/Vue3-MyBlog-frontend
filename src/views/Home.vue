<template>
  <el-container>
    <!-- 顶部导航栏 -->
    <el-header class="header">
      <div class="header-content">
        <h2>111</h2>
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
      <div class="content-wrapper">
        <div class="content-container">
          <!-- 左侧广告轮播图 -->
          <div class="ad-carousel">
            <el-carousel 
              :interval="4000" 
              type="card" 
              height="310px"
              indicator-position="outside"
            >
              <el-carousel-item v-for="item in carouselImages" :key="item.id">
                <img 
                  :src="item.url" 
                  :alt="item.alt"
                  class="carousel-image"
                />
              </el-carousel-item>
            </el-carousel>
          </div>
          
          <!-- 右侧自定义内容区域 -->
          <div class="article-content">
            <!-- 待自定义内容 -->
             <span>222</span>
          </div>
        </div>
      </div>
      <div class="content-wrapper">
        <div class="content-container">
          222
        </div>
      </div>
    </el-main>

  </el-container>
  
</template>


<script lang="ts" setup>
import { User, SwitchButton } from '@element-plus/icons-vue'
import { removeToken } from '@/utils/auth'
import { ref } from 'vue'

// 轮播图数据
const carouselImages = ref([
  {
    id: 1,
    url: 'https://anon-soyorin.oss-cn-beijing.aliyuncs.com/147bf300-97ae-4fd2-a927-789f4a7992dd.jpg',
    alt: '广告banner 1'
  },
  {
    id: 2,
    url: 'https://anon-soyorin.oss-cn-beijing.aliyuncs.com/95d0049e-90d3-44b0-99a3-ba3a6def01fc.jpg',
    alt: '广告banner 2'
  },
  {
    id: 3,
    url: 'https://anon-soyorin.oss-cn-beijing.aliyuncs.com/ea6c2440-f145-4b90-b982-338213e94936.png',
    alt: '广告banner 3'
  }
])

/** 登出功能实现 */
function handleLogout() {
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

/* el-main布局容器样式 */
.content-wrapper {
  display: flex;
  justify-content: center;
  /* min-height: calc(100vh - 64px - 40px); 减去头部高度和padding */
}

/* el-container内容容器样式 */
.content-container {
  display: flex;
  gap: 20px; /* 左右区域间距 */
  width: 100%;  /* 在窄屏幕上占满宽度 */
  max-width: 1200px; /* 在宽屏幕上不超过1200px */
}

/**  广告轮播样式 */
.ad-carousel {
  flex-shrink: 0;  /* 防止缩小 */
  width: 750px;
}

/**  轮播图片样式 */
.carousel-image {
  width: 100%;
  height: 310px; 
  object-fit: cover; 
  border-radius: 8px;
}

/**  文章内容区域样式 */
.article-content {
  flex: 1;
  min-height: 310px;
}

/* 响应式处理,当屏幕宽度小于768px时，将广告区域和内容区域进行垂直布局 */
@media (max-width: 768px) {
  .content-container {
    flex-direction: column;
  }
  
  .ad-carousel {
    width: 100%;
  }
  
  .carousel-image {
    width: 100%;
    height: auto;
  }
  .article-content {
    width: 100%;
    min-height: auto;
    margin-top: 20px;
  }
}
</style>

