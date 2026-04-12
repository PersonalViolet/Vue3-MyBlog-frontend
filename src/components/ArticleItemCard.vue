<template>
  <el-card class="article-item-card" shadow="hover" @click="handleSelect">
    <div class="card-body">
      <div class="text-column">
        <div class="title-row">
          <h3 class="result-title">{{ articleTitle }}</h3>
          <div class="status-tags">
            <el-tag
              v-if="statusTag"
              :type="statusTag.type"
              size="small"
              effect="plain"
            >
              {{ statusTag.text }}
            </el-tag>
            <el-tag
              v-if="visibilityTag"
              :type="visibilityTag.type"
              size="small"
              effect="plain"
            >
              {{ visibilityTag.text }}
            </el-tag>
          </div>
        </div>

        <p class="result-summary">{{ articleSummary }}</p>

        <div class="meta-row">
          <span class="meta-item">
            <el-icon><User /></el-icon>
            {{ authorLabel }}
          </span>
          <span class="meta-dot">·</span>
          <span class="meta-item">发布于 {{ publishTime }}</span>
        </div>

        <div class="stats-row">
          <span class="stats-item">
            <el-icon><View /></el-icon>
            {{ viewsCount }}
          </span>
          <span class="stats-item">
            <el-icon><Star /></el-icon>
            {{ starsCount }}
          </span>
          <span class="stats-item">
            <LikeIcon class="like-icon" />
            {{ likesCount }}
          </span>
        </div>
      </div>

      <div class="cover-column" :class="{ placeholder: !hasCover }">
        <img
          v-if="hasCover"
          :src="coverUrl"
          :alt="articleTitle"
          class="cover-image"
          @error="handleCoverError"
        />
        <div v-else class="cover-placeholder">
          <el-icon><Picture /></el-icon>
          <span>{{ placeholderText }}</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Picture, Star, User, View } from '@element-plus/icons-vue'
import LikeIcon from '@/components/LikeIcon.vue'
import { formatDate } from '@/utils/format-date'

export interface ArticleItem {
  id: number | string
  title?: string | null
  summary?: string | null
  coverAssetId?: number | string | null
  cover_asset_id?: number | string | null
  coverAssetUrl?: string | null
  cover_asset_url?: string | null
  likes?: number | string | null
  stars?: number | string | null
  views?: number | string | null
  isShow?: number | string | null
  is_show?: number | string | null
  status?: number | string | null
  contentFormat?: string | null
  content_format?: string | null
  contentJson?: unknown
  content_json?: unknown
  version?: number | string | null
  publishedAt?: string | null
  published_at?: string | null
  remark?: string | null
  adminCreateBy?: number | string | null
  admin_create_by?: number | string | null
  userCreateBy?: number | string | null
  user_create_by?: number | string | null
  createTime?: string | null
  create_time?: string | null
  adminUpdateBy?: number | string | null
  admin_update_by?: number | string | null
  userUpdateBy?: number | string | null
  user_update_by?: number | string | null
  updateTime?: string | null
  update_time?: string | null
  username?: string | null
}

const props = defineProps<{
  article: ArticleItem
}>()

const emit = defineEmits<{
  (e: 'select', article: ArticleItem): void
}>()

const coverLoadFailed = ref(false)

function toCount(value: number | string | null | undefined): number {
  const count = Number(value)
  if (!Number.isFinite(count)) {
    return 0
  }

  return count
}

function toNullableInt(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return null
  }

  return Math.floor(parsed)
}

const articleTitle = computed(() => {
  const title = props.article.title?.trim()
  return title || '未命名文章'
})

const articleSummary = computed(() => {
  const summary = props.article.summary?.trim()
  return summary || '暂无摘要'
})

const coverUrl = computed(() => {
  const rawUrl = (props.article.coverAssetUrl ?? props.article.cover_asset_url ?? '').toString().trim()
  return rawUrl
})

const hasCover = computed(() => {
  return !!coverUrl.value && !coverLoadFailed.value
})

const placeholderText = computed(() => {
  return coverLoadFailed.value ? '封面加载失败' : '暂无封面'
})

const authorId = computed(() => {
  return toNullableInt(props.article.userCreateBy ?? props.article.user_create_by)
})

const authorLabel = computed(() => {
  if (authorId.value === null || authorId.value <= 0) {
    return '未知作者'
  }

  return `${props.article.username ?? '用户 ' + authorId.value}`
})

const publishRaw = computed(() => {
  return (
    props.article.publishedAt ??
    props.article.published_at ??
    props.article.createTime ??
    props.article.create_time ??
    ''
  )
})

const publishTime = computed(() => {
  return formatDate(publishRaw.value ? String(publishRaw.value) : undefined)
})

const viewsCount = computed(() => toCount(props.article.views))
const starsCount = computed(() => toCount(props.article.stars))
const likesCount = computed(() => toCount(props.article.likes))

const statusTag = computed<null | { text: string; type: 'success' | 'info' | 'warning' | 'danger' }>(() => {
  const status = toNullableInt(props.article.status)
  if (status === null) {
    return null
  }

  if (status === 0) {
    return { text: '草稿', type: 'info' }
  }
  if (status === 1) {
    return { text: '已发布', type: 'success' }
  }
  if (status === 2) {
    return { text: '已归档', type: 'warning' }
  }

  return { text: `状态 ${status}`, type: 'danger' }
})

const visibilityTag = computed<null | { text: string; type: 'danger' }>(() => {
  const isShow = toNullableInt(props.article.isShow ?? props.article.is_show)
  if (isShow === 0) {
    return { text: '已隐藏', type: 'danger' }
  }

  return null
})

watch(coverUrl, () => {
  coverLoadFailed.value = false
})

function handleCoverError() {
  coverLoadFailed.value = true
}

function handleSelect() {
  emit('select', props.article)
}
</script>

<style scoped>
.article-item-card {
  margin-bottom: 14px;
  border: 1px solid #edf0f4;
  border-radius: 14px;
  transition: all 0.24s ease;
  cursor: pointer;
}

.article-item-card:hover {
  border-color: #d6e7ff;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.14);
}

.card-body {
  display: flex;
  gap: 18px;
}

.text-column {
  flex: 1;
  min-width: 0;
}

.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.status-tags {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}

.result-title {
  margin: 0;
  color: #1f2937;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.45;
}

.result-summary {
  margin: 10px 0;
  color: #4b5563;
  line-height: 1.7;
  font-size: 14px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #7b8696;
  font-size: 13px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.meta-dot {
  color: #c7cfdb;
}

.stats-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 18px;
  color: #5f6b7c;
  font-size: 13px;
}

.stats-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.like-icon {
  width: 16px;
  height: 16px;
}

.cover-column {
  width: 150px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f2f6ff, #e6f1ff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}

.cover-column.placeholder {
  border: 1px dashed #c8d8f0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7e9a;
  font-size: 12px;
  gap: 6px;
  text-align: center;
  padding: 8px;
}

.cover-placeholder .el-icon {
  font-size: 24px;
}

@media (max-width: 768px) {
  .card-body {
    flex-direction: column;
    gap: 12px;
  }

  .title-row {
    flex-direction: column;
  }

  .cover-column {
    width: 100%;
    height: 90px;
  }

  .result-title {
    font-size: 17px;
  }
}
</style>
