<template>
  <div class="tag-search-page">
    <div class="tag-search-shell">
      <section class="hero-panel">
        <div class="hero-text">
          <p class="hero-kicker">Tag Search</p>
          <h1>按标签查找文章</h1>
          <p>输入标签后即可筛选文章，支持按创建时间或点赞量排序。</p>
        </div>

        <div class="hero-form">
          <el-input
            v-model="tagInput"
            class="tag-input"
            placeholder="输入标签，例如 Spring Boot"
            clearable
            @keyup.enter="handleSubmitSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" class="search-btn" @click="handleSubmitSearch">搜索</el-button>
        </div>

        <div class="filter-row">
          <el-select
            v-model="sortBy"
            class="sort-select"
            placeholder="排序方式"
            :disabled="!queryTag"
            @change="handleSortChange"
          >
            <el-option label="创建时间" value="createTime" />
            <el-option label="点赞量" value="likes" />
          </el-select>
        </div>
      </section>

      <section class="results-panel">
        <div class="results-header">
          <div class="header-left">
            <h2>筛选结果</h2>
            <el-tag v-if="queryTag" type="info">标签：{{ queryTag }}</el-tag>
          </div>
          <p v-if="queryTag" class="total-text">已加载 {{ articles.length }} 条</p>
        </div>

        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          :closable="false"
          show-icon
          class="result-alert"
        >
          <template #default>
            <el-button type="danger" text @click="reloadCurrentQuery">点击重试</el-button>
          </template>
        </el-alert>

        <el-empty v-else-if="!queryTag" description="输入标签后开始搜索" />

        <div v-else-if="loading && articles.length === 0" class="skeleton-list">
          <el-skeleton v-for="item in 4" :key="item" animated>
            <template #template>
              <el-skeleton-item variant="rect" style="height: 120px; border-radius: 12px" />
            </template>
          </el-skeleton>
        </div>

        <el-empty
          v-else-if="articles.length === 0"
          description="该标签下暂无文章，试试其他标签"
        />

        <div v-else class="result-list">
          <ArticleItemCard
            v-for="article in articles"
            :key="article.id"
            :article="article"
            @select="goToArticleDetail"
          />

          <div ref="loadMoreTriggerRef" class="load-more-trigger">
            <el-icon v-if="loadingMore" class="is-loading"><Loading /></el-icon>
            <span v-if="loadingMore">正在加载更多...</span>
            <span v-else-if="!hasMore">已加载全部结果</span>
            <span v-else>继续下滑加载更多</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading, Search } from '@element-plus/icons-vue'
import ArticleItemCard, { type ArticleItem } from '@/components/ArticleItemCard.vue'
import {
  filterArticlesByTag,
  type TagFilterArticleItem,
  type TagFilterQueryDTO,
  type TagFilterSortBy
} from '@/api/tag'

const DEFAULT_SORT_BY: TagFilterSortBy = 'createTime'
const PAGE_LIMIT = 10

const router = useRouter()
const route = useRoute()

const tagInput = ref('')
const queryTag = ref('')
const sortBy = ref<TagFilterSortBy>(DEFAULT_SORT_BY)

const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')

const articles = ref<TagFilterArticleItem[]>([])
const nextCreateTimeCursor = ref<number | null>(null)
const nextLikesCursor = ref<number | null>(null)
const nextIdCursor = ref<number | null>(null)
const noMoreFromServer = ref(false)

const loadMoreTriggerRef = ref<HTMLElement | null>(null)

const hasMore = computed(() => {
  if (!queryTag.value || noMoreFromServer.value) {
    return false
  }

  return articles.value.length > 0
})

function getQueryFirstValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value[0] || ''
  }

  if (typeof value === 'string') {
    return value
  }

  return ''
}

function normalizeSortBy(value: string): TagFilterSortBy {
  if (value === 'createTime' || value === 'likes') {
    return value
  }

  return DEFAULT_SORT_BY
}

function buildRouteQuery() {
  return {
    tag: queryTag.value || undefined,
    sortBy: sortBy.value
  }
}

function handleSubmitSearch() {
  const trimmedTag = tagInput.value.trim()
  if (!trimmedTag) {
    ElMessage.warning('请输入标签')
    return
  }

  router.push({
    path: '/tag-search',
    query: {
      tag: trimmedTag,
      sortBy: sortBy.value
    }
  })
}

function handleSortChange() {
  if (!queryTag.value) {
    return
  }

  router.push({
    path: '/tag-search',
    query: {
      ...buildRouteQuery(),
      sortBy: sortBy.value
    }
  })
}

function resetResultState() {
  articles.value = []
  nextCreateTimeCursor.value = null
  nextLikesCursor.value = null
  nextIdCursor.value = null
  noMoreFromServer.value = false
}

function parseCursor(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null
  }

  const cursorValue = Number(value)
  if (!Number.isFinite(cursorValue)) {
    return null
  }

  return cursorValue
}

function applyNextCursor(response: {
  createTime: number | null
  likes: number | null
  id: number | null
}) {
  nextCreateTimeCursor.value = parseCursor(response.createTime)
  nextLikesCursor.value = parseCursor(response.likes)
  nextIdCursor.value = parseCursor(response.id)
}

function buildCursorQuery(): Partial<TagFilterQueryDTO> {
  if (sortBy.value === 'createTime') {
    if (nextCreateTimeCursor.value !== null && nextIdCursor.value !== null) {
      return {
        lastCreateTime: nextCreateTimeCursor.value,
        lastId: nextIdCursor.value
      }
    }

    return {}
  }

  if (nextLikesCursor.value !== null && nextIdCursor.value !== null) {
    return {
      lastLikes: nextLikesCursor.value,
      lastId: nextIdCursor.value
    }
  }

  return {}
}

function updateNoMoreState(incomingCount: number) {
  if (incomingCount === 0 || nextIdCursor.value === null || incomingCount < PAGE_LIMIT) {
    noMoreFromServer.value = true
  }
}

async function fetchTagResults(isInitialFetch: boolean) {
  if (!queryTag.value) {
    resetResultState()
    return
  }

  if (isInitialFetch) {
    loading.value = true
    errorMessage.value = ''
    resetResultState()
  } else {
    if (!hasMore.value || loading.value || loadingMore.value) {
      return
    }

    loadingMore.value = true
  }

  try {
    const params: TagFilterQueryDTO = {
      targetType: 'article',
      tag: queryTag.value,
      sortBy: sortBy.value,
      limit: PAGE_LIMIT,
      ...(isInitialFetch ? {} : buildCursorQuery())
    }

    const response = await filterArticlesByTag(params)
    const incomingRecords = response.records || []

    applyNextCursor(response)

    if (incomingRecords.length === 0) {
      noMoreFromServer.value = true
      return
    }

    const deduplicated = incomingRecords.filter((item) => {
      return !articles.value.some((record) => record.id === item.id)
    })

    articles.value = isInitialFetch ? deduplicated : [...articles.value, ...deduplicated]

    if (!isInitialFetch && deduplicated.length === 0) {
      noMoreFromServer.value = true
      return
    }

    updateNoMoreState(incomingRecords.length)
  } catch (error) {
    console.error('标签搜索失败:', error)
    errorMessage.value = error instanceof Error ? error.message : '标签搜索失败，请稍后重试'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function reloadCurrentQuery() {
  if (!queryTag.value) {
    return
  }

  fetchTagResults(true)
}

function loadMore() {
  fetchTagResults(false)
}

function getAuthorId(article: ArticleItem): number | null {
  const id = Number(article.userCreateBy ?? article.user_create_by)
  if (!Number.isFinite(id) || id <= 0) {
    return null
  }

  return id
}

function goToArticleDetail(article: ArticleItem) {
  const authorId = getAuthorId(article)
  if (authorId === null) {
    ElMessage.warning('缺少作者信息，暂无法打开文章详情')
    return
  }
  // 构建完整的路由路径
  const path = `/${authorId}/${article.id}`
  
  // 使用 window.open 在新标签页打开
  // resolve 用于将相对路径转换为完整的 URL 路径（包含 base 路径等）
  const routeUrl = router.resolve(path)
  window.open(routeUrl.href, '_blank')
  // router.push(`/${authorId}/${article.id}`)
}

watch(
  () => route.query,
  () => {
    const currentTag = getQueryFirstValue(route.query.tag).trim()
    const currentSortBy = normalizeSortBy(getQueryFirstValue(route.query.sortBy))

    tagInput.value = currentTag
    queryTag.value = currentTag
    sortBy.value = currentSortBy
    errorMessage.value = ''

    if (!currentTag) {
      resetResultState()
      return
    }

    fetchTagResults(true)
  },
  { immediate: true }
)

useIntersectionObserver(
  loadMoreTriggerRef,
  ([entry]) => {
    if (entry?.isIntersecting) {
      loadMore()
    }
  },
  {
    threshold: 0.1
  }
)
</script>

<style scoped>
.tag-search-page {
  min-height: calc(100vh - 64px);
  background:
    radial-gradient(circle at 12% 12%, rgba(111, 195, 255, 0.2), transparent 40%),
    radial-gradient(circle at 88% 16%, rgba(255, 218, 142, 0.24), transparent 34%),
    linear-gradient(180deg, #f5f8ff 0%, #f7fafc 64%, #f2f7ff 100%);
  padding: 28px 20px 36px;
}

.tag-search-shell {
  max-width: 1040px;
  margin: 0 auto;
}

.hero-panel {
  border-radius: 20px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 12px 40px rgba(32, 61, 95, 0.08);
  backdrop-filter: blur(8px);
}

.hero-text h1 {
  margin: 2px 0 8px;
  font-size: 28px;
  color: #17233a;
}

.hero-text p {
  margin: 0;
  color: #5c667a;
}

.hero-kicker {
  margin: 0;
  color: #2e7ae6;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 700;
}

.hero-form {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
}

.tag-input {
  width: 100%;
}

.search-btn {
  min-width: 116px;
  border-radius: 12px;
}

.filter-row {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.sort-select {
  width: 180px;
}

.results-panel {
  margin-top: 18px;
  border-radius: 20px;
  padding: 22px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 32px rgba(24, 55, 90, 0.08);
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-left h2 {
  margin: 0;
  color: #162136;
  font-size: 20px;
}

.total-text {
  margin: 0;
  color: #5f6b7b;
  font-size: 14px;
}

.result-alert {
  margin-bottom: 14px;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-list {
  margin-top: 12px;
}

.load-more-trigger {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #78869b;
  font-size: 13px;
  gap: 8px;
}

@media (max-width: 768px) {
  .tag-search-page {
    padding: 16px;
  }

  .hero-panel,
  .results-panel {
    border-radius: 14px;
    padding: 16px;
  }

  .hero-text h1 {
    font-size: 22px;
  }

  .hero-form {
    grid-template-columns: 1fr;
  }

  .search-btn {
    width: 100%;
  }

  .sort-select {
    width: 100%;
  }
}
</style>
