import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import { getToken } from '@/utils/auth';
import Register from '@/views/Register.vue';
import Person from '@/views/Person.vue';

interface Routermeta {
  requiresAuth: boolean; // 是否需要登录
  title: string; // 页面标题
  permissions: string[] | null; // 访问权限控制
}


const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: false, // 标记该路由需要登录才能访问
      title: '首页', // 页面标题
      permissions: null // 访问权限控制
    }
  },
  {
    path: '/Login',
    name: 'Login',
    component: Login,
    meta: {
      requiresAuth: false, // 标记该路由需要登录才能访问
      title: '登录', // 页面标题
      permissions: null // 访问权限控制
    }
  },
    {
    path: '/Register',
    name: 'Register',
    component: Register,
    meta: {
      requiresAuth: false, // 标记该路由需要登录才能访问
      title: '注册', // 页面标题
      permissions: null // 访问权限控制
    }
  },
    {
    path: '/Person',
    name: 'Person',
    component: Person,
    meta: {
      requiresAuth: false, // 标记该路由需要登录才能访问
      title: '个人中心', // 页面标题
      permissions: null // 访问权限控制
    }
  }
]
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to ,from, next) => {
  // to：要去的目标路由（比如首页）
  // from：从哪个路由来（比如登录页）
  // next：放行/跳转的函数（必须调用，否则路由会卡住）
  if (to.meta.requiresAuth) {
    const token = getToken()
    // 简单校验 JWT 格式（三段式 + Base64 特征）
    const isTokenValidFormat = token && token.split('.').length === 3;
    if (token && isTokenValidFormat) {
      next()
    } else {
      next('/Login')
    }
  }else {
    next()
  }
})

// 全局后置守卫：跳转后执行
router.afterEach((to) => {
  // 跳转后修改页面标题（假设路由配置中 meta 有 title）
  if (typeof to.meta.title === 'string'){
    document.title = to.meta.title || '默认标题'
  }
  
})

export default router
