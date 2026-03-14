<template>
  <div class="comment-item">
    <div class="comment-content-wrapper">
      <!-- User Avatar with Hover Card -->
      <UserHoverCard 
        :user-id="comment.userId" 
        :initial-user-info="comment.userProfileVO"
      >
        <el-avatar 
          :size="40" 
          :src="comment.userProfileVO?.avatarUrl || defaultAvatar" 
          class="comment-avatar" 
        />
      </UserHoverCard>
      
      <div class="comment-main">
        <!-- User Info & Time -->
        <div class="comment-user-info">
          <span class="username">{{ comment.userProfileVO?.username || '用户' + comment.userId }}</span>
          <span class="time">{{ formatDate(comment.createTime) }}</span>
        </div>
        
        <!-- Comment Content -->
        <div class="comment-text">{{ comment.content }}</div>
        
        <!-- Actions: Like & Reply -->
        <div class="comment-actions">
          <span 
            class="action-item" 
            :class="{ liked: voteType === 1 }" 
            @click="handleVote(1)"
          >
            <el-icon><LikeIcon /></el-icon> {{ comment.likeCount || 0 }}
          </span>
          <span
            class="action-item"
            :class="{ disliked: voteType === -1 }"
            @click="handleVote(-1)"
          >
            <el-icon><Bottom /></el-icon> {{ comment.dislikeCount || 0 }}
          </span>
          <span class="action-item" @click="toggleReplyBox">
            <el-icon><ChatDotRound /></el-icon> {{ comment.replyCount || 0 }}
          </span>
        </div>
        
        <!-- Reply Input -->
        <div v-if="showReplyInput" class="reply-input-wrapper">
          <CommentInput 
            :article-id="articleId" 
            :parent-id="comment.id" 
            :root-id="comment.rootId || comment.id" 
            :target-comment="comment"
            @success="handleReplySuccess"
          />
        </div>

        <!-- 查看更多回复 (未点击时) -->
        <div v-if="hasRepliesToLoad" class="view-replies-section">
          <div v-if="!repliesExpanded && !loadingReplies" class="view-replies-btn" @click="expandReplies">
            共 {{ comment.replyCount - (comment.children?.length || 0) }} 条回复 <el-icon><ArrowDown /></el-icon>
          </div>
          
          <div v-if="loadingReplies" class="loading-replies">
             <el-icon class="is-loading"><Loading /></el-icon> 加载中...
          </div>
        </div>

        <!-- Recursive Children -->
        <div v-if="comment.children && comment.children.length > 0" class="sub-comments-list">
           <CommentItem 
             v-for="child in comment.children" 
             :key="child.id" 
             :comment="child"
             :article-id="articleId"
             @reply-success="onChildReplySuccess"
           />
           
           <!-- Load More Button for Children -->
           <div v-if="hasMoreReplies && repliesExpanded && !loadingReplies" class="load-more-replies-btn" @click="fetchReplies">
             查看更多回复 <el-icon><ArrowDown /></el-icon>
           </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, provide, watch } from 'vue'
import { ChatDotRound, ArrowDown, Loading, Bottom } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import LikeIcon from '@/components/LikeIcon.vue'
import CommentInput from '@/components/CommentInput.vue'
import UserHoverCard from '@/components/UserHoverCard.vue'
// Explicitly import for recursion safety in some environments
import CommentItem from './CommentItem.vue'
import defaultAvatar from '@/assets/icons/defaultAvatar.svg'
import { formatDate } from '@/utils/format-date'
import { getCommentReplies, isLevel2Comment, isRootComment, voteComment, type CommentVO, type CommentVoteType, type GetCommentRepliesParams } from '@/api/comment/CommentApi'
// import { getUserProfile } from '@/api/user/UserProfileApi'
import { getCurrentInstance } from 'vue'
import { isRef, isReactive } from 'vue'
import { getUserProfile } from '@/api/user/UserProfileApi'


defineOptions({
  name: 'CommentItem'
})

const props = defineProps<{
  comment: CommentVO
  articleId: number
}>()
const emit = defineEmits<{
  (e: 'reply-success', newComment: CommentVO): void
}>()

// Inject insert function
const insertOrCleanComment = inject<(node: CommentVO, commentId?: number, isClean?: boolean, isPost?: boolean) => boolean>('insertOrCleanComment')
const toggleLevel2ShowReplyInput = inject<() => void>('toggleLevel2ShowReplyInput')   // TODO: 临时解决，以后优化
// State
const showComments = ref(true)
const showReplyInput = ref(false)

function normalizeVoteType(value?: number | null): CommentVoteType {
  if (value === 1) return 1
  if (value === -1) return -1
  return 0
}

const voteType = ref<CommentVoteType>(normalizeVoteType(props.comment.currentUserVote)) // 1 点赞 | -1 拉踩 | 0 无状态
const voting = ref(false)
const repliesExpanded = ref(false)  // 检查子评论是否展开
const loadingReplies = ref(false)
const hasMoreReplies = ref(true)
const replyCursor = ref<{ likeCount?: number, createTime?: number, id?: number } | undefined>(undefined)  // 游标

watch(
  () => props.comment.currentUserVote,
  (nextVote) => {
    voteType.value = normalizeVoteType(nextVote)
  }
)

// TODO: 发表评论触发修改数据后没能响应式更新，不知道为什么，决定临时解决方案如下
if (isLevel2Comment(props.comment)) {
  // 当前组件为二级评论,给三级评论组件提供一个方法
  provide('toggleLevel2ShowReplyInput', () => {
    showReplyInput.value = showReplyInput.value ? false : true
  })
}
// 计算逻辑，用于判断是否还有更多回复
const hasRepliesToLoad = computed(() => {
  if (props.comment.parentId !== undefined && props.comment.rootId !== undefined &&props.comment.parentId !== props.comment.rootId) return false; // 三级评论不显示查看更多回复
  return (props.comment.replyCount > 0 && (!props.comment.children || props.comment.children.length === 0))
})

// Actions
function toggleReplyBox() {
  showReplyInput.value = !showReplyInput.value
}

function applyVoteState(prev: CommentVoteType, next: CommentVoteType) {
  let likeCount = Number(props.comment.likeCount ?? 0)
  let dislikeCount = Number(props.comment.dislikeCount ?? 0)

  if (prev === 1) likeCount = Math.max(likeCount - 1, 0)
  if (prev === -1) dislikeCount = Math.max(dislikeCount - 1, 0)

  if (next === 1) likeCount += 1
  if (next === -1) dislikeCount += 1

  props.comment.likeCount = likeCount
  props.comment.dislikeCount = dislikeCount
  props.comment.currentUserVote = next
  voteType.value = next
}

function resolveNextVoteType(target: Exclude<CommentVoteType, 0>): CommentVoteType {
  if (target === 1) {
    return voteType.value === 1 ? 0 : 1
  }

  return voteType.value === -1 ? 0 : -1
}

async function handleVote(target: Exclude<CommentVoteType, 0>) {
  if (voting.value) return

  const prev = voteType.value
  const next = resolveNextVoteType(target)
  applyVoteState(prev, next)
  voting.value = true

  try {
    await voteComment(props.comment.id, next)
  } catch (error) {
    applyVoteState(next, prev)
    console.error('Vote failed:', error)
    ElMessage.error('操作失败，请稍后重试')
  } finally {
    voting.value = false
  }
}

// 该用户回复评论成功后的处理
async function handleReplySuccess(newComment: CommentVO) {
  console.log('FUUUUUUUUUUUUUUUUUUUUUUUUUUUUUCKhandleReplySuccess')
  showReplyInput.value = false
  newComment.userProfileVO = await getUserProfile(newComment.userId)  // 获取用户信息以显示头像和用户名
  // If insertComment is available, use it.
  if (insertOrCleanComment) {
    let inserted = false
    if (newComment.parentId !== null && newComment.rootId !== null && newComment.rootId !== newComment.parentId) {
      // 3级及以上的评论
      console.log('wodjawiogjwaofjaw')
      inserted = insertOrCleanComment(newComment, props.comment.id, false, true)
      // TODO 临时解决方案，笑死我了加个这函数就神奇的解决了触发不了响应式更新渲染三级评论组件的问题。也是造了个屎山，维护的评论树冗余的一批，以后再改成class来维护了，就先这样了
      if (toggleLevel2ShowReplyInput !== undefined) {
        toggleLevel2ShowReplyInput()
        toggleLevel2ShowReplyInput()
       }
    } else {
      // 二级及以下的评论
      inserted = insertOrCleanComment(newComment, undefined, false, true)
    }
    if (inserted) {
       props.comment.replyCount++
       emit('reply-success', newComment)
    }
    console.log('children -> ', props.comment.children)
  } else {
    // 无法使用insertComment函数时
     if (!props.comment.children) props.comment.children = []
     props.comment.children.unshift(newComment)
     props.comment.replyCount++
  }
}

function onChildReplySuccess(newComment: CommentVO) {
  console.log('OOOOOOOOOOOOOOOOOOOOOOOOOOOOKKKKKKKKKKKKKKKKKKKKKK')
}

async function expandReplies() {
  repliesExpanded.value = true
  await fetchReplies()
}

async function fetchReplies() {
  if (loadingReplies.value) return
  loadingReplies.value = true
  
  try {
    const params: GetCommentRepliesParams = {
      id: props.comment.id,
      articleId: props.articleId,
      limit: 5,
      lastLikeCount: replyCursor.value?.likeCount,
      lastCreateTime: replyCursor.value?.createTime,
      lastId: replyCursor.value?.id,
      parentId: props.comment.parentId,
      rootId: props.comment.rootId
    }
    
    const res = await getCommentReplies(props.articleId, params)
    
    if (res.comments && res.comments.length > 0) {
      // Use insertComment to add to tree
      if (insertOrCleanComment) {
        res.comments.forEach((c: CommentVO) => {
           if (c.parentId !== null && c.rootId !== null && c.rootId !== c.parentId) {
            insertOrCleanComment(c, props.comment.id, false, true) // Flatten Level 3 under Level 2
           }else {
            insertOrCleanComment(c)
           }
        })
      }
      
      // Update cursor
      if (res.id !== null) {
        let createTimeTimestamp: number | undefined = undefined
        if (res.createTime) {
          createTimeTimestamp = new Date(res.createTime).getTime()
        }
        replyCursor.value = {
          id: res.id,
          createTime: createTimeTimestamp,
          likeCount: res.likeCount || (res.likeCount === 0 ? 0 : undefined)
        }
        hasMoreReplies.value = true
      } else {
        hasMoreReplies.value = false
      }
    } else {
      hasMoreReplies.value = false
    }
  } catch (error) {
    console.error('Failed to fetch replies', error)
    ElMessage.error('获取回复失败，请重试')
  } finally {
    loadingReplies.value = false
  }
}
</script>

<style scoped>
.comment-item {
  display: flex;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid #f9f9f9;
}

.comment-content-wrapper {
  display: flex;
  gap: 16px;
  width: 100%;
}

.comment-main {
  flex: 1;
  min-width: 0;
}

.comment-user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.username {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.time {
  font-size: 12px;
  color: #999;
}

.comment-text {
  font-size: 14px;
  color: #4a4a4a;
  line-height: 1.6;
  margin-bottom: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-actions {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: color 0.2s;
}

.action-item:hover, .action-item.liked {
  color: #409eff;
}

.action-item.disliked {
  color: #f56c6c;
}

.reply-input-wrapper {
  margin-bottom: 16px;
  animation: slideDown 0.3s ease;
}

.view-replies-btn, .load-more-replies-btn {
  font-size: 13px;
  color: #409eff;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
}

.view-replies-btn:hover, .load-more-replies-btn:hover {
  text-decoration: underline;
}

.sub-comments-list {
  background-color: #fafafa;
  border-radius: 8px;
  padding: 0 16px;
  margin-top: 12px;
}

.sub-comments-list .comment-item {
  border-bottom: 1px solid #eee;
  padding: 16px 0;
}

.sub-comments-list .comment-item:last-child {
  border-bottom: none;
}

.loading-replies {
  font-size: 13px;
  color: #999;
  padding: 8px 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>