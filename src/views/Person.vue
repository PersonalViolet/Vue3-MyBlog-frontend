<template>
  <div class="person-container">
    <div class="person-card">
      <!-- 头像与基本信息 -->
      <div class="person-header">
        <div class="avatar-wrapper">
          <img :src="avatarUrl" alt="用户头像" class="avatar" />
        </div>
        <div class="base-info">
          <h2 class="username">{{ userInfo.username || '未设置用户名' }}</h2>
          <p class="account">账号：{{ userInfo.account || '未设置账号' }}</p>
          <p class="email">邮箱：{{ userInfo.email || '未绑定邮箱' }}</p>
        </div>
      </div>

      <!-- 个人简介 -->
      <el-divider />
      <div class="section">
        <div class="section-header">
          <span class="section-title">个人简介</span>
          <el-button type="primary" text @click="editProfile">
            编辑
          </el-button>
        </div>
        <p class="intro">
          {{ userInfo.intro || '还没有填写个人简介，去简单介绍一下自己吧～' }}
        </p>
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
          <span class="stat-value">{{ userInfo.favoriteCount ?? 0 }}</span>
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
              <h3 class="article-title">{{ article.title }}</h3>
              <p class="article-summary">
                {{ article.summary || '该文章暂无简介～' }}
              </p>
              <div class="article-meta">
                <span class="meta-item">
                  发布时间：{{ article.createdAt || '未知' }}
                </span>
                <span
                  v-if="article.views !== undefined"
                  class="meta-item"
                >
                  浏览 {{ article.views }}
                </span>
                <span
                  v-if="article.likes !== undefined"
                  class="meta-item"
                >
                  点赞 {{ article.likes }}
                </span>
              </div>
            </div>

            <div class="pagination-wrapper">
              <el-pagination
                background
                layout="prev, pager, next"
                :page-size="pagination.pageSize"
                :current-page="pagination.page"
                :total="pagination.total"
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
import defaultAvatar from '@/assets/icons/defaultAvatar.svg'
import {
  getMyArticles,
  type UserArticle,
  type UserArticlePageResult
} from '@/api/article/userArticleApi'

interface UserInfo {
  username: string
  account: string
  email: string
  intro?: string
  avatarUrl?: string
  articleCount?: number
  favoriteCount?: number
  likeCount?: number
}

// TODO: 后续可改为从接口获取当前登录用户信息
const userInfo = ref<UserInfo>({
  username: '未登录用户',
  account: '',
  email: '',
  intro: '',
  avatarUrl: '',
  articleCount: 0,
  favoriteCount: 0,
  likeCount: 0
})

const avatarUrl = computed(() => userInfo.value.avatarUrl || defaultAvatar)

function editProfile() {
  // 个人信息编辑功能后续在此处实现
  console.log('点击编辑个人信息')
}

/** 我的文章分页数据 */
const articleList = ref<UserArticle[]>([])
const loadingArticles = ref(false)

const pagination = reactive({
  page: 1,
  pageSize: 5,
  total: 0
})

async function fetchArticles() {
  loadingArticles.value = true
  try {
    const res = await getMyArticles({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    articleList.value = res.list || []
    pagination.total = res.total || 0
  } catch (error) {
    console.error('获取我的文章失败:', error)
  } finally {
    loadingArticles.value = false
  }
}

function handlePageChange(page: number) {
  pagination.page = page
  fetchArticles()
}

onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
.person-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  min-height: 100vh;
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
  padding: 14px 16px;
  border-radius: 12px;
  background-color: #f8f9fb;
  & + .article-item {
    margin-top: 12px;
  }
}

.article-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.article-summary {
  margin: 0 0 8px;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
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


