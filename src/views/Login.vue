<template>
  <div class="login-container">
    <div class="login-form">
      <h2 class="login-title">用户登录</h2>
      <el-form 
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-position="top"
      >
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
        <!-- 记住我 & 详细规则 -->
        <el-form-item>
            <div class="rememberandrules">
                <el-checkbox v-model="loginForm.remember">
                    <span>记住我</span>
                </el-checkbox>
                <el-link type="primary" @click="showRulesDialog">
                    <span>详细规则</span>
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
import { login } from '@/api/user'
import { setLocalToken, removeToken, getToken, setSessionToken } from '@/utils/auth'
import { useRouter } from 'vue-router'
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
// 登录功能实现
const handleLogin = () => {
  // 后续自行实现
  login(loginForm).then((res: any) => {
    // 登录成功，存储 Token
  if (loginForm.remember) {
    // 记住我 - 使用本地存储
    setLocalToken(res.token)
  } else {
    // 临时登录 - 使用会话存储
    setSessionToken(res.token)
  }
    // 跳转至首页
    router.push('/')
  }).catch(err => {
    console.error('登录失败:', err)
  })
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
  /* 背景可通过CSS变量自定义 */
  background: var(--login-bg, linear-gradient(135deg, #f3f5f7 0%, #f3f5f7 100%));
  overflow: hidden;
}

/* 登录表单样式 */
.login-form {
  width: 100%;
  max-width: 400px;
  padding: 40px 30px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
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