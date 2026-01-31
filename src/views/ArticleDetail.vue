<template>
  <div class="article-detail-page">
    <div class="page-content">
      <!-- 左侧作者卡片 -->
      <div class="author-sidebar">
        <el-card class="author-card" v-if="authorInfo" shadow="hover">
          <div class="author-header">
            <el-avatar :size="64" :src="authorInfo.avatarUrl || defaultAvatar" class="author-avatar" />
            <h3 class="author-name">{{ authorInfo.username }}</h3>
            <p class="author-intro">{{ authorInfo.intro || '这个人很懒，什么都没写~' }}</p>
          </div>
          
          <div class="author-stats">
            <div class="stat-item">
              <span class="count">{{ authorInfo.articleCount || 0 }}</span>
              <span class="label">文章</span>
            </div>
            <div class="stat-item">
              <span class="count">{{ authorInfo.starCount || 0 }}</span>
              <span class="label">获赞</span>
            </div>
            <div class="stat-item">
              <span class="count">{{ authorInfo.likeCount || 0 }}</span>
              <span class="label">粉丝</span>
            </div>
          </div>

          <div class="author-actions">
            <el-button type="primary" round class="follow-btn" :icon="Plus">关注</el-button>
            <el-button round class="message-btn">私信</el-button>
          </div>
        </el-card>
        
        <!-- 骨架屏 -->
        <el-card v-else class="author-card" shadow="never">
          <el-skeleton animated>
            <template #template>
              <div style="display: flex; flex-direction: column; align-items: center;">
                <el-skeleton-item variant="circle" style="width: 64px; height: 64px; margin-bottom: 12px;" />
                <el-skeleton-item variant="text" style="width: 50%; margin-bottom: 8px;" />
                <el-skeleton-item variant="text" style="width: 80%;" />
              </div>
            </template>
          </el-skeleton>
        </el-card>
      </div>

      <!-- 中间内容区域 (文章 + 评论) -->
      <div class="center-column">
        <div class="article-container" v-loading="loading">
          <template v-if="articleDetail">
            <!-- 文章头部 -->
            <div class="article-header">
              <h1 class="title">{{ articleDetail.article.title }}</h1>
              
              <div class="meta-row">
                <div class="meta-info">
                  <span class="meta-item">
                    <el-icon><View /></el-icon> {{ articleDetail.article.views || 0 }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Star /></el-icon> {{ articleDetail.article.stars || 0 }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Pointer /></el-icon> {{ articleDetail.article.likes || 0 }}
                  </span>
                  <span class="meta-item time" v-if="articleDetail.article.publishedAt">
                    {{ formatDate(articleDetail.article.publishedAt) }}
                  </span>
                </div>

                <!-- Owner 操作区 -->
                <div v-if="articleDetail.isOwner" class="owner-actions">
                  <el-button type="primary" :icon="Edit" circle @click="handleEdit" title="编辑文章" />
                  <el-dropdown @command="handleVisibilityChange">
                    <el-button>
                      {{ articleDetail.article.status === 1 ? '公开' : '私密' }}
                      <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item :command="1">公开</el-dropdown-item>
                        <el-dropdown-item :command="0">仅自己可见</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>

              <div v-if="articleDetail.article.summary" class="summary-box">
                {{ articleDetail.article.summary }}
              </div>
            </div>

            <!-- 文章内容 -->
            <div class="article-content markdown-body" ref="articleContentRef" v-html="renderedContent"></div>
          </template>

          <el-empty v-else-if="!loading" description="文章不存在或已被删除" />
        </div>

        <!-- 评论区 -->
        <div class="comment-container" id="comments" v-if="articleDetail">
          <div class="comment-header-row">
             <h3 class="comment-title">评论</h3>
             <div class="comment-sort">
                <span :class="{ active: sortBy === 'hot' }" @click="handleSortChange('hot')">最热</span>
                <span class="divider">|</span>
                <span :class="{ active: sortBy === 'time' }" @click="handleSortChange('time')">最新</span>
             </div>
          </div>
          
          <div class="comment-list" v-loading="commentLoading && commentsList.length === 0">
             <div v-for="comment in commentsList" :key="comment.id" class="comment-item">
                <el-avatar :size="40" :src="commentUserInfoMap.get(comment.userId)?.avatarUrl || defaultAvatar" class="comment-avatar" />
                <div class="comment-main">
                   <div class="comment-user-info">
                      <span class="username">{{ commentUserInfoMap.get(comment.userId)?.username || '用户' + comment.userId }}</span>
                      <span class="time">{{ formatDate(comment.createTime) }}</span>
                   </div>
                   <div class="comment-content">{{ comment.content }}</div>
                   <div class="comment-actions">
                      <span class="action-item"><el-icon><Pointer /></el-icon> {{ comment.likeCount || 0 }}</span>
                      <span class="action-item"><el-icon><ChatDotRound /></el-icon> {{ comment.replyCount || 0 }}</span>
                   </div>
                   <!-- View More Replies Button -->
                   <div v-if="comment.replyCount > 0" class="view-replies-btn">
                      查看 {{ comment.replyCount }} 条回复 <el-icon><ArrowDown /></el-icon>
                   </div>
                </div>
             </div>
             
             <div v-if="commentsList.length === 0 && !commentLoading" class="no-comments">
                暂无评论，快来抢沙发吧~
             </div>

             <!-- Infinite Scroll Trigger & Loading State -->
             <div class="load-more-comments" ref="loadMoreTriggerRef" v-if="hasMoreComments">
                <div v-if="commentLoading" class="loading-indicator">
                   <el-icon class="is-loading"><Loading /></el-icon> 加载中...
                </div>
                <div v-else class="scroll-trigger"></div>
             </div>
             
             <div v-if="!hasMoreComments && commentsList.length > 0" class="no-more-comments">
               没有更多评论了~
             </div>
          </div>
        </div>
      </div>

      <!-- 右侧目录 (替换原有的占位符) -->
      <div class="toc-sidebar" ref="tocSidebarRef">
        <div 
          class="toc-card" 
          v-if="tocList.length > 0" 
          ref="tocCardRef"
          :class="{ 'is-fixed': isTocFixed }"
          :style="tocCardStyle"
        >
          <div class="toc-header">
            <el-icon><List /></el-icon> 目录
          </div>
          <ul class="toc-list">
            <li 
              v-for="item in tocList" 
              :key="item.id" 
              :class="['toc-item', `toc-level-${item.level}`, { active: activeHeading === item.id }]"
              @click.stop="scrollToHeading(item.id)"
            >
              <span class="toc-text" :title="item.text">{{ item.text }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 移动端目录悬浮按钮 -->
    <div class="mobile-toc-btn" v-if="tocList.length > 0" @click="drawerVisible = true">
      <el-icon><List /></el-icon>
    </div>

    <!-- 移动端目录抽屉 -->
    <el-drawer v-model="drawerVisible" title="文章目录" direction="rtl" size="70%" :with-header="true">
      <ul class="toc-list mobile-toc-list">
        <li 
          v-for="item in tocList" 
          :key="item.id" 
          :class="['toc-item', `toc-level-${item.level}`, { active: activeHeading === item.id }]"
          @click="handleMobileTocClick(item.id)"
        >
          <span class="toc-text">{{ item.text }}</span>
        </li>
      </ul>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick, onUnmounted, watch, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { View, Star, Pointer, Edit, ArrowDown, Plus, List, ChatDotRound, Timer, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { getArticleDetail, updateArticleStatus, incrementArticleViews, type ArticleDetailVO } from '@/api/article/userArticleApi'
import { getArticleComments, getArticleCommentsByTime, type CommentVO, type GetCommentsParams, type GetCommentsByTimeParams } from '@/api/comment/CommentApi'
import { getUserProfile, type UserProfileVO } from '@/api/user/UserProfileApi'
import { formatDate } from '@/utils/format-date'
import defaultAvatar from '@/assets/icons/defaultAvatar.svg'
import { throttle } from 'lodash' // 假设项目中有 lodash，如果没有可以使用简易防抖

const route = useRoute()
const router = useRouter()
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

const loading = ref(false)
const articleDetail = ref<ArticleDetailVO | null>(null)
const authorInfo = ref<UserProfileVO | null>(null)
const articleContentRef = ref<HTMLElement | null>(null)

// 评论相关
const commentsList = ref<CommentVO[]>([])
const commentLoading = ref(false)
// 使用 union type 来适应不同接口的 cursor 结构
const commentCursor = ref<{ likeCount?: number, createTime?: number, id?: number } | undefined>(undefined)
const hasMoreComments = ref(true)
const commentUserInfoMap = reactive<Map<number, UserProfileVO>>(new Map())
const sortBy = ref<'hot' | 'time'>('hot')
const loadMoreTriggerRef = ref<HTMLElement | null>(null) // 底部加载触发器

// 获取评论列表
async function fetchComments(isLoadMore = false) {
  if (!articleId) return
  if (commentLoading.value) return
  
  commentLoading.value = true
  try {
    let res;
    if (sortBy.value === 'hot') {
      const params: GetCommentsParams = {
        limit: 5,
        likeCount: commentCursor.value?.likeCount,
        createTime: commentCursor.value?.createTime,
        id: commentCursor.value?.id
      }
      res = await getArticleComments(articleId, params)
    } else {
      const params: GetCommentsByTimeParams = {
        limit: 5,
        createTime: commentCursor.value?.createTime,
        id: commentCursor.value?.id
      }
      res = await getArticleCommentsByTime(articleId, params)
    }
    
    if (res.comments && res.comments.length > 0) {
      if (isLoadMore) {
        commentsList.value.push(...res.comments)
      } else {
        commentsList.value = res.comments
      }
      
      // 更新 cursor
      // 根据接口文档，hot 返回 likeCount, createTime, id
      // time 返回 createTime, id
      if (res.id !== null) {
        // 转换 createTime 为时间戳 (number)
        let createTimeTimestamp: number | undefined = undefined
        if (res.createTime) {
          createTimeTimestamp = new Date(res.createTime).getTime()
        }
        console.log('likeCount', res.likeCount)
        commentCursor.value = {
          id: res.id,
          createTime: createTimeTimestamp, 
          // likeCount为0时赋值为0，有值时为值，其他情况为undefined
          likeCount: res.likeCount || (res.likeCount === 0 ? 0 : undefined)
        }
        console.log('commentCursor:', commentCursor.value)
        hasMoreComments.value = true
      } else {
        hasMoreComments.value = false
      }

      // 获取评论用户的信息
      const userIds = new Set(res.comments.map(c => c.userId))
      userIds.forEach(uid => {
        if (!commentUserInfoMap.has(uid)) {
          getUserProfile(uid).then(userProfile => {
            commentUserInfoMap.set(uid, userProfile)
          }).catch(err => {
             console.warn(`Failed to fetch user info for ${uid}`, err)
          })
        }
      })
    } else {
      if (!isLoadMore) {
        commentsList.value = []
      }
      hasMoreComments.value = false
    }
  } catch (error: any) {
    console.error('Failed to fetch comments:', error)
    ElMessage.error('获取评论失败')
  } finally {
    commentLoading.value = false
  }
}

function handleSortChange(type: 'hot' | 'time') {
  if (sortBy.value === type) return
  sortBy.value = type
  // 重置状态
  commentsList.value = []
  commentCursor.value = undefined
  hasMoreComments.value = true
  
  fetchComments()
}

// 自动加载更多 (Infinite Scroll)
let observer: IntersectionObserver | null = null

onMounted(() => {
  fetchArticleDetail()
  incrementViews()
  fetchComments()
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', handleResize)

  // 初始化 IntersectionObserver
  observer = new IntersectionObserver((entries) => {
    const firstEntry = entries[0]
    if (firstEntry && firstEntry.isIntersecting && hasMoreComments.value && !commentLoading.value) {
      fetchComments(true)
    }
  }, {
    rootMargin: '100px' // 提前 100px 触发
  })
})

// 监听 loadMoreTriggerRef 的变化，因为 v-if 的原因，它可能还没渲染
watch(loadMoreTriggerRef, (el) => {
  if (el && observer) {
    observer.observe(el)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
  if (observer) {
    observer.disconnect()
  }
})
interface TocItem {
  id: string
  text: string
  level: number
}
const tocList = ref<TocItem[]>([])
const activeHeading = ref('')
const drawerVisible = ref(false)

// 目录吸顶相关
const tocSidebarRef = ref<HTMLElement | null>(null)
const tocCardRef = ref<HTMLElement | null>(null)
const isTocFixed = ref(false)
const tocCardStyle = reactive({
  width: '',
  left: '',
  top: '84px' // Header height + spacing
})

const userId = Number(route.params.userId)
const articleId = Number(route.params.articleId)


// 获取文章详情
async function fetchArticleDetail() {
  if (!userId || !articleId) return
  
  loading.value = true
  try {
    const [articleRes, userRes] = await Promise.all([
      getArticleDetail(userId, articleId),
      getUserProfile(userId)
    ])
    
    articleDetail.value = articleRes
    authorInfo.value = userRes
    
    // 文章加载完成后生成目录
    nextTick(() => {
      generateToc()
    })
  
  } catch (error: any) {
    console.error('Failed to fetch data:', error)
    ElMessage.error(error.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

async function incrementViews() {
  if (!articleId) return
  try{
    incrementArticleViews(articleId)
  } catch (error: any){
    console.error('Failed to increment views', error)
  }
}

// 生成目录
function generateToc() {
  if (!articleContentRef.value) return
  
  const headings = articleContentRef.value.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const list: TocItem[] = []
  
  headings.forEach((heading, index) => {
    const id = `heading-${index}`
    heading.id = id // 为标题添加 ID
    list.push({
      id,
      text: heading.textContent || '',
      level: parseInt(heading.tagName.substring(1))
    })
  })
  
  tocList.value = list
}

// 平滑滚动
function scrollToHeading(id: string) {
  const element = document.getElementById(id)
  if (element) {
    // 头部高度偏移量 (Header + Padding)
    const offset = 100 
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - offset
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
    
    // 手动设置 active，提升响应速度
    activeHeading.value = id
  }
}

function handleMobileTocClick(id: string) {
  scrollToHeading(id)
  drawerVisible.value = false
}

// 滚动监听 (Scroll Spy & Sticky TOC)
 const handleScroll = throttle(() => {
   // --- Sticky TOC Logic ---
   if (tocSidebarRef.value) {
     const rect = tocSidebarRef.value.getBoundingClientRect()
     // 84px 是我们预期的吸顶位置 (Header高度 + 间距)
     // 当容器顶部触达或越过这个位置时，开始固定
     if (rect.top <= 84) {
       if (!isTocFixed.value) {
         isTocFixed.value = true
         // 固定时，需要继承容器的宽度和左边距
         tocCardStyle.width = `${rect.width}px`
         tocCardStyle.left = `${rect.left}px`
       }
     } else {
       if (isTocFixed.value) {
         isTocFixed.value = false
         tocCardStyle.width = ''
         tocCardStyle.left = ''
       }
     }
   }

   if (tocList.value.length === 0) return
   
   // --- Scroll Spy Logic ---
   // 1. 检查是否滚动到底部
   const scrollHeight = document.documentElement.scrollHeight
   const scrollTop = window.scrollY
   const clientHeight = document.documentElement.clientHeight
   
   if (scrollTop + clientHeight >= scrollHeight - 50) { // 接近底部 50px
     activeHeading.value = tocList.value[tocList.value.length - 1]!.id
     return
   }

   const scrollPosition = scrollTop + 120 // 加上偏移量，提前高亮
   
   // 2. 倒序查找，找到第一个在视口上方的标题
   for (let i = tocList.value.length - 1; i >= 0; i--) {
     const item = tocList.value[i]!
     const element = document.getElementById(item.id)
     if (element && element.offsetTop <= scrollPosition) {
       activeHeading.value = item.id
       return
     }
   }
   
   // 3. 如果都在下方，默认选中第一个
   if (tocList.value.length > 0 && scrollTop < 100) {
     activeHeading.value = tocList.value[0]!.id
   }
 }, 100)
 
 // 监听窗口大小变化，更新 Fixed 状态下的位置
 const handleResize = throttle(() => {
   if (isTocFixed.value && tocSidebarRef.value) {
     const rect = tocSidebarRef.value.getBoundingClientRect()
     tocCardStyle.width = `${rect.width}px`
     tocCardStyle.left = `${rect.left}px`
   }
 }, 100)

// 渲染 Markdown 内容
const renderedContent = computed(() => {
  if (!articleDetail.value) return ''
  
   const { article, articleBlockVO } = articleDetail.value
  
  // 如果不是 blocks 格式，直接渲染 content (假设有 content 字段，虽然接口没返回 content 字段，但通常会有)
  // 根据接口定义，这里只处理 blocks 格式
  if (article.contentFormat !== 'blocks' || !articleBlockVO) {
    return ''
  }

  let markdown = ''
  
  // 先按 seq 排序，确保顺序正确
  const sortedBlocks = [...articleBlockVO].sort((a, b) => a.seq - b.seq)

  // 注意：这里我们不把 Title 和 Summary 加到 markdown 中，因为已经在头部展示了
  // 保持与 ArticleEditor.vue 的逻辑一致，将 blocks 转换为 markdown
  sortedBlocks.forEach(block => {
    switch (block.blockType) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        const level = parseInt(block.blockType.substring(1))
        const hashes = '#'.repeat(level)
        markdown += `${hashes} ${block.text || ''}\n\n`
        break
      case 'paragraph':
        markdown += `${block.text || ''}\n\n`
        break
      case 'blockquote':
        markdown += `> ${block.text || ''}\n\n`
        break
      case 'code_block':
        markdown += `\`\`\`\n${block.text || ''}\n\`\`\`\n\n`
        break
      case 'image':
        if (block.url) {
          markdown += `![Image](${block.url})\n\n`
        } else {
          markdown += `*[图片占位]*\n\n`
        }
        break
      default:
        markdown += `${block.text || ''}\n\n`
    }
  })
  
  return md.render(markdown)
})

// 操作处理
function handleEdit() {
  // 跳转到编辑器，传递文章 ID
  router.push(`/editor?id=${articleId}`)
}

async function handleVisibilityChange(command: number) {
  // TODO: 调用 API 更新文章可见性
  if (articleDetail.value && articleDetail.value.article) {
    articleDetail.value.article.status = command
    try {
      await updateArticleStatus(userId, articleId, command)
      ElMessage.success(`已切换为${command === 1 ? '公开' : '仅自己可见'}`)
    } catch (error: any) {
      console.error('Failed to update article status:', error)
      ElMessage.error(error.message || '更新文章状态失败')
    }
  }
}

onMounted(() => {
  fetchArticleDetail()
  incrementViews()
  fetchComments()
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.article-detail-page {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
  min-height: calc(100vh - 64px);
  background-color: #f9fafb;
}

.page-content {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 280px; /* 三栏布局：Sidebar | Article | TOC */
  gap: 24px;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  align-items: start; /* 确保 Grid Item 顶部对齐 */
}

.author-sidebar {
  width: 100%; /* 占满 Grid 列宽 */
  position: sticky;
  top: 84px; /* Header高度 + 间距 */
}

.toc-sidebar {
  width: 100%;
  /* position: sticky; */ /* 移除 CSS sticky，由 JS 接管 */
  /* top: 84px; */
  min-height: 200px; /* 确保有最小高度，防止布局塌陷 */
}

/* ... */


.toc-card {
  background: transparent;
  border-radius: 8px;
  padding: 16px 20px;
  border-left: 1px solid #f0f0f0; 
  box-shadow: none; 
  transition: box-shadow 0.3s, background-color 0.3s; /* 添加平滑过渡 */
  
  /* 恢复滚动条功能 */
  max-height: calc(100vh - 100px); /* 限制最大高度，确保在可视区域内 */
  overflow-y: auto; /* 超出高度时显示滚动条 */
  
  /* 滚动条样式优化 */
  scrollbar-width: thin;
  scrollbar-color: #e0e0e0 transparent;
}

/* Webkit 浏览器滚动条样式 */
.toc-card::-webkit-scrollbar {
  width: 4px;
}
.toc-card::-webkit-scrollbar-thumb {
  background: #e0e0e0;
  border-radius: 2px;
}
.toc-card::-webkit-scrollbar-track {
  background: transparent;
}

/* 吸顶状态样式 */
.toc-card.is-fixed {
  position: fixed; /* 用户要求的 fixed */
  z-index: 10;
  background-color: #fff; /* 吸顶时显示背景色 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); /* 吸顶时显示阴影 */
  border-left: none; /* 吸顶时移除左侧线，或者保留看设计需求，这里移除以减少视觉噪音 */
  border-radius: 8px;
  /* 继承基础样式中的 max-height 和 overflow-y，确保吸顶时也能滚动 */
}

/* 适配 is-fixed 下的内部样式 */
.toc-card.is-fixed .toc-list::before {
  /* 在 fixed 状态下，可能需要调整轨道线的位置或颜色 */
  background-color: #f5f5f5;
}

/* 如果还是想要卡片风格，可以恢复上面的样式，这里我按照“侧边栏”风格优化 */
.toc-header {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 12px;
  padding-bottom: 0;
  border-bottom: none;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
  position: relative;
}

/* 添加左侧轨道线 */
.toc-list::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 2px;
  background-color: #f0f0f0;
}

.toc-item {
  padding: 8px 0 8px 16px; /* 左侧留出空间给轨道线 */
  cursor: pointer;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  border-left: 2px solid transparent; /* 预留边框位置，与轨道线重叠 */
  margin-left: -2px; /* 向左偏移，覆盖轨道线 */
}

.toc-item:hover {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.05); /* 轻微背景色 */
}

.toc-item.active {
  color: #409eff;
  font-weight: 600;
  border-left-color: #409eff; /* 高亮左侧边框 */
  background-color: rgba(64, 158, 255, 0.1);
}

/* 移除之前的伪元素指示条，改用 border-left */
.toc-item.active::before {
  display: none;
}

.toc-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 层级缩进 - 增加缩进感 */
.toc-level-1 { padding-left: 16px; font-weight: 600; }
.toc-level-2 { padding-left: 16px; }
.toc-level-3 { padding-left: 32px; font-size: 13px; }
.toc-level-4 { padding-left: 48px; font-size: 13px; }
.toc-level-5 { padding-left: 56px; font-size: 12px; }
.toc-level-6 { padding-left: 64px; font-size: 12px; }

.article-container {
  width: 100%;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 40px;
  box-sizing: border-box;
}

.author-card {
  border-radius: 8px;
  background: #fff;
}

.author-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 20px;
}

.author-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 12px;
}

.author-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
}

.author-intro {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.author-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-item .count {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.stat-item .label {
  font-size: 12px;
  color: #999;
}

.author-actions {
  display: flex;
  gap: 12px;
}

.author-actions .el-button {
  flex: 1;
}

/* 移动端悬浮按钮 */
.mobile-toc-btn {
  display: none;
  position: fixed;
  right: 20px;
  bottom: 80px;
  width: 48px;
  height: 48px;
  background-color: #fff;
  border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: #333;
  cursor: pointer;
  z-index: 99;
  transition: transform 0.2s;
}

.mobile-toc-btn:active {
  transform: scale(0.95);
}

/* 响应式适配 */
@media (max-width: 1100px) {
  .page-content {
    display: flex;
    flex-direction: column-reverse;
    gap: 24px;
    align-items: center; /* 确保单栏模式下内容居中 */
  }

  .author-sidebar {
    width: 100%;
    max-width: 800px; /* 限制卡片最大宽度与文章一致 */
    position: static; /* 取消 Sticky */
    top: auto;
  }

  .article-container {
    width: 100%;
    max-width: 800px; /* 限制文章最大宽度 */
  }

  .toc-sidebar {
    display: none; /* 中小屏隐藏右侧目录 */
  }

  .mobile-toc-btn {
    display: flex; /* 显示移动端悬浮按钮 */
  }
}

@media (max-width: 768px) {
  .article-detail-page {
    padding: 20px 16px;
  }

  .article-container {
    padding: 24px 16px;
  }
}

.article-header {
  margin-bottom: 40px;
  border-bottom: 1px solid #eaeaea;
  padding-bottom: 20px;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: #333;
  margin: 0 0 20px;
  line-height: 1.4;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 20px;
  color: #999;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.owner-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.summary-box {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
  border-left: 4px solid #e0e0e0;
}

.article-content {
  line-height: 1.8;
  color: #2c3e50;
}

/* 简单的 Markdown 样式适配 (可以引入 github-markdown-css 等库) */
:deep(img) {
  max-width: 100%;
  border-radius: 4px;
}

:deep(pre) {
  background-color: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}

:deep(blockquote) {
  margin: 0;
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
}

:deep(h1), :deep(h2), :deep(h3) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

:deep(p) {
  margin-bottom: 16px;
}
/* Center Column Wrapper */
.center-column {
  width: 100%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Comment Section Styles */
.comment-container {
  background: #fff;
  border-radius: 8px;
  padding: 32px 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.comment-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.comment-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.comment-sort {
  font-size: 14px;
  color: #999;
}

.comment-sort span {
  cursor: pointer;
  transition: color 0.2s;
  padding: 4px 8px; /* 增加点击区域 */
  border-radius: 4px;
}

.comment-sort span.active {
  color: #409eff; /* 浅蓝色高亮 */
  font-weight: 600;
  background-color: rgba(64, 158, 255, 0.1); /* 可选：增加淡淡的背景色增强状态 */
}

.comment-sort span:hover {
  color: #409eff; /* 悬浮时变浅蓝色 */
}

.comment-sort .divider {
  margin: 0 4px;
  color: #eee;
  cursor: default;
  padding: 0;
}

.comment-sort .divider:hover {
  color: #eee; /* 分隔符不需要变色 */
}

.comment-item {
  display: flex;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid #f9f9f9;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-main {
  flex: 1;
}

.comment-user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-user-info .username {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.comment-user-info .time {
  font-size: 12px;
  color: #999;
}

.comment-content {
  font-size: 14px;
  color: #4a4a4a;
  line-height: 1.6;
  margin-bottom: 12px;
}

.comment-actions {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #999;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: color 0.2s;
}

.action-item:hover {
  color: #409eff;
}

.view-replies-btn {
  margin-top: 12px;
  font-size: 13px;
  color: #409eff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f0f7ff;
  padding: 8px 12px;
  border-radius: 4px;
  width: fit-content;
}

.view-replies-btn:hover {
  background: #e1efff;
}

.no-comments {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

.load-more-comments {
  text-align: center;
  margin-top: 24px;
  min-height: 40px; /* 确保有高度供 IntersectionObserver 监听 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.scroll-trigger {
  width: 100%;
  height: 20px;
}

.no-more-comments {
  text-align: center;
  padding: 24px 0;
  color: #ccc;
  font-size: 13px;
}

@media (max-width: 768px) {
  .comment-container {
    padding: 24px 16px;
  }
}
</style>