<template>
  <div class="c-comment-form-container">
    <div class="c-comment-form-avatar">
      <el-avatar :size="40" :src="userAvatar" />
    </div>
    <div class="c-comment-form-main">
      <el-input
        v-model="content"
        type="textarea"
        :rows="3"
        :placeholder="placeholder"
        maxlength="500"
        show-word-limit
        resize="none"
        class="c-comment-form-textarea"
        ref="textareaRef"
      />
      
      <!-- Image Preview -->
      <div v-if="imageUrl" class="c-comment-form-image-preview">
        <el-image 
          :src="imageUrl" 
          fit="cover" 
          class="preview-img"
          :preview-src-list="[imageUrl]"
        />
        <div class="delete-btn" @click="removeImage">
          <el-icon><Close /></el-icon>
        </div>
      </div>

      <div class="c-comment-form-toolbar">
        <div class="toolbar-left">
          <!-- Emoji Picker -->
          <el-popover
            placement="bottom-start"
            :width="300"
            trigger="click"
            popper-class="c-comment-emoji-popover"
          >
            <template #reference>
              <div class="toolbar-btn emoji-btn" title="插入表情">
                <span class="emoji-icon">😊</span>
              </div>
            </template>
            <div class="emoji-picker-content">
              <span 
                v-for="emoji in emojiList" 
                :key="emoji" 
                class="emoji-item"
                @click="insertEmoji(emoji)"
              >
                {{ emoji }}
              </span>
            </div>
          </el-popover>

          <!-- Image Upload -->
          <el-upload
            action="#"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="handleUpload"
            accept="image/jpeg,image/png"
            class="image-uploader"
          >
            <div class="toolbar-btn image-btn" title="上传图片">
              <el-icon><Picture /></el-icon>
            </div>
          </el-upload>
        </div>

        <div class="toolbar-right">
          <el-button 
            type="primary" 
            :disabled="!isValid" 
            :loading="submitting"
            @click="handleSubmit"
            size="small"
            class="submit-btn"
          >
            发表评论
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Close, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { uploadFile } from '@/api/file/uploadApi'
import { postArticleComment, type PostCommentDTO } from '@/api/comment/CommentApi'
import { openLogin } from '@/utils/authModal'
import defaultAvatar from '@/assets/icons/defaultAvatar.svg'

const props = defineProps<{
  articleId: number
  parentId: number | null
  rootId: number | null
  targetComment?: any // Used for placeholder or context
}>()

const emit = defineEmits<{
  (e: 'success', comment: any): void
}>()

const userStore = useUserStore()
const content = ref('')
const imageUrl = ref('')
const submitting = ref(false)
const uploading = ref(false)
const textareaRef = ref()

const userAvatar = computed(() => {
  return userStore.userInfo?.avatar || defaultAvatar
})

const placeholder = computed(() => {
  if (props.targetComment) {
    return `回复 @${props.targetComment.username || '用户'}:`
  }
  return '发一条友善的评论...'
})

const isValid = computed(() => {
  return content.value.trim().length > 0
})

const emojiList = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃',
  '😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚',
  '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔',
  '🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥',
  '😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮',
  '🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓',
  '🧐','😕','😟','🙁','😮','😯','😲','😳','🥺','😦',
  '😧','😨','😰','😥','😢','😭','😱','😖','😣','😞',
  '😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿',
  '💀','💩','🤡','👻','👽','👾','🤖','👋','🤚','🖐️',
  '✋','🖖','👌','🤏','✌️','🤞','🤟','🤘','🤙','👈',
  '👉','👆','🖕','👇','👍','👎','✊','👊','🤛','🤜',
  '👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪'
]

function insertEmoji(emoji: string) {
  content.value += emoji
}

function beforeUpload(file: File) {
  const isJPGOrPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPGOrPNG) {
    ElMessage.error('上传图片只能是 JPG/PNG 格式!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
    return false
  }
  return true
}

async function handleUpload(options: any) {
  uploading.value = true
  try {
    const res = await uploadFile(options.file)
    imageUrl.value = res.url
  } catch (error) {
    ElMessage.error('图片上传失败，请重试')
  } finally {
    uploading.value = false
  }
}

function removeImage() {
  imageUrl.value = ''
}

async function handleSubmit() {
  if (!userStore.userInfo?.id) {
    ElMessage.warning('请先登录')
    openLogin({ source: 'comment-submit' })
    return
  }
  if (!content.value.trim()) {
    ElMessage.warning('评论内容不能为空')
    return
  }

  submitting.value = true
  try {
    const postData: PostCommentDTO = {
      articleId: props.articleId,
      parentId: props.parentId,
      rootId: props.rootId,
      content: content.value,
      media: imageUrl.value || undefined
    }

    const res = await postArticleComment(props.articleId, postData)
    
    ElMessage.success('发表成功')
    content.value = ''
    imageUrl.value = ''
    emit('success', res)
  } catch (error: any) {
    console.error('Failed to post comment:', error)
    if (error.response?.status === 400) {
      ElMessage.error('参数缺失')
    } else if (error.response?.status === 401) {
      ElMessage.error('请先登录')
    } else {
      ElMessage.error('发表失败，请重试')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (props.parentId) {
    textareaRef.value?.focus()
  }
})
</script>

<style lang="scss" scoped>
.c-comment-form-container {
  display: flex;
  gap: 16px;
  padding: 16px 0;
  
  .c-comment-form-avatar {
    flex-shrink: 0;
  }

  .c-comment-form-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .c-comment-form-textarea {
      :deep(.el-textarea__inner) {
        border-radius: 8px;
        font-family: inherit;
        &:focus {
          box-shadow: 0 0 0 1px var(--el-color-primary) inset;
        }
      }
    }

    .c-comment-form-image-preview {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e4e7ed;
      
      .preview-img {
        width: 100%;
        height: 100%;
      }
      
      .delete-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 20px;
        height: 20px;
        background: rgba(0,0,0,0.5);
        color: #fff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
        
        &:hover {
          background: rgba(0,0,0,0.7);
        }
      }
    }

    .c-comment-form-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .toolbar-left {
        display: flex;
        gap: 16px;

        .toolbar-btn {
          cursor: pointer;
          color: #909399;
          font-size: 20px;
          display: flex;
          align-items: center;
          transition: color 0.3s;

          &:hover {
            color: var(--el-color-primary);
          }
          
          .emoji-icon {
            font-size: 18px;
            line-height: 1;
          }
        }
      }
    }
  }
}

.emoji-picker-content {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  
  .emoji-item {
    font-size: 20px;
    cursor: pointer;
    text-align: center;
    padding: 4px;
    border-radius: 4px;
    
    &:hover {
      background-color: #f5f7fa;
    }
  }
}
</style>

<style lang="scss">
.c-comment-emoji-popover {
  padding: 0 !important;
  
  .el-popover__title {
    display: none;
  }
}
</style>
