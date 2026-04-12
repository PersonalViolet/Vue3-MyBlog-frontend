<template>
  <div class="article-tag-input">
    <div v-if="props.modelValue.length > 0" class="tag-list">
      <el-tag
        v-for="tag in props.modelValue"
        :key="tag"
        closable
        class="tag-item"
        @close="removeTag(tag)"
      >
        {{ tag }}
      </el-tag>
    </div>

    <el-input
      v-if="inputVisible"
      ref="tagInputRef"
      v-model="inputValue"
      class="tag-editor-input"
      size="small"
      :maxlength="props.maxTagLength"
      show-word-limit
      placeholder="输入标签并按 Enter"
      @keyup.enter.prevent="tryAddTag"
      @blur="handleInputBlur"
    />

    <el-button
      v-else
      round
      class="tag-add-button"
      :disabled="isMaxReached"
      @click="showInput"
    >
      {{ props.addButtonText }}
    </el-button>

    <span class="tag-count">{{ props.modelValue.length }}/{{ props.maxTags }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ElInput, ElMessage } from 'element-plus'

interface Props {
  modelValue: string[]
  maxTags?: number
  maxTagLength?: number
  addButtonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxTags: 5,
  maxTagLength: 10,
  addButtonText: '新增标签'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const inputVisible = ref(false)
const inputValue = ref('')
const tagInputRef = ref<InstanceType<typeof ElInput> | null>(null)

const isMaxReached = computed(() => props.modelValue.length >= props.maxTags)

function showInput() {
  if (isMaxReached.value) {
    ElMessage.warning(`最多添加 ${props.maxTags} 个标签`)
    return
  }

  inputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

function closeInput() {
  inputVisible.value = false
  inputValue.value = ''
}

function tryAddTag() {
  const value = inputValue.value.trim()

  if (!value) {
    closeInput()
    return
  }

  if (value.length > props.maxTagLength) {
    ElMessage.warning(`单个标签最多 ${props.maxTagLength} 个字`)
    nextTick(() => {
      tagInputRef.value?.focus()
    })
    return
  }

  if (props.modelValue.includes(value)) {
    ElMessage.warning('标签不能重复')
    nextTick(() => {
      tagInputRef.value?.focus()
    })
    return
  }

  if (isMaxReached.value) {
    ElMessage.warning(`最多添加 ${props.maxTags} 个标签`)
    closeInput()
    return
  }

  emit('update:modelValue', [...props.modelValue, value])
  closeInput()
}

function handleInputBlur() {
  // 延迟到下一个事件循环，避免与 Enter 提交发生冲突。
  setTimeout(() => {
    if (!inputVisible.value) {
      return
    }
    tryAddTag()
  }, 0)
}

function removeTag(tag: string) {
  emit(
    'update:modelValue',
    props.modelValue.filter((item) => item !== tag)
  )
}
</script>

<style scoped>
.article-tag-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  min-height: 34px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tag-item {
  margin: 0;
}

.tag-editor-input {
  width: 220px;
  max-width: 100%;
}

.tag-add-button {
  border-radius: 999px;
  border-style: dashed;
  padding-inline: 18px;
}

.tag-count {
  margin-left: auto;
  color: #909399;
  font-size: 12px;
}

@media (max-width: 768px) {
  .tag-editor-input {
    width: 100%;
  }

  .tag-count {
    width: 100%;
    margin-left: 0;
  }
}
</style>
