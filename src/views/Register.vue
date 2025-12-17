<!-- src/views/Register.vue -->
<template>
  <div class="register-container">
    <div class="register-form">
      <h2 class="register-title">用户注册</h2>
      <el-form 
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-position="top"
      >
        <!-- 头像上传 -->
        <div class="avatar-upload-container">
          <el-upload
            class="avatar-uploader"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleAvatarChange"
          >
            <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="avatar-tip">点击上传头像</div>
        </div>

        <!-- 账号 -->
        <el-form-item label="账号" prop="account">
        <el-input 
            v-model="registerForm.account"
            placeholder="请输入账号(不少于6位)"
            clearable
        >
            <template #prefix>
            <el-icon><User /></el-icon>
            </template>
        </el-input>
        </el-form-item>
        <!-- 用户名 -->
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="registerForm.username"
            placeholder="请输入用户名"
            clearable
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 邮箱 -->
        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="registerForm.email"
            placeholder="请输入邮箱地址"
            clearable
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 密码 -->
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 注册码 -->
        <el-form-item label="注册码" prop="registerKey">
          <el-input
            v-model="registerForm.registerKey"
            placeholder="请输入注册码"
            clearable
          >
            <template #prefix>
              <el-icon><Key /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <!-- 注册按钮 -->
        <el-form-item>
          <el-button 
            type="primary" 
            class="register-button"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>
      
      <!-- 已有账号链接 -->
      <div class="login-link">
        已有账号？<el-link type="primary" @click="goToLogin">立即登录</el-link>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus';
import { ref, reactive } from 'vue'
import { User, Lock, Message, Key, Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/auth';
import { uploadFile } from '@/api/file';
import type { UploadFile } from 'element-plus'

// 表单数据
const registerForm = reactive({
  username: '',
  account: '',
  email: '',
  password: '',
  confirmPassword: '',
  registerKey: '',
  avatarUrl: '',
  avatarFile: null as File | null
})

// 表单验证规则
const registerRules = {
    account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 6, message: '账号长度至少6位', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  email: [
    { required: false, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ],
  registerKey: [
    { required: false, message: '请输入注册码', trigger: 'blur' }
  ]
}

// 自定义确认密码验证
function validateConfirmPassword(rule: any, value: string, callback: any) {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 自定义验证规则：email和registerKey至少填写一个
const validateEmailOrRegisterKey = (rule: any, value: string, callback: any) => {
  if (!registerForm.email && !registerForm.registerKey) {
    callback(new Error('邮箱和注册码至少填写一个'))
  } else {
    callback()
  }
}

// 表单引用
const registerFormRef = ref()

// 头像相关
const avatarPreviewUrl = ref<string>('')
// const avatar =  ref<File | null>(null)

const handleAvatarChange = (uploadFile: UploadFile) => {
  // avatar.value = uploadFile.raw as File
  registerForm.avatarFile = uploadFile.raw as File
  avatarPreviewUrl.value = URL.createObjectURL(uploadFile.raw!)
}

const router = useRouter()

// 注册功能实现（你需要在这里实现实际的请求）
const handleRegister = async () => {
  if (!registerFormRef.value) return;
  
  try {
    await registerFormRef.value.validate();
  
    // 调用注册接口
    const res = await register({
      username: registerForm.username,
      account: registerForm.account,
      email: registerForm.email,
      password: registerForm.password,
      registerKey: registerForm.registerKey,
      avatarUrl: registerForm.avatarUrl,
      avatarFile: registerForm.avatarFile
    });
    
    // 处理注册成功逻辑
    // 注册成功弹窗提示
    ElMessage.success({
      message: '注册成功',
      duration: 3000
    });
    
    // 3秒后跳转到登录页面
    setTimeout(() => {
      router.push('/login');
    }, 3000);
  } catch (err) {
    console.error('注册失败:', err);
    // 处理注册失败逻辑，例如显示错误消息
    ElMessage.error({
      message: '注册失败，请重试',
      duration: 3000
    });
  }
};

// 跳转到登录页
const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
/* 注册容器样式 */
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: var(--login-bg, linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%));
  overflow: hidden;
}

/* 注册表单样式 */
.register-form {
  width: 100%;
  max-width: 400px;
  padding: 40px 30px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
}

/* 注册标题样式 */
.register-title {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
  font-size: 24px;
}

/* 注册按钮样式 */
.register-button {
  width: 100%;
  margin-top: 20px;
}

/* 头像上传容器样式 */
.avatar-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

/* 头像上传区域 */
.avatar-uploader .avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 1px dashed #d9d9d9;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-tip {
  margin-top: 10px;
  font-size: 14px;
  color: #666;
}

/* 登录链接样式 */
.login-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
}
</style>