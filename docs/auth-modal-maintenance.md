# 认证弹窗维护文档

## 目标

当前认证交互目标如下：

1. 401 或需要登录的操作触发时，不跳转页面，在当前页弹出认证弹窗。
2. 认证弹窗只展示登录或注册卡片本体，不出现额外白边。
3. 弹窗右上角提供小叉关闭按钮。
4. 登录与注册之间支持平滑切换动画。
5. 保留 /Login 和 /Register 独立页面能力。

## 关键文件

1. src/utils/authModal.ts
作用：全局认证弹窗状态与动作。

2. src/components/auth/AuthModalHost.vue
作用：全局弹窗宿主，负责渲染登录/注册、关闭按钮、切换动画、登录成功后的收口逻辑。

3. src/views/Login.vue
作用：登录表单；支持独立页面模式和弹窗模式。

4. src/views/Register.vue
作用：注册表单；支持独立页面模式和弹窗模式。

5. src/App.vue
作用：挂载 AuthModalHost，保证任意页面可弹出。

6. src/utils/request.ts
作用：401/2001 时触发 openLogin，而不是跳转 /Login。

7. src/router/index.ts
作用：requiresAuth 未通过时阻止导航并弹出登录。

8. src/components/CommentInput.vue
作用：评论提交前未登录时触发弹窗。

9. src/components/CommentItem.vue
作用：点赞/点踩前未登录时触发弹窗。

10. src/views/ArticleEditor.vue
作用：编辑器挂载兜底未登录时触发弹窗。

## 状态模型

文件：src/utils/authModal.ts

状态字段：

1. visible
弹窗可见性。

2. mode
当前面板类型：login 或 register。

3. source
触发来源，用于后续埋点或问题排查。

4. pendingRoute
路由守卫拦截时暂存目标路由，登录成功后可恢复跳转。

常用动作：

1. openLogin(options)
打开登录面板。

2. openRegister(options)
打开注册面板。

3. switchAuthMode(mode)
在登录与注册之间切换。

4. closeAuthModal()
关闭弹窗。

5. consumePendingRoute()
消费并清空 pendingRoute。

## 触发链路

### 1) 接口失效触发

request.ts 中：

1. 业务码 2001
2. HTTP 状态 401

处理：

1. 清 token
2. 提示消息
3. 调用 openLogin({ source: '2001' | '401' })

### 2) 路由守卫触发

router/index.ts 中：

1. requiresAuth 路由无 token 或 token 格式无效
2. openLogin({ source: 'route-guard', pendingRoute: to.fullPath })
3. next(false) 阻止跳转

### 3) 页面操作触发

1. 评论提交：CommentInput.vue
2. 评论投票：CommentItem.vue
3. 编辑器兜底：ArticleEditor.vue

统一调用 openLogin 并保留提示。

## 弹窗视觉结构

文件：src/components/auth/AuthModalHost.vue

1. el-dialog 外壳设为透明背景。
2. 隐藏 el-dialog 默认头部。
3. 右上角使用自定义小叉按钮，点击调用 closeAuthModal。
4. 真正展示内容由 Login.vue 或 Register.vue 卡片承担。

这套结构保证弹窗只保留业务卡片，不出现额外白边。

## 登录与注册双模式

Login.vue 与 Register.vue 均支持 modalMode。

1. modalMode = false
独立路由页面模式，保留原跳转逻辑。

2. modalMode = true
弹窗模式，不做路由跳转，改为 emit 事件：

- Login.vue
  - switch-to-register
  - success

- Register.vue
  - switch-to-login
  - register-success

AuthModalHost 接收事件后：

1. 执行面板切换动画
2. 登录成功后关闭弹窗
3. 如存在 pendingRoute 则恢复跳转

## 动画维护

文件：src/components/auth/AuthModalHost.vue

当前动画：

1. auth-switch-forward
2. auth-switch-backward

方式：

1. transition mode 使用 out-in
2. 通过 switchDirection 控制前进或后退方向
3. 样式为 translateX + opacity 组合

维护建议：

1. 只改 transform 与 opacity，不要引入高度动画，避免表单抖动。
2. 动画时长建议保持 0.28s 到 0.36s 区间。
3. 移动端仍沿用同一动画，避免双套维护。

## 新增一个“需要登录”的触发点步骤

示例：某按钮点击时需要登录。

1. 在对应组件导入 openLogin：
   from '@/utils/authModal'

2. 判断登录态（如 userStore.userInfo?.id）。

3. 未登录时执行：
   openLogin({ source: '你的来源标识' })

4. 立即 return，避免继续发请求。

## 常见问题排查

1. 弹窗没出现

检查项：

1. App.vue 是否挂载 AuthModalHost。
2. 触发点是否实际调用 openLogin。
3. 是否有其他逻辑立即 closeAuthModal。

2. 登录成功后没有回跳

检查项：

1. 路由守卫触发时是否写入 pendingRoute。
2. handleLoginSuccess 是否调用 consumePendingRoute。
3. pendingRoute 是否与当前 fullPath 相同。

3. 出现白边或空隙

检查项：

1. AuthModalHost 的 el-dialog 是否仍有默认 header/body padding。
2. Login/Register 在 modalMode 下是否还有外层 padding。
3. 是否把 dialog 宽度设得远大于卡片宽度。

4. 小叉不在右上角

检查项：

1. auth-dialog-inner 是否 position: relative。
2. auth-close-btn 是否 absolute + z-index。

## 验证清单

1. 未登录进入 /editor，当前页弹出登录弹窗。
2. 未登录发表评论，当前页弹出登录弹窗。
3. 未登录点赞评论，当前页弹出登录弹窗。
4. 模拟 401/2001，当前页弹出登录弹窗。
5. 登录面板切到注册面板，动画平滑。
6. 注册面板切回登录面板，动画平滑。
7. 点击右上角小叉可关闭弹窗。
8. 直接访问 /Login 与 /Register 仍可用。
