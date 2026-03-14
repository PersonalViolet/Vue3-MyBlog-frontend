<template>
  <div class="search-page">
    <div class="search-shell">
      <section class="hero-panel">
        <div class="hero-text">
          <p class="hero-kicker">Search</p>
          <h1>探索你想看的内容</h1>
          <p>当前支持文章全文检索，后续将扩展到用户与评论。</p>
        </div>

        <div class="hero-form">
          <el-input
            v-model="keywordInput"
            class="keyword-input"
            placeholder="输入关键词，例如 Spring Boot"
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
          <el-tabs v-model="activeType" class="type-tabs" @tab-change="handleTabChange">
            <el-tab-pane label="文章" name="article" />
            <el-tab-pane label="用户（即将支持）" name="user" />
            <el-tab-pane label="评论（即将支持）" name="comment" />
          </el-tabs>

          <el-select
            v-model="sortBy"
            :disabled="activeType !== 'article'"
            class="sort-select"
            placeholder="排序"
            @change="handleSortChange"
          >
            <el-option label="相关度" value="relevance" />
            <el-option label="创建时间" value="createTime" />
            <el-option label="浏览量" value="views" />
            <el-option label="点赞量" value="likes" />
          </el-select>
        </div>
      </section>

      <section class="results-panel">
        <div class="results-header">
          <div class="header-left">
            <h2>搜索结果</h2>
            <el-tag v-if="queryKeyword" type="info">关键词：{{ queryKeyword }}</el-tag>
          </div>
          <p v-if="queryKeyword && activeType === 'article'" class="total-text">共 {{ total }} 条命中</p>
        </div>

        <el-alert
          v-if="activeType !== 'article'"
          title="该搜索类型正在建设中"
          type="info"
          :closable="false"
          show-icon
        />

        <el-alert
          v-else-if="errorMessage"
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

        <el-empty
          v-else-if="!queryKeyword"
          description="输入关键词后开始搜索"
        />

        <div v-else-if="loading && articles.length === 0" class="skeleton-list">
          <el-skeleton v-for="item in 4" :key="item" animated>
            <template #template>
              <el-skeleton-item variant="rect" style="height: 120px; border-radius: 12px" />
            </template>
          </el-skeleton>
        </div>

        <el-empty
          v-else-if="articles.length === 0"
          description="没有匹配到文章，试试更换关键词"
        />

        <div v-else class="result-list">
          <ArticleSearchResultCard
            v-for="article in articles"
            :key="article.id"
            :article="article"
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
import ArticleSearchResultCard from '@/components/search/ArticleSearchResultCard.vue'
import {
  searchArticles,
  type ArticleSearchItem,
  type ArticleSearchQueryDTO,
  type ArticleSearchSortBy,
  type SearchEntityType
} from '@/api/search'

type SearchType = SearchEntityType

const DEFAULT_TYPE: SearchType = 'article'
const DEFAULT_SORT_BY: ArticleSearchSortBy = 'relevance'
const PAGE_LIMIT = 10

const router = useRouter()
const route = useRoute()

const keywordInput = ref('')
const queryKeyword = ref('')
const activeType = ref<SearchType>(DEFAULT_TYPE)
const sortBy = ref<ArticleSearchSortBy>(DEFAULT_SORT_BY)

const loading = ref(false)
const loadingMore = ref(false)
const errorMessage = ref('')

const articles = ref<ArticleSearchItem[]>([])
const total = ref(0)
const loadedCount = ref(0)
const nextSearchAfter = ref<string[] | null>(null)
const noMoreFromServer = ref(false)

const loadMoreTriggerRef = ref<HTMLElement | null>(null)

const hasMore = computed(() => {
  if (activeType.value !== 'article') {
    return false
  }

  if (noMoreFromServer.value) {
    return false
  }

  return loadedCount.value < total.value
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

function normalizeType(typeValue: string): SearchType {
  if (typeValue === 'user' || typeValue === 'comment' || typeValue === 'article') {
    return typeValue
  }

  return DEFAULT_TYPE
}

function normalizeSortBy(value: string): ArticleSearchSortBy {
  if (value === 'createTime' || value === 'views' || value === 'likes' || value === 'relevance') {
    return value
  }

  return DEFAULT_SORT_BY
}

function buildQuery() {
  return {
    keyword: queryKeyword.value || undefined,
    type: activeType.value,
    sortBy: sortBy.value
  }
}

function handleSubmitSearch() {
  const trimmedKeyword = keywordInput.value.trim()
  if (!trimmedKeyword) {
    ElMessage.warning('请输入关键词')
    return
  }

  router.push({
    path: '/search',
    query: {
      keyword: trimmedKeyword,
      type: activeType.value,
      sortBy: sortBy.value
    }
  })
}

function handleTabChange(tabName: string | number) {
  const nextType = normalizeType(String(tabName))

  router.push({
    path: '/search',
    query: {
      ...buildQuery(),
      type: nextType
    }
  })
}

function handleSortChange() {
  if (!queryKeyword.value || activeType.value !== 'article') {
    return
  }

  router.push({
    path: '/search',
    query: {
      ...buildQuery(),
      sortBy: sortBy.value
    }
  })
}

function resetArticleResultState() {
  articles.value = []
  total.value = 0
  loadedCount.value = 0
  nextSearchAfter.value = null
  noMoreFromServer.value = false
}

async function fetchArticleResults(isInitialFetch: boolean) {
  if (!queryKeyword.value) {
    resetArticleResultState()
    return
  }

  if (isInitialFetch) {
    loading.value = true
    errorMessage.value = ''
    noMoreFromServer.value = false
    resetArticleResultState()
  } else {
    if (!hasMore.value || loadingMore.value || loading.value) {
      return
    }

    loadingMore.value = true
  }

  try {
    const params: ArticleSearchQueryDTO = {
      keyword: queryKeyword.value,
      sortBy: sortBy.value,
      limit: PAGE_LIMIT,
      searchAfter: isInitialFetch ? undefined : nextSearchAfter.value || undefined
    }

    const response = await searchArticles(params)
    const incomingRecords = response.records || []

    total.value = response.total || 0
    nextSearchAfter.value = response.searchAfter

    if (incomingRecords.length === 0) {
      noMoreFromServer.value = true
      return
    }

    const deduplicated = incomingRecords.filter((item) => {
      return !articles.value.some((record) => record.id === item.id)
    })

    articles.value = isInitialFetch ? deduplicated : [...articles.value, ...deduplicated]
    loadedCount.value = articles.value.length

    if (loadedCount.value >= total.value) {
      noMoreFromServer.value = true
    }
  } catch (error) {
    console.error('获取搜索结果失败:', error)
    errorMessage.value = '搜索请求失败，请稍后重试'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

function reloadCurrentQuery() {
  if (activeType.value !== 'article' || !queryKeyword.value) {
    return
  }

  fetchArticleResults(true)
}

function loadMore() {
  if (activeType.value !== 'article') {
    return
  }

  fetchArticleResults(false)
}

watch(
  () => route.query,
  () => {
    const currentKeyword = getQueryFirstValue(route.query.keyword).trim()
    const currentType = normalizeType(getQueryFirstValue(route.query.type))
    const currentSortBy = normalizeSortBy(getQueryFirstValue(route.query.sortBy))

    keywordInput.value = currentKeyword
    queryKeyword.value = currentKeyword
    activeType.value = currentType
    sortBy.value = currentSortBy
    errorMessage.value = ''

    if (!currentKeyword || currentType !== 'article') {
      resetArticleResultState()
      return
    }

    fetchArticleResults(true)
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
.search-page {
  min-height: calc(100vh - 64px);
  background:
    radial-gradient(circle at 10% 10%, rgba(111, 195, 255, 0.2), transparent 42%),
    radial-gradient(circle at 90% 20%, rgba(255, 218, 142, 0.24), transparent 35%),
    linear-gradient(180deg, #f5f8ff 0%, #f7fafc 62%, #f2f7ff 100%);
  padding: 28px 20px 36px;
}

.search-shell {
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

.keyword-input {
  width: 100%;
}

.search-btn {
  min-width: 116px;
  border-radius: 12px;
}

.filter-row {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.type-tabs {
  flex: 1;
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
  .search-page {
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

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .sort-select {
    width: 100%;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
