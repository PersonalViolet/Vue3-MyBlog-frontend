<template>
  <div :class="['login-container', { 'login-container--modal': modalMode }]">
    <div class="login-form">
      <h2 class="login-title">用户登录</h2>
      <el-form 
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-position="top"
      >
        <!-- 头像 -->
        <div class="avatar-container">
          <img :src="defaultAvatar" alt="Default Avatar" class="default-avatar" />
        </div>
        <!-- 账号 & 密码 -->
        <el-form-item label="账号" prop="account">
          <el-input 
            v-model="loginForm.account"
            placeholder="请输入账号"
            clearable
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <!-- 记住我 & 详细说明 -->
        <el-form-item>
            <div class="rememberandrules">
                <el-checkbox v-model="loginForm.remember">
                    <span>记住我</span>
                </el-checkbox>
                <el-link type="primary" @click="showRulesDialog">
                    <span>详细说明</span>
                </el-link>
            </div>
        </el-form-item>
        <!-- 登录按钮 -->
        <el-form-item>
          <el-button 
            type="primary" 
            class="login-button"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
        <!-- 新增注册按钮 -->
        <el-form-item>
          <el-button 
            type="default" 
            class="register-button"
            @click="goToRegister"
          >
            注册账号
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- 规则说明对话框 -->
    <el-dialog
            v-model="rulesDialogVisible"
            title="规则说明"
        >
        <span>这里是规则说明的处理逻辑</span>
        <template #footer>
        <span class="dialog-footer">
            <el-button type="info" @click="rulesDialogCancel">
            取消
            </el-button>
            <el-button type="primary" @click="rulesDialogConfirm">
            确认
            </el-button>
        </span>
        </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '@/api/auth';
import { setLocalToken, removeToken, setSessionToken } from '@/utils/auth'
import { useRouter } from 'vue-router'
import defaultAvatar from '@/assets/icons/defaultAvatar.svg'
import {
    setUserInfoItem, 
    removeUserInfoItem,
    setSessionUserInfoItem,
  removeSessionUserInfoItem
 } from '@/utils/Storage'
 import { 
  type UserLoginVO
 } from '@/api/auth/loginApi'
 import { useUserStore } from '@/stores/user'

const props = withDefaults(defineProps<{
  modalMode?: boolean
}>(), {
  modalMode: false
})

const emit = defineEmits<{
  (e: 'switch-to-register'): void
  (e: 'success'): void
}>()

// 表单数据
const loginForm = reactive({
  account: '',
  password: '',
  remember: false
})

// 表单验证规则
const loginRules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

// 表单引用
const loginFormRef = ref()

const router = useRouter()
const userStore = useUserStore()

// 登录功能实现
const handleLogin = () => {
  // 后续自行实现
  login(loginForm).then((res: UserLoginVO) => {
  removeUserInfoItem()
  removeSessionUserInfoItem()
  removeToken()
    // 登录成功，存储 Token
  if (loginForm.remember) {
    // 记住我 - 使用本地存储
    setLocalToken(res.token)
    // 存储用户信息
    setUserInfoItem(res.userInfoVO)
    
  } else {
    // 临时登录 - 使用会话存储
    setSessionToken(res.token)
    // 存储用户信息
    setSessionUserInfoItem(res.userInfoVO)
  }
    
    // 更新 Pinia 状态
    userStore.refreshUserInfoFromStorage()

    if (props.modalMode) {
      emit('success')
      return
    }

    // 跳转至首页
    router.push('/')
  }).catch(err => {
    console.error('登录失败:', err)
  })
}
// 跳转到注册页面
const goToRegister = () => {
  if (props.modalMode) {
    emit('switch-to-register')
    return
  }

  router.push('/register')
}

/** 详细规则对话框 */
const rulesDialogVisible = ref(false)
function showRulesDialog() {
  rulesDialogVisible.value = true
}
function rulesDialogConfirm() {
  rulesDialogVisible.value = false
}
function rulesDialogCancel() {
  rulesDialogVisible.value = false
}

</script>

<style scoped>

/* 登录容器样式 */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  /* 更柔和的背景色选项 */
  background: var(--login-bg, linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%));
  overflow: hidden;
}

.login-container--modal {
  height: auto;
  min-height: 0;
  padding: 0;
  background: transparent;
}

.login-container--modal .login-form {
  max-width: none;
  margin: 0;
  padding: 34px 28px 24px;
}

/* 登录表单样式 */
.login-form {
  width: 100%;
  max-width: 400px;
  padding: 40px 30px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

/* 头像容器样式 */
.avatar-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

/* 头像图片样式 */
.default-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

/* 登录标题样式 */
.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
}

/* 登录按钮样式 */
.login-button {
  width: 100%;
  margin-top: 20px;
}

/* 注册按钮样式 */
.register-button {
  width: 100%;
}

/* 表单额外内容样式 */
.form-extra {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

/* 弹窗底部样式 */
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 10px;
}

/* 记住我和详细规则样式 */
.rememberandrules {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

</style>