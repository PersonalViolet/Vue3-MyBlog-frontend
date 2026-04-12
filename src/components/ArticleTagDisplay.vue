<template>
  <div v-if="tags.length > 0" class="article-tag-display" aria-label="文章标签">
    <button
      v-for="tag in tags"
      :key="tag.tagId"
      type="button"
      class="tag-chip"
      @click="handlePrimaryClick(tag, $event)"
      @auxclick="handleAuxClick(tag, $event)"
    >
      #{{ tag.displayName }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { TagVO } from '@/api/article/userArticleApi'
import { el } from 'element-plus/es/locales.mjs';

export interface TagActivatePayload {
  tag: TagVO
  openInNewTab: boolean
}

interface Props {
  tags: TagVO[]
}

defineProps<Props>()

const emit = defineEmits<{
  (e: 'tag-activate', payload: TagActivatePayload): void
}>()

function handlePrimaryClick(tag: TagVO, event: MouseEvent) {
  emit('tag-activate', {
    tag,
    openInNewTab: event.ctrlKey || event.metaKey
  })
}

function handleAuxClick(tag: TagVO, event: MouseEvent) {
  if (event.button !== 1) {
    return
  }

  event.preventDefault()
  emit('tag-activate', {
    tag,
    openInNewTab: true
  })
}
</script>

<style scoped>
.article-tag-display {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0px 0 0;
}

.tag-chip {
  border: 1px solid #d9ecff;
  background-color: #ecf5ff;
  color: #409eff;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  line-height: 1.2;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-chip:hover {
  border-color: #409eff;
  background-color: #d9ecff;
}

.tag-chip:focus-visible {
  outline: 2px solid #409eff;
  outline-offset: 1px;
}
</style>
