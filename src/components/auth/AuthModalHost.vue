<template>
  <el-dialog
    v-model="authModalState.visible"
    width="560px"
    class="auth-dialog"
    :show-close="false"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :append-to-body="true"
    :destroy-on-close="false"
  >
    <div class="auth-dialog-inner">
      <button
        class="auth-close-btn"
        type="button"
        aria-label="关闭认证弹窗"
        @click="closeAuthModal"
      >
        <el-icon><Close /></el-icon>
      </button>

      <transition :name="transitionName" mode="out-in">
        <Login
          v-if="authModalState.mode === 'login'"
          key="login"
          :modal-mode="true"
          @switch-to-register="handleSwitchToRegister"
          @success="handleLoginSuccess"
        />
        <Register
          v-else
          key="register"
          :modal-mode="true"
          @switch-to-login="handleSwitchToLogin"
          @register-success="handleRegisterSuccess"
        />
      </transition>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Close } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import {
  authModalState,
  closeAuthModal,
  consumePendingRoute,
  switchAuthMode
} from '@/utils/authModal'

const router = useRouter()
const switchDirection = ref<'forward' | 'backward'>('forward')

const transitionName = computed(() => {
  return switchDirection.value === 'forward'
    ? 'auth-switch-forward'
    : 'auth-switch-backward'
})

function handleSwitchToRegister() {
  switchDirection.value = 'forward'
  switchAuthMode('register')
}

function handleSwitchToLogin() {
  switchDirection.value = 'backward'
  switchAuthMode('login')
}

function handleRegisterSuccess() {
  handleSwitchToLogin()
}

function handleLoginSuccess() {
  closeAuthModal()

  const pendingRoute = consumePendingRoute()
  if (pendingRoute && pendingRoute !== router.currentRoute.value.fullPath) {
    router.push(pendingRoute)
  }
}
</script>

<style scoped>
.auth-dialog-inner {
  position: relative;
  overflow: visible;
}

:deep(.auth-dialog .el-dialog) {
  background: transparent;
  border: none;
  box-shadow: none;
  overflow: visible;
}

:deep(.auth-dialog .el-dialog__header) {
  display: none;
  padding: 0;
  margin: 0;
}

:deep(.auth-dialog .el-dialog__body) {
  padding: 0;
  background: transparent;
}

.auth-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.88);
  color: #4a4a4a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.auth-close-btn:hover {
  transform: scale(1.06);
  background: #ffffff;
}

.auth-switch-forward-enter-active,
.auth-switch-forward-leave-active,
.auth-switch-backward-enter-active,
.auth-switch-backward-leave-active {
  transition: opacity 0.32s ease, transform 0.32s ease;
}

.auth-switch-forward-enter-from,
.auth-switch-backward-leave-to {
  opacity: 0;
  transform: translateX(24px);
}

.auth-switch-forward-leave-to,
.auth-switch-backward-enter-from {
  opacity: 0;
  transform: translateX(-24px);
}

@media (max-width: 768px) {
  :deep(.auth-dialog .el-dialog) {
    width: 95vw !important;
  }

  .auth-close-btn {
    top: 8px;
    right: 8px;
  }
}
</style>
