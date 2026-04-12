import { reactive } from 'vue'

export type AuthModalMode = 'login' | 'register'

export type AuthModalSource =
  | 'manual'
  | '401'
  | '2001'
  | 'route-guard'
  | 'comment-submit'
  | 'comment-vote'
  | 'editor-access'

interface AuthModalState {
  visible: boolean
  mode: AuthModalMode
  source: AuthModalSource
  pendingRoute: string | null
}

interface OpenAuthModalOptions {
  source?: AuthModalSource
  pendingRoute?: string | null
}

export const authModalState = reactive<AuthModalState>({
  visible: false,   // 弹窗是否可见
  mode: 'login',    // 组件模式：登录或注册
  source: 'manual',   // 弹窗来源：手动打开、401、2001、route-guard、comment-submit、comment-vote、editor-access
  pendingRoute: null    // 待跳转的路由
})

function openAuthModal(mode: AuthModalMode, options: OpenAuthModalOptions = {}) {
  authModalState.mode = mode
  authModalState.visible = true
  authModalState.source = options.source ?? 'manual'

  if (options.pendingRoute !== undefined) {
    authModalState.pendingRoute = options.pendingRoute
  }
}

export function openLogin(options: OpenAuthModalOptions = {}) {
  openAuthModal('login', options)
}

export function openRegister(options: OpenAuthModalOptions = {}) {
  openAuthModal('register', options)
}

export function switchAuthMode(mode: AuthModalMode) {
  authModalState.mode = mode
}

export function closeAuthModal() {
  authModalState.visible = false
}

export function consumePendingRoute() {
  const route = authModalState.pendingRoute
  authModalState.pendingRoute = null
  return route
}
