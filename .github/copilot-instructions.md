# User-Vue3-SpaceBlog AI 编码指南

## 项目概述
基于 Vue 3 + TypeScript 的博客平台前端。架构使用 Vite、Pinia 进行状态管理、Vue Router 进行导航，以及带拦截器的 Axios 进行 API 通信。应用支持富文本编辑器块创建文章、基于 token 的用户身份验证，以及多存储策略（localStorage/sessionStorage）。

## 技术栈
- **框架**: Vue 3 (Composition API), TypeScript
- **构建**: Vite 7.1, ESLint 9, vue-tsc
- **HTTP**: Axios（带全局拦截器，token 注入，错误处理）
- **状态管理**: Pinia stores（用户信息，认证状态）
- **UI**: Element Plus 2.11
- **路由**: Vue Router 4（带路由守卫和元数据）

## 架构模式

### 1. API 层 (`/src/api/`)
**模式**: 基于服务的 API 模块，按功能领域组织。

- **API 常量** ([Constant.ts](src/api/Constant.ts)): 集中管理的端点前缀
  - `ApiPrefixConstant.ARTICLE`, `.AUTH`, `.USER`, `.FILE`（使用 `VersionConstant.V1` 版本控制）
  - 示例: GET `/api/article/v1/{userId}` 获取用户文章

- **API 函数**: 每个领域都有 `index.ts` 导出类型化函数
  - [userArticleApi.ts](src/api/article/userArticleApi.ts): `getUserPublicArticles(userId, params)` 返回 `Promise<PageResult<Article>>`
  - [articleEditorApi.ts](src/api/article/articleEditorApi.ts): `saveArticle(draftDTO, filesMap)` 处理 FormData（包含 JSON + 文件）
  - 返回类型必须匹配 `PageResult<T>` 接口（records, total）

**添加端点时**: 定义类型化 DTO，使用常量定义 URL，确保请求/响应匹配拦截器期望。

### 2. HTTP 客户端 ([request.ts](src/utils/request.ts))
**拦截器链**:
- **请求**: 注入 `Authorization: Bearer {token}`，显示 ElLoading 遮罩
- **响应**: 期望 `{ code: 200, data: {...} }` 格式；提取 `.data`；处理错误码
  - Code 2001: Token 过期 → 重定向到 `/Login`
  - 其他非 200: 显示 ElMessage 错误，拒绝 promise
- **错误回退**: HTTP 401/403 清除 token 并重定向；404/400 显示特定消息

**关键**: 所有 API 函数接收已解析的 `.data`（而非完整响应）。错误处理通过拦截器进行。

### 3. 状态管理 ([stores/user.ts](src/stores/user.ts))
**Pinia store 模式**，带持久化双存储:
- 初始化时从 sessionStorage 或 localStorage 读取（优先级顺序）
- `setUserInfo()` 遵循 `rememberMe` 标志:
  - `rememberMe: false` → sessionStorage（临时）
  - `rememberMe: true` → localStorage（持久）
- 计算属性 `avatarUrl` 带默认回退到 `defaultAvatar.svg`
- Actions: `setUserInfo()`, `updateAvatar()`, `clearUserInfo()`

**修改时**: 保持 Storage 同步逻辑；原子性更新 ref 和 storage。

### 4. 身份验证流程 ([utils/auth.ts](src/utils/auth.ts))
- **Token 存储**: 键名 `Authorization` 同时存在于 localStorage + sessionStorage（按顺序检查）
- **函数**: `getToken()`, `setLocalToken()`, `setSessionToken()`, `removeToken()`
- **路由守卫** ([router/index.ts](src/router/index.ts)): 路由元信息 `requiresAuth: boolean` 控制访问；未授权用户重定向到 `/Login`

### 5. 视图架构
**编辑器模式** ([ArticleEditor.vue](src/views/ArticleEditor.vue) - 789 行):
- 管理 `articleDraft`，包含嵌套块结构（`ArticleDraftDTO`）
- 支持分屏预览（通过按钮切换）
- 文件上传在 `Map<clientId, File>` 中跟踪，用于后续的 multipart 提交
- 通过 `saveArticle()` 提交，传递 JSON 元数据 + 文件 blobs

**表单模式**: 使用 Element Plus 组件（el-input, el-select, el-button）；响应式 v-model 绑定；按钮加载状态。

## 开发工作流

### 构建与运行
```bash
npm run dev          # Vite 开发服务器，热重载
npm run build        # 类型检查 + 压缩（生产环境）
npm run type-check   # vue-tsc 验证
npm run lint         # ESLint 自动修复
```

### 环境设置
- 需要 Node 20.19+（在 package.json engines 中指定）
- Vite 使用 `import.meta.env.VITE_APP_BASE_API` 作为后端 URL
- 确保 `.env.local` 定义了 `VITE_APP_BASE_API`（例如：`http://localhost:8080/api`）

## 项目特定约定

### 命名规范
- **API 函数**: 动词 + 功能（例如：`getUserPublicArticles`, `saveArticle`）
- **DTOs**: 以 `DTO` 为后缀（例如：`ArticleDraftDTO`, `ArticleBlockDraftDTO`）
- **Storage 键**: 常量中使用 PascalCase（例如：`USER_INFO_KEY`, `SEARCHHISTORY_KEY`）
- **路由**: 小写路径（例如：`/Login`, `/Person` 作为组件名；URL 为小写）

### TypeScript
- 启用严格模式；所有 API 契约使用接口
- 对块类型使用判别联合类型（例如：`blockType: 'text' | 'image' | 'video'`）
- Ref 类型: `ref<T>()`，派生状态使用计算选择器

### 存储持久化
- 用户信息: 通过 `Storage.ts` 辅助函数的双策略（`getSessionUserInfoItem`, `getUserInfoItem`）
- 搜索历史: JSON 序列化，读取时解析（损坏时回退到字符串）
- 登出时总是通过 `removeToken()` + store `clearUserInfo()` 清除

## 跨组件通信

| 模式 | 用途 | 示例 |
|---------|-------|---------|
| **Pinia Store** | 全局用户状态，认证状态 | `useUserStore().userInfo` |
| **路由参数** | 在视图间传递数据 | `route.params.userId` |
| **Props/Emits** | 父子组件（Header.vue ↔ 视图） | Header 通过 prop 接收用户 |
| **URL 查询** | 分页，过滤 | `?page=2&pageSize=10` |

## 错误处理模式

1. **API 错误**: 被请求拦截器捕获；显示 ElMessage；拒绝 promise
2. **验证**: 在组件中提交前检查（例如：标题不为空）
3. **网络故障**: 通用"网络异常"消息；重试逻辑留给组件
4. **认证错误**: 2001（过期）、401（未授权）自动重定向到 `/Login`

**模式**: 在 try-catch 中包装 API 调用，如需要显示自定义 ElMessage，为拦截器处理重新抛出。

## 关键参考文件

| 文件 | 用途 |
|------|---------|
| [src/router/index.ts](src/router/index.ts) | 路由定义，守卫，元数据 |
| [src/stores/user.ts](src/stores/user.ts) | 用户状态，认证持久化 |
| [src/api/Constant.ts](src/api/Constant.ts) | API 端点前缀 |
| [src/utils/request.ts](src/utils/request.ts) | HTTP 拦截器，错误处理 |
| [src/utils/Storage.ts](src/utils/Storage.ts) | Local/session storage 辅助函数 |
| [src/views/ArticleEditor.vue](src/views/ArticleEditor.vue) | 复杂表单 + 文件上传模式 |

## 常见任务

### 添加新的 API 端点
1. 在 `/src/api/{feature}/{domain}Api.ts` 中定义 DTO 接口
2. 使用 `request` 配合 `ApiPrefixConstant.{FEATURE}` + `VersionConstant.V1` 导出函数
3. 如需要认证，在路由中添加守卫
4. 从组件调用，用 ElMessage 回退捕获错误

### 修改用户状态
1. 如持久化，在 Storage.ts 中更新 `[set|update|remove]UserInfoItem`
2. 调用 `useUserStore()` 中相应的 action 以同步 ref
3. 通过 `rememberMe` 标志验证双存储（session/local）一致性

### 表单中上传文件
1. 在选择期间在 `Map<clientId, File>` 中跟踪文件
2. 在 API 函数中创建 `FormData`: `append('JSONfield', JSON.stringify(dto))` + `append(clientId, file)`
3. 设置头部 `'Content-Type': 'multipart/form-data'`；axios 处理 boundary
4. 在拦截器中处理 multipart 响应（通常解包 `.data`）

---
**最后更新**: 2026-01-23 | 适用于 Vue 3.5 + Vite 7.1 + TypeScript 5.9
