<template>

</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { createInserter, getArticleComments, type CommentVO } from '@/api/comment/CommentApi'

const props = defineProps<{
    articleId: number;
}>()

type TopCursor = {
  id: number | null;
  likeCount: number | null;
  createTime: string | null;
}
type createTimeCursor = {
  id: number | null;
  createTime: string | null;
}
// 查询方式
const sortBy = ref<'hot' | 'time'>('hot')

// 一级评论的 cursor
const level1TopCursor = ref<TopCursor>({
  id: null,
  likeCount: null,
  createTime: null
})
const level1CreateTimeCursor = ref<createTimeCursor>({
  id: null,
  createTime: null
})

// 普通评论的 cursor        id -> cursor
const commentIdTocreateTimeCursorMap = new Map<number, createTimeCursor>()
const commentIdToTopCursorMap = new Map<number, TopCursor>()

// 评论树
const commentsTree = ref<CommentVO[]>([])

onMounted(() => { 
    getArticleComments(props.articleId)
})
</script>