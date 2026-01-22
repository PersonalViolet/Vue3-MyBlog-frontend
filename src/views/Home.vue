<template>
  <div class="home-container">
    <!-- 页面主体内容 -->
    <div class="main-content">
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
            <!-- 上部浅灰色区域 -->
            <div class="content-header">
              <h3>热门</h3>
            </div>
            <!-- 下部列表区域 - 一行两个，最多两行 -->
            <div class="content-list">
              <el-row :gutter="20">
                <el-col :span="12" v-for="item in 4" :key="item" class="list-item">
                  <el-card class="item-card" shadow="hover">
                    <div class="card-content">
                      <h4>项目 {{ item }}</h4>
                      <p>这是第 {{ item }} 个项目的描述内容</p>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </div>
      <!-- 查询容器 -->
      <div class="content-wrapper">
        <div class="content-container">
          <!-- 新增的按钮容器 -->
          <div class="button-container">
            <el-button 
              v-for="button in buttons" 
              :key="button.id"
              :type="button.type || 'default'"
              @click="handleButtonClick(button)"
              class="category-button"
            >
              {{ button.name }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script lang="ts" setup>
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

/** 查询对应类型博客功能实现 */
// 按钮数据
const buttons = ref([
  { id: 1, name: '全部', type: 'primary' },
  { id: 2, name: '数据结构', type: 'default' },
  { id: 3, name: 'Spring', type: 'default' },
  { id: 4, name: '计算机组成原理', type: 'default' }
])

// 按钮点击事件处理
function handleButtonClick(button: any) {
  // 自定义事件处理逻辑待实现
  console.log('点击了按钮:', button.name)
}
</script>

<style scoped>
.home-container {
  width: 100%;
  min-height: calc(100vh - 64px);
}

.main-content {
  padding: 20px;
}

/* el-main布局容器样式 
  这个容器用来包裹.el-container的内容部分
*/
.content-wrapper {
  display: flex;
  justify-content: center;
  /* min-height: calc(100vh - 64px - 40px); 减去头部高度和padding */
}

/* el-container内容容器样式
   布局容器就用它和.content-wrapper
*/
.content-container {
  display: flex;
  gap: 20px; /* 左右区域间距 */
  width: 80%;  /* 在窄屏幕上占满宽度 */
  max-width: 2000px; /* 在宽屏幕上不超过1200px */
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


/* 内容区域上部样式 */
.content-header {
  width: 100%;
  background-color: #f5f5f5; /* 浅灰色背景 */
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}


/* 内容列表区域样式 */
.content-list {
  width: 100%;
}

/* 内容列表区域的列表项样式 */
.list-item {
  margin-bottom: 10px;
}

/* 列表项卡片样式 */
.item-card {
  height: 120px;
}

/* 卡片内容样式 */
.card-content h4 {
  margin: 0 0 8px 0;
  color: #333;
}

/* 卡片内容样式 */
.card-content p {
  margin: 0;
  color: #666;
  font-size: 14px;
}


/* 按钮容器样式 */
.button-container {
  width: 100%;
  background-color: #f5f5f5;
  padding: 15px 20px;
  border-radius: 15px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

/* 按钮样式 */
.category-button {
  border-radius: 20px;
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

