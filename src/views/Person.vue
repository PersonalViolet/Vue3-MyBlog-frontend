<template>
  <div class="person-container">
    <div class="person-card">
      <!-- 头像与基本信息 -->
      <div class="person-header">
        <div class="avatar-wrapper" @click="triggerFileInput">
          <img :src="avatarUrl" alt="用户头像" class="avatar" />
          <div class="avatar-overlay">
            <el-icon><Camera /></el-icon>
            <span>修改头像</span>
          </div>
          <input
            type="file"
            ref="fileInput"
            style="display: none"
            accept="image/jpeg,image/png,image/gif"
            @change="handleFileChange"
          />
        </div>
        <div class="base-info">
          <div v-if="!isEditing">
            <h2 class="username" @click="startEdit" title="点击修改用户名">{{ userInfo.username || '未设置用户名' }}</h2>
          </div>
          <el-input
            v-else
            v-model="editForm.username"
            placeholder="请输入用户名"
            maxlength="20"
            show-word-limit
            class="username-input"
          />
          <p class="account">账号：{{ userInfo.account || '未设置账号' }}</p>
          <p class="email">邮箱：{{ userInfo.email || '未绑定邮箱' }}</p>
        </div>
      </div>

      <!-- 个人简介 -->
      <el-divider />
      <div class="section">
        <div class="section-header">
          <span class="section-title">个人简介</span>
          <div v-if="!isEditing">
            <el-button type="primary" text @click="startEdit">
              编辑
            </el-button>
          </div>
          <div v-else class="action-buttons">
            <el-button @click="cancelEdit" :disabled="isSubmitting">取消修改</el-button>
            <el-button type="primary" @click="saveChanges" :loading="isSubmitting">保存修改</el-button>
          </div>
        </div>
        <div v-if="!isEditing">
          <p class="intro" @click="startEdit" title="点击修改简介">
            {{ userInfo.intro || '还没有填写个人简介，去简单介绍一下自己吧～' }}
          </p>
        </div>
        <el-input
          v-else
          v-model="editForm.intro"
          type="textarea"
          :rows="3"
          placeholder="介绍一下自己吧..."
          maxlength="200"
          show-word-limit
        />
      </div>

      <!-- 统计信息 -->
      <el-divider />
      <div class="section stats-section">
        <div class="stat-item">
          <span class="stat-label">文章数</span>
          <span class="stat-value">{{ userInfo.articleCount ?? 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">收藏数</span>
          <span class="stat-value">{{ userInfo.starCount ?? 0 }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">点赞数</span>
          <span class="stat-value">{{ userInfo.likeCount ?? 0 }}</span>
        </div>
      </div>

      <!-- 账号安全 -->
      <el-divider />
      <div class="section">
        <div class="section-header">
          <span class="section-title">账号安全</span>
        </div>
        <div class="security-list">
          <div class="security-item">
            <div class="security-info">
              <span class="security-label">登录密码</span>
              <span class="security-desc">建议定期修改密码，保障账号安全</span>
            </div>
            <el-button type="primary" text>修改</el-button>
          </div>
          <div class="security-item">
            <div class="security-info">
              <span class="security-label">邮箱绑定</span>
              <span class="security-desc">
                {{ userInfo.email ? '已绑定邮箱，可用于找回密码' : '未绑定邮箱，建议尽快绑定' }}
              </span>
            </div>
            <el-button type="primary" text>管理</el-button>
          </div>
        </div>
      </div>

      <!-- 我的文章（分页展示） -->
      <el-divider />
      <div class="section">
        <div class="section-header">
          <span class="section-title">我的文章</span>
          <el-button type="primary" :icon="EditPen" @click="goToEditor">
            发表文章
          </el-button>
        </div>
        <div class="article-list">
          <el-empty
            v-if="!articleList.length && !loadingArticles"
            description="暂未发表文章"
          />

          <el-skeleton
            v-else-if="loadingArticles"
            animated
            :count="3"
            class="article-skeleton"
          />

          <div v-else>
            <div
              v-for="article in articleList"
              :key="article.id"
              class="article-item"
            >
              <div class="article-content-wrapper">
                <!-- 左侧文字区域 -->
                <div class="article-text-content">
                  <h3 class="article-title">{{ article.title }}</h3>
                  <p class="article-summary">
                    {{ article.summary || '该文章暂无简介～' }}
                  </p>
                  
                  <!-- 左下角统计信息：游览量，点赞量，收藏量 -->
                  <div class="article-stats">
                    <span class="stat-item">
                      <el-icon><View /></el-icon>
                      {{ article.views || 0 }}
                    </span>
                    <span class="stat-item">
                      <el-icon><Star /></el-icon>
                      {{ article.stars || 0 }}
                    </span>
                    <span class="stat-item">
                      <el-icon><Pointer /></el-icon>
                      {{ article.likes || 0 }}
                    </span>
                  </div>
                </div>
                
                <!-- 右侧封面区域 -->
                <div class="article-cover-wrapper">
                  <div v-if="article.cover_asset_url" class="article-cover">
                    <img 
                      :src="article.cover_asset_url" 
                      :alt="article.title"
                      @error="handleImageError"
                    />
                  </div>
                  <div v-else class="article-cover-placeholder">
                    <el-icon><Picture /></el-icon>
                    <span>无封面</span>
                  </div>
                  
                  <!-- 右下角发布时间 -->
                  <div class="article-time">
                    {{ formatDate(article.publishedAt) }}
                  </div>
                </div>
              </div>
            </div>

            <div class="pagination-wrapper">
              <el-pagination
                background
                layout="prev, pager, next"
                :page-size="articleQueryDTO.pageSize"
                :current-page="articleQueryDTO.page"
                :total="totalArticles"
                @current-change="handlePageChange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { View, Star, Pointer, Picture, Camera, EditPen } from '@element-plus/icons-vue'
import defaultAvatar from '@/assets/icons/defaultAvatar.svg'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getUserInfoItem,
  getSessionUserInfoItem,
  setUserInfoItem,
  removeSessionUserInfoItem,
  removeUserInfoItem,
  updateUserInfoItem,
  type UserInfoItem
} from '@/utils/Storage'
import {
  getUserPublicArticles,
  type Article,
  type ArticleQueryDTO
} from '@/api/article/userArticleApi'
import {
  type PageResult
} from '@/api/PageResult'
import { formatDate } from '@/utils/format-date'

import {
  getUserProfile,
  updateUserProfile,
  type UserProfileVO,
  type UserProfileDTO
} from '@/api/user/UserProfileApi'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()
interface UserInfo {
  id: number
  username: string
  account: string
  email: string
  intro?: string
  avatarUrl?: string
  articleCount?: number
  starCount?: number
  likeCount?: number
}

// TODO: 后续可改为从接口获取当前登录用户信息
const userInfo = ref<UserInfo>({
  id: 0,
  username: '未登录用户',
  account: '',
  email: '',
  intro: '',
  avatarUrl: '',
  articleCount: 0,
  starCount: 0,
  likeCount: 0
})
const avatarUrl = computed(() => {
  if (previewAvatarUrl.value) return previewAvatarUrl.value
  return (userInfo.value.avatarUrl && userInfo.value.avatarUrl.trim() !== '') ? userInfo.value.avatarUrl : defaultAvatar
})

// 编辑相关状态
const isEditing = ref(false)
const isSubmitting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const avatarFile = ref<File | null>(null)
const previewAvatarUrl = ref<string | null>(null)
const editForm = reactive({
  username: '',
  intro: ''
})

// 触发文件选择
function triggerFileInput() {
  fileInput.value?.click()
}

// 处理文件选择
function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    
    // 添加类型检查确保file不为undefined
    if (!file) {
      ElMessage.warning('请选择有效的文件')
      return
    }
    // 验证文件格式
    if (!file.type.match(/^image\/(jpeg|png|gif)$/)) {
      ElMessage.warning('请选择 jpg/png/gif 格式的图片')
      return
    }
    
    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      ElMessage.warning('图片大小不能超过 10MB')
      return
    }

    avatarFile.value = file
    
    // 生成预览
    const reader = new FileReader()
    reader.onload = (e) => {
      previewAvatarUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
    
    // 如果没有在编辑模式，自动进入编辑模式
    if (!isEditing.value) {
      startEdit()
    }
  }
}

// 开始编辑
function startEdit() {
  editForm.username = userInfo.value.username
  editForm.intro = userInfo.value.intro || ''
  isEditing.value = true
}

// 取消编辑
function cancelEdit() {
  isEditing.value = false
  avatarFile.value = null
  previewAvatarUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
  // 重置表单
  editForm.username = userInfo.value.username
  editForm.intro = userInfo.value.intro || ''
}

// 保存修改
async function saveChanges() {
  if (!editForm.username.trim()) {
    ElMessage.warning('用户名不能为空')
    return
  }

  // 二次确认
  if (editForm.username !== userInfo.value.username) {
    try {
      await ElMessageBox.confirm(
        '修改用户名是敏感操作，确定要修改吗？',
        '确认修改',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
    } catch {
      return
    }
  }

  isSubmitting.value = true
  try {
    const formData = new FormData()
    
    // 构造 DTO 对象
    const userProfileDTO: UserProfileDTO = {
      userId: userInfo.value.id,
      username: editForm.username,
      intro: editForm.intro
    }
    
    // 将 DTO 对象转换为 JSON 字符串并作为 userProfileDTOJSON 字段添加
    // 后端 @RequestPart("userProfileDTOJSON") String userProfileDTOJSON 接收字符串
    formData.append('userProfileDTOJSON', JSON.stringify(userProfileDTO))
    
    // 添加头像文件
    if (avatarFile.value) {
      formData.append('avatar', avatarFile.value)
    }

    // 检查是否有修改 (这里逻辑稍微调整，只要点击保存且通过校验，就发送请求，因为DTO已经包含了当前值)
    // 如果完全没变，其实后端更新也没问题，或者前端拦截
    const isProfileChanged = editForm.username !== userInfo.value.username || editForm.intro !== (userInfo.value.intro || '')
    const isAvatarChanged = !!avatarFile.value
    
    if (!isProfileChanged && !isAvatarChanged) {
      ElMessage.info('未检测到修改')
      isEditing.value = false
      isSubmitting.value = false
      return
    }

    await updateUserProfile(userInfo.value.id, formData)
    
    ElMessage.success('修改成功')
    
    // 更新本地数据
    const userInfoItem: UserInfoItem = getSessionUserInfoItem() || getUserInfoItem()
    userInfoItem.username = editForm.username
    userInfo.value.username = editForm.username
    userInfo.value.intro = editForm.intro
    if (previewAvatarUrl.value) {
      userInfo.value.avatarUrl = previewAvatarUrl.value
      userInfoItem.avatar = previewAvatarUrl.value
      // 立即更新 store 以获得即时反馈
      userStore.updateAvatar(previewAvatarUrl.value)
    }
    // 更新 store 用户名
    userStore.updateUsername(editForm.username)
    
    // 清理状态
    isEditing.value = false
    avatarFile.value = null
    previewAvatarUrl.value = null
    if (fileInput.value) fileInput.value.value = ''

    // 重新加载最新信息以确保一致性
    updateUserInfoItem(userInfoItem)



    await loadUserInfo()
    
  } catch (error: any) {
    console.error('更新用户信息失败:', error)
    ElMessage.error(error.message || '更新失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

/** 我的文章分页数据 */
const articleList = ref<Article[]>([])
const loadingArticles = ref(false)
const totalArticles = ref(0)

const articleQueryDTO = reactive<ArticleQueryDTO>({
  page: 1,
  pageSize: 5,
  mostLikes: true,
  mostStars: false,
  mostViews: false
})

async function fetchArticles() {
  loadingArticles.value = true
  try {
    const res: PageResult<Article> = await getUserPublicArticles(userInfo.value.id, articleQueryDTO)
    articleList.value = res.records || []
    totalArticles.value = res.total || 0
  } catch (error) {
    console.error('获取我的文章失败:', error)
  } finally {
    loadingArticles.value = false
  }
}

function handlePageChange(page: number) {
  articleQueryDTO.page = page
  fetchArticles()
}

/** 处理图片加载失败 */
function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement;
  target.src = 'https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711jpeg.jpeg'; // 默认图片
}


function goToEditor() {
  router.push('/editor')
}

// 获取用户信息
async function loadUserInfo() {
  // 首先尝试从存储中获取用户ID
  let parsedUserInfo = getSessionUserInfoItem();
  if (!parsedUserInfo) {
    parsedUserInfo = getUserInfoItem();
  }
  
  if (parsedUserInfo && parsedUserInfo.id) {
    try {
      // 使用API获取最新的用户信息
      const UserProfileVO: UserProfileVO = await getUserProfile(parsedUserInfo.id);
      // 更新userInfo响应式引用
      userInfo.value = {
        ...userInfo.value,
        id: UserProfileVO.userId,
        username: UserProfileVO.username,
        account: UserProfileVO.account,
        email: UserProfileVO.email,
        intro: UserProfileVO.intro || '', // 个人简介
        avatarUrl: UserProfileVO.avatarUrl || '',
        articleCount: UserProfileVO.articleCount,
        starCount: UserProfileVO.starCount,
        likeCount: UserProfileVO.likeCount
      };

      // 同步最新数据到 Store
      if (UserProfileVO.avatarUrl) {
        userStore.updateAvatar(UserProfileVO.avatarUrl)
      }
      if (UserProfileVO.username) {
        userStore.updateUsername(UserProfileVO.username)
      }
      
    } catch (error) {
      console.error('从API获取用户信息失败:', error);
      // API获取失败时，使用存储中的数据作为备选
      loadUserInfoFromStorage();
    }
  } else {
    // 如果存储中没有用户ID，则使用存储中的数据
    loadUserInfoFromStorage();
  }
}

// 从存储中获取用户信息并解析（备选方案）
function loadUserInfoFromStorage() {
  // 首先尝试从sessionStorage获取
  let parsedUserInfo = getSessionUserInfoItem();
  if (!parsedUserInfo) {
    // 如果sessionStorage中没有，则从localStorage获取
    parsedUserInfo = getUserInfoItem();
  }
  
  if (parsedUserInfo) {
    try {
      // 更新userInfo响应式引用
      userInfo.value = {
        ...userInfo.value,
        id: parsedUserInfo.id || 0,
        username: parsedUserInfo.username || '未登录用户',
        account: parsedUserInfo.account || '',
        email: parsedUserInfo.email || '',
        intro: parsedUserInfo.intro || '', // 个人简介
        avatarUrl: parsedUserInfo.avatar || '',
        articleCount: parsedUserInfo.articleCount || 0,
        starCount: parsedUserInfo.starCount || 0,
        likeCount: parsedUserInfo.likeCount || 0
      };
    } catch (error) {
      console.error('解析用户信息失败:', error);
    }
  }
}

onMounted(async () => {
  await loadUserInfo();
  fetchArticles()
})
</script>

<style scoped>
.person-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  min-height: calc(100vh - 64px);
  background: var(--login-bg, linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%));
  box-sizing: border-box;
}

.person-card {
  width: 100%;
  max-width: 900px;
  padding: 30px 24px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
}

.person-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-wrapper {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e5e5e5;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  position: relative;
  cursor: pointer;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 12px;
}

.avatar-overlay .el-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.base-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.username {
  margin: 0;
  font-size: 22px;
  color: #333;
  cursor: pointer;
  transition: color 0.2s;
  display: inline-block;
}

.username:hover {
  color: #409eff;
}

.username-input {
  max-width: 300px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.account,
.email {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.section {
  margin-top: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.intro {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.intro:hover {
  background-color: #f0f2f5;
}

.stats-section {
  display: flex;
  gap: 24px;
}

.stat-item {
  flex: 1;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: #f8f9fb;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-label {
  font-size: 13px;
  color: #888;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #409eff;
}

.security-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 4px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 10px;
  background-color: #f8f9fb;
}

.security-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.security-label {
  font-size: 14px;
  color: #333;
}

.security-desc {
  font-size: 12px;
  color: #888;
}

.article-list {
  margin-top: 8px;
}

.article-item {
  padding: 16px;
  border-radius: 12px;
  background-color: #f8f9fb;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  & + .article-item {
    margin-top: 12px;
  }
}

.article-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.article-content-wrapper {
  display: flex;
  gap: 16px;
}

.article-text-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.article-cover-wrapper {
  flex-shrink: 0;
  width: 120px;
  display: flex;
  flex-direction: column;
}

.article-cover {
  width: 100%;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 8px;
}

.article-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-cover-placeholder {
  width: 100%;
  height: 80px;
  border-radius: 6px;
  background-color: #e6e6e6;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 12px;
  margin-bottom: 8px;
}

.article-cover-placeholder .el-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.article-time {
  font-size: 12px;
  color: #999;
  text-align: right;
  margin-top: auto;
}

.article-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.article-summary {
  margin: 0 0 12px;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  flex: 1;
}

.article-stats {
  display: flex;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #666;
  gap: 2px;
}

.stat-item .el-icon {
  font-size: 14px;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: #999;
}

.meta-item {
  display: inline-flex;
  align-items: center;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .person-card {
    padding: 20px 16px;
  }

  .person-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .avatar-wrapper {
    width: 80px;
    height: 80px;
  }

  .stats-section {
    flex-direction: column;
  }
}
</style>


