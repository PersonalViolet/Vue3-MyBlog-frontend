<template>
  <div class="comment-component" ref="commentContainer">
    <!-- Header: Title & Sort -->
    <div class="comment-header-row">
      <h3 class="comment-title">评论</h3>
      <div class="comment-sort">
        <span 
          :class="{ active: sortBy === 'hot' }" 
          @click="handleSortChange('hot')"
        >最热</span>
        <span class="divider">|</span>
        <span 
          :class="{ active: sortBy === 'time' }" 
          @click="handleSortChange('time')"
        >最新</span>
      </div>
    </div>

    <!-- Root Comment Input -->
    <div class="comment-input-wrapper">
      <CommentInput 
        :article-id="articleId" 
        :parent-id="null" 
        :root-id="null"
        @success="handleRootSubmitSuccess"
      />
    </div>

    <!-- Loading / Skeleton State -->
    <div v-if="initialLoading" class="skeleton-wrapper">
      <el-skeleton :rows="3" animated />
      <el-skeleton :rows="3" animated style="margin-top: 20px" />
    </div>

    <!-- Comment List -->
    <div v-else class="comment-list">
      <CommentItem 
        v-for="comment in commentsTree" 
        :key="comment.id" 
        :comment="comment" 
        :article-id="articleId"
      />

      <!-- No Comments State -->
      <div v-if="commentsTree.length === 0 && !loading" class="no-comments">
        暂无评论，快来抢沙发吧~
      </div>

      <!-- Load More Trigger -->
      <div 
        v-if="hasMore" 
        class="load-more-trigger" 
        ref="loadMoreTrigger"
      >
        <div v-if="loading" class="loading-indicator">
          <el-icon class="is-loading"><Loading /></el-icon> 加载中...
        </div>
      </div>
      
      <div v-if="!hasMore && commentsTree.length > 0" class="no-more-comments">
        没有更多评论了~
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, watch, nextTick, provide } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { 
  getArticleComments, 
  getArticleCommentsByTime, 
  createInserter,
  type CommentVO, 
  type GetCommentsParams, 
  type GetCommentsByTimeParams 
} from '@/api/comment/CommentApi'
import { getUserProfile } from '@/api/user/UserProfileApi'
import CommentInput from '@/components/CommentInput.vue'
import CommentItem from '@/components/CommentItem.vue'

defineOptions({
  name: 'Comment'
})

const props = defineProps<{
  articleId: number
}>()

// State
const sortBy = ref<'hot' | 'time'>('hot')
const commentsTree = ref<CommentVO[]>([])
const insertOrClean = createInserter(commentsTree)
// Provide insert function to descendants
provide('insertOrCleanComment', insertOrClean)

watch(() => commentsTree.value, () => {
  console.log('评论树源已更新')
})

const loading = ref(false)
const initialLoading = ref(false)
const hasMore = ref(true)
const cursor = ref<{ likeCount?: number, createTime?: number, id?: number } | undefined>(undefined)

// Refs
const commentContainer = ref<HTMLElement | null>(null)
const loadMoreTrigger = ref<HTMLElement | null>(null)

// Observers & Controllers
let observer: IntersectionObserver | null = null
let abortController: AbortController | null = null

// Methods
function handleSortChange(type: 'hot' | 'time') {
  if (sortBy.value === type) return
  sortBy.value = type
  resetAndFetch()
}

function resetAndFetch() {
  // Cancel pending requests
  if (abortController) {
    abortController.abort()
  }
  
  insertOrClean(undefined, undefined, true) // Clean tree
  cursor.value = undefined
  hasMore.value = true
  fetchRootComments(true)
}

async function fetchRootComments(isInitial = false) {
  if (loading.value || !hasMore.value) return
  
  loading.value = true
  if (isInitial) initialLoading.value = true
  
  abortController = new AbortController()
  
  try {
    let res
    if (sortBy.value === 'hot') {
      const params: GetCommentsParams = {
        limit: 5,
        likeCount: cursor.value?.likeCount,
        createTime: cursor.value?.createTime,
        id: cursor.value?.id
      }
      console.log(params)
      res = await getArticleComments(props.articleId, params)
    } else {
      const params: GetCommentsByTimeParams = {
        limit: 5,
        createTime: cursor.value?.createTime,
        id: cursor.value?.id
      }
      console.log(params)
      res = await getArticleCommentsByTime(props.articleId, params)
    }

    if (res.comments && res.comments.length > 0) {
      // Use inserter to add comments to the tree
      res.comments.forEach(c => insertOrClean(c))
      
      // Update cursor
      if (res.id !== null) {
        let createTimeTimestamp: number | undefined = undefined
        if (res.createTime) {
          createTimeTimestamp = new Date(res.createTime).getTime()
        }
        cursor.value = {
          id: res.id,
          createTime: createTimeTimestamp,
          likeCount: res.likeCount || (res.likeCount === 0 ? 0 : undefined)
        }
        hasMore.value = true
      } else {
        hasMore.value = false
      }
    } else {
      hasMore.value = false
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Failed to fetch root comments:', error)
      ElMessage.error('获取评论失败')
    }
  } finally {
    loading.value = false
    initialLoading.value = false
    abortController = null
  }
}

async function handleRootSubmitSuccess(newComment: CommentVO) {
  // Prepend to list
  newComment.userProfileVO = await getUserProfile(newComment.userId)  // 获取用户信息以显示头像和用户名
  insertOrClean(newComment, undefined, false, true)
}

let timer: number | null = null
onMounted(() => {
  // Intersection Observer for Lazy Load of the Component / First Page
  observer = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry && entry.isIntersecting) {
      // If we haven't loaded anything yet, load first page
      if (commentsTree.value.length === 0 && hasMore.value && !loading.value) {
        fetchRootComments(true)
      }
      // Or if we have data and hit the bottom trigger
      else if (entry.target === loadMoreTrigger.value && hasMore.value && !loading.value) {
        fetchRootComments()
      }
    }
  }, {
    rootMargin: '200px'
  })

  if (commentContainer.value) {
    observer.observe(commentContainer.value)
  }
})

// Watch for loadMoreTrigger rendering
watch(() => loadMoreTrigger.value, (el) => {
  if (el && observer) {
    observer.observe(el)
  }
})

// Cleanup
onUnmounted(() => {
  if (observer) observer.disconnect()
  if (abortController) abortController.abort()
})
</script>

<style scoped>
.comment-component {
  background: #fff;
  border-radius: 8px;
  padding: 32px 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-height: 200px;
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
  padding: 4px 8px;
  border-radius: 4px;
}

.comment-sort span.active {
  color: #409eff;
  font-weight: 600;
  background-color: rgba(64, 158, 255, 0.1);
}

.comment-sort span:hover {
  color: #409eff;
}

.comment-sort .divider {
  margin: 0 4px;
  color: #eee;
  cursor: default;
}

.comment-input-wrapper {
  margin-bottom: 24px;
}

.no-comments {
  text-align: center;
  padding: 40px 0;
  color: #999;
  font-size: 14px;
}

.load-more-trigger {
  height: 20px;
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #999;
  font-size: 14px;
}

.no-more-comments {
  text-align: center;
  padding: 24px 0;
  color: #ccc;
  font-size: 13px;
}

.skeleton-wrapper {
  padding: 20px 0;
}

@media (max-width: 768px) {
  .comment-component {
    padding: 24px 16px;
  }
}
</style>