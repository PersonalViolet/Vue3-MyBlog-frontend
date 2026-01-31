<template>
  <el-popover
    :placement="placement"
    :width="320"
    trigger="hover"
    :show-after="200"
    :hide-after="200"
    transition="el-zoom-in-top"
    popper-class="user-hover-card-popper"
    @show="handleShow"
  >
    <template #reference>
      <div class="user-hover-trigger" @click="handleClick">
        <slot></slot>
      </div>
    </template>

    <div class="user-hover-card" v-loading="loading">
      <div v-if="error" class="error-tip">
        {{ error }}
      </div>
      <template v-else-if="userInfo">
        <div class="card-header">
          <el-avatar :size="50" :src="userInfo.avatarUrl || defaultAvatar" />
          <div class="user-basic">
            <div class="username">{{ userInfo.username || '用户' + userId }}</div>
            <div class="intro">{{ userInfo.intro || '这个人很懒，什么都没有写~' }}</div>
          </div>
        </div>
        
        <div class="card-stats">
          <div class="stat-item">
            <div class="count">{{ userInfo.articleCount || 0 }}</div>
            <div class="label">文章</div>
          </div>
          <div class="stat-item">
            <div class="count">{{ userInfo.starCount || 0 }}</div>
            <div class="label">获赞</div>
          </div>
          <div class="stat-item">
            <div class="count">{{ userInfo.likeCount || 0 }}</div>
            <div class="label">粉丝</div>
          </div>
        </div>
      </template>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserProfile, type UserProfileVO } from '@/api/user/UserProfileApi'
import defaultAvatar from '@/assets/icons/defaultAvatar.svg'

const props = withDefaults(defineProps<{
  userId: number
  initialUserInfo?: UserProfileVO
  placement?: string
}>(), {
  placement: 'bottom'
})

const router = useRouter()
const loading = ref(false)
const error = ref('')
const userInfo = ref<UserProfileVO | undefined>(props.initialUserInfo)
const dataLoaded = ref(!!props.initialUserInfo)
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

onUnmounted(() => {
  isMounted.value = false
})

watch(() => props.initialUserInfo, (newVal) => {
  if (newVal) {
    userInfo.value = newVal
    dataLoaded.value = true
  }
})

async function handleShow() {
  if (dataLoaded.value || loading.value) return
  
  loading.value = true
  error.value = ''
  try {
    const res = await getUserProfile(props.userId)
    if (isMounted.value) {
      userInfo.value = res
      dataLoaded.value = true
    }
  } catch (err) {
    console.error('Failed to fetch user profile', err)
    if (isMounted.value) {
      error.value = '获取用户信息失败'
    }
  } finally {
    if (isMounted.value) {
      loading.value = false
    }
  }
}

function handleClick() {
  router.push({
    path: '/Person',
    query: { userId: props.userId }
  })
}
</script>

<style lang="scss">
.user-hover-card-popper {
  padding: 0 !important;
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  border: none !important;
}
</style>

<style lang="scss" scoped>
.user-hover-trigger {
  display: inline-block;
  cursor: pointer;
}

.user-hover-card {
  padding: 20px;
  background: #fff;
  min-height: 120px;
}

.card-header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  
  .user-basic {
    flex: 1;
    overflow: hidden;
    
    .username {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .intro {
      font-size: 12px;
      color: #999;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}

.card-stats {
  display: flex;
  justify-content: space-around;
  
  .stat-item {
    text-align: center;
    
    .count {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 2px;
    }
    
    .label {
      font-size: 12px;
      color: #999;
    }
  }
}

.error-tip {
  color: #f56c6c;
  text-align: center;
  padding: 20px;
  font-size: 13px;
}
</style>
