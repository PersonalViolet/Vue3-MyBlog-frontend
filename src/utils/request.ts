import axios from 'axios'
import { ElMessage, ElLoading } from 'element-plus' // 若使用 Element Plus，用于提示和加载动画
import { getToken, removeToken } from './auth' // 假设存在 auth.js 管理 Token（见下文）
import { openLogin } from './authModal'


// 创建 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API, // 从环境变量获取基础路径（适配不同环境）
  timeout: 5000 // 超时时间（毫秒）
})

// 加载动画实例（全局唯一）
//let loadingInstance: ReturnType<typeof ElLoading.service> | null = null

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 1. 显示加载动画（可选，大型表单提交时体验更好）
    // loadingInstance = ElLoading.service({
    //   lock: true,
    //   text: '加载中...',
    //   background: 'rgba(0, 0, 0, 0.1)'
    // })

    // 2. 携带 Token（从本地存储获取，如 localStorage/sessionStorage）
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}` // 与后端约定的 Token 格式（如 Bearer + 空格 + Token）
    }

    // 3. 处理 GET 请求参数序列化（Axios 已自动处理，可省略）
    if (config.method === 'get') {
      config.params = { ...config.params } // 确保 params 存在
    }

    return config
  },
  (error) => {
    // 请求错误时关闭加载动画
    //if (loadingInstance) loadingInstance.close()
    ElMessage.error('请求参数错误：' + error.message)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    // 关闭加载动画
    //if (loadingInstance) loadingInstance.close()

    const res = response.data // 后端返回的 JSON 数据

    // 1. 处理业务错误（根据后端接口规范调整）
    // 假设后端统一返回格式：{ code: 200, msg: "成功", data: {} }
    if (res.code !== 200) {
      // 2001: Token 过期；2002: 无权限；其他：业务错误
      if (res.code === 2001) {
        ElMessage.error('登录已过期，请重新登录')
        removeToken() // 清除无效 Token
        openLogin({ source: '2001' })
      } else {
        ElMessage.error(res.msg || '操作失败')
      }
      return Promise.reject(new Error(res.msg || 'Error'))
    }

    // 2. 成功响应：直接返回 data 字段（简化前端使用）
    return res.data
  },
  (error) => {
    // 关闭加载动画
    //if (loadingInstance) loadingInstance.close()

    // 处理 HTTP 错误（网络错误、服务器错误等）
    let errorMsg = '网络异常，请稍后重试'
    if (error.response) {
      switch (error.response.status) {
        case 400:
          errorMsg = error.response.data?.msg || '请求参数错误';
          break
        case 401:
          errorMsg = '未授权，请重新登录'
          removeToken()
          openLogin({ source: '401' })
          break
        case 403:
          errorMsg = '没有权限访问'
          break
        case 404:
          errorMsg = '请求地址不存在'
          break
        case 500:
          errorMsg = '服务器内部错误'
          break
        default:
          errorMsg = `请求错误（${error.response.status})`
      }
    }
    ElMessage.error(errorMsg)
    return Promise.reject(error)
  }
)

export default request