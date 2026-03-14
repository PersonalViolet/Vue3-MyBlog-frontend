<template>
  <el-card class="result-card" shadow="hover" @click="goToArticleDetail">
    <div class="result-body">
      <div class="text-column">
        <h3 class="result-title" v-html="displayTitle"></h3>

        <p class="result-summary" v-html="displaySummary"></p>

        <div class="meta-row">
          <span class="meta-item">
            <el-icon><User /></el-icon>
            {{ article.author }}
          </span>
          <span class="meta-dot">·</span>
          <span class="meta-item">发布于 {{ formatDate(article.publishedAt || article.createTime) }}</span>
        </div>

        <div class="stats-row">
          <span class="stats-item">
            <el-icon><View /></el-icon>
            {{ article.views || 0 }}
          </span>
          <span class="stats-item">
            <el-icon><Star /></el-icon>
            {{ article.stars || 0 }}
          </span>
          <span class="stats-item">
            <LikeIcon class="like-icon" />
            {{ article.likes || 0 }}
          </span>
        </div>
      </div>

      <div class="cover-column" :class="{ placeholder: !hasCover }">
        <img
          v-if="hasCover"
          :src="coverUrl"
          :alt="article.title"
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
import { useRouter } from 'vue-router'
import { Picture, Star, User, View } from '@element-plus/icons-vue'
import LikeIcon from '@/components/LikeIcon.vue'
import { formatDate } from '@/utils/format-date'
import type { ArticleSearchItem } from '@/api/search'

const props = defineProps<{
  article: ArticleSearchItem
}>()

const router = useRouter()
const coverLoadFailed = ref(false)

const displayTitle = computed(() => props.article.highlightTitle || props.article.title)

const displaySummary = computed(() => props.article.highlightSummary || props.article.summary || '暂无摘要')

const coverUrl = computed(() => props.article.coverAssetUrl?.trim() || '')

const hasCover = computed(() => !!coverUrl.value && !coverLoadFailed.value)

const placeholderText = computed(() => {
  if (coverLoadFailed.value) {
    return '封面加载失败'
  }

  return '暂无封面'
})

watch(coverUrl, () => {
  coverLoadFailed.value = false
})

function handleCoverError() {
  coverLoadFailed.value = true
}

function goToArticleDetail() {
  router.push(`/${props.article.authorId}/${props.article.id}`)
}
</script>

<style scoped>
.result-card {
  margin-bottom: 14px;
  border: 1px solid #edf0f4;
  border-radius: 14px;
  transition: all 0.24s ease;
  cursor: pointer;
}

.result-card:hover {
  border-color: #d6e7ff;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.14);
}

.result-body {
  display: flex;
  gap: 18px;
}

.text-column {
  flex: 1;
  min-width: 0;
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

:deep(em) {
  color: #d77d00;
  background: #fff1ce;
  font-style: normal;
  border-radius: 3px;
  padding: 0 2px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .result-body {
    flex-direction: column;
    gap: 12px;
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
