# AI Coding Guidelines for User-Vue3-SpaceBlog

## Project Overview
Vue 3 + TypeScript frontend for a blogging platform. Architecture uses Vite, Pinia for state management, Vue Router for navigation, and Axios with interceptors for API communication. The app supports article creation with rich editor blocks, user authentication with token-based sessions, and multi-storage strategies (localStorage/sessionStorage).

## Tech Stack
- **Framework**: Vue 3 (Composition API), TypeScript
- **Build**: Vite 7.1, ESLint 9, vue-tsc
- **HTTP**: Axios with global interceptors (token injection, error handling)
- **State**: Pinia stores (user info, auth state)
- **UI**: Element Plus 2.11
- **Router**: Vue Router 4 with route guards and metadata

## Architecture Patterns

### 1. API Layer (`/src/api/`)
**Pattern**: Service-based API modules organized by feature domain.

- **API Constants** ([Constant.ts](src/api/Constant.ts)): Centralized endpoint prefixes
  - `ApiPrefixConstant.ARTICLE`, `.AUTH`, `.USER`, `.FILE` (versioned with `VersionConstant.V1`)
  - Example: GET `/api/article/v1/{userId}` for user articles

- **API Functions**: Each domain has `index.ts` exporting typed functions
  - [userArticleApi.ts](src/api/article/userArticleApi.ts): `getUserPublicArticles(userId, params)` returns `Promise<PageResult<Article>>`
  - [articleEditorApi.ts](src/api/article/articleEditorApi.ts): `saveArticle(draftDTO, filesMap)` handles FormData with JSON + files
  - Return types must match `PageResult<T>` interface (records, total)

**When adding endpoints**: Define typed DTOs, use constants for URLs, ensure request/response match interceptor expectations.

### 2. HTTP Client ([request.ts](src/utils/request.ts))
**Interceptor Chain**:
- **Request**: Injects `Authorization: Bearer {token}`, shows ElLoading overlay
- **Response**: Expects `{ code: 200, data: {...} }` format; extracts `.data`; handles error codes
  - Code 2001: Token expired → redirects to `/Login`
  - Other non-200: Shows ElMessage error, rejects promise
- **Error Fallback**: HTTP 401/403 clear token and redirect; 404/400 show specific messages

**Critical**: All API functions receive resolved `.data` (not full response). Error handling happens via interceptors.

### 3. State Management ([stores/user.ts](src/stores/user.ts))
**Pinia store pattern** with persistent dual-storage:
- Reads from sessionStorage OR localStorage on init (priority order)
- `setUserInfo()` respects `rememberMe` flag:
  - `rememberMe: false` → sessionStorage (temporary)
  - `rememberMe: true` → localStorage (persistent)
- Computed `avatarUrl` with default fallback to `defaultAvatar.svg`
- Actions: `setUserInfo()`, `updateAvatar()`, `clearUserInfo()`

**When modifying**: Keep Storage sync logic; update both ref and storage atomically.

### 4. Authentication Flow ([utils/auth.ts](src/utils/auth.ts))
- **Token Storage**: Keys `Authorization` in both localStorage + sessionStorage (checked in order)
- **Functions**: `getToken()`, `setLocalToken()`, `setSessionToken()`, `removeToken()`
- **Router Guards** ([router/index.ts](src/router/index.ts)): Route meta `requiresAuth: boolean` controls access; redirects unauthorized users to `/Login`

### 5. View Architecture
**Editor Pattern** ([ArticleEditor.vue](src/views/ArticleEditor.vue) - 789 lines):
- Manages `articleDraft` with nested block structure (`ArticleDraftDTO`)
- Supports split-view preview (toggle via button)
- File uploads tracked in `Map<clientId, File>` for later multipart submission
- Submission via `saveArticle()` passes both JSON metadata + file blobs

**Form Pattern**: Uses Element Plus components (el-input, el-select, el-button); reactive v-model binding; loading states on buttons.

## Development Workflow

### Build & Run
```bash
npm run dev          # Vite dev server, hot-reload
npm run build        # Type-check + minify (production)
npm run type-check   # vue-tsc validation
npm run lint         # ESLint with auto-fix
```

### Environment Setup
- Node 20.19+ required (specified in package.json engines)
- Vite uses `import.meta.env.VITE_APP_BASE_API` for backend URL
- Ensure `.env.local` defines `VITE_APP_BASE_API` (e.g., `http://localhost:8080/api`)

## Project-Specific Conventions

### Naming
- **API Functions**: Verb + Feature (e.g., `getUserPublicArticles`, `saveArticle`)
- **DTOs**: Suffixed with `DTO` (e.g., `ArticleDraftDTO`, `ArticleBlockDraftDTO`)
- **Storage Keys**: PascalCase in constants (e.g., `USER_INFO_KEY`, `SEARCHHISTORY_KEY`)
- **Routes**: Lowercase paths (e.g., `/Login`, `/Person` as component names; URLs lowercase)

### TypeScript
- Enable strict mode; interfaces for all API contracts
- Use discriminated unions for block types (e.g., `blockType: 'text' | 'image' | 'video'`)
- Ref types: `ref<T>()`, computed selectors for derived state

### Storage Persistence
- User info: Dual strategy via `Storage.ts` helpers (`getSessionUserInfoItem`, `getUserInfoItem`)
- Search history: JSON serialization with parse-on-read (fallback to string if corrupted)
- Always clear on logout via `removeToken()` + store `clearUserInfo()`

## Cross-Component Communication

| Pattern | Usage | Example |
|---------|-------|---------|
| **Pinia Store** | Global user state, auth status | `useUserStore().userInfo` |
| **Route Params** | Pass data between views | `route.params.userId` |
| **Props/Emits** | Parent-child (Header.vue ↔ views) | Header receives user via prop |
| **URL Query** | Pagination, filters | `?page=2&pageSize=10` |

## Error Handling Patterns

1. **API Errors**: Caught by request interceptor; ElMessage shown; promise rejected
2. **Validation**: Pre-submission checks in components (e.g., title not empty)
3. **Network Failures**: Generic "网络异常" message; retry logic left to components
4. **Auth Errors**: 2001 (expired), 401 (unauthorized) auto-redirect to `/Login`

**Pattern**: Wrap API calls in try-catch, show custom ElMessage if needed, re-throw for interceptor handling.

## Key Files to Reference

| File | Purpose |
|------|---------|
| [src/router/index.ts](src/router/index.ts) | Route definitions, guards, meta |
| [src/stores/user.ts](src/stores/user.ts) | User state, auth persistence |
| [src/api/Constant.ts](src/api/Constant.ts) | API endpoint prefixes |
| [src/utils/request.ts](src/utils/request.ts) | HTTP interceptors, error handling |
| [src/utils/Storage.ts](src/utils/Storage.ts) | Local/session storage helpers |
| [src/views/ArticleEditor.vue](src/views/ArticleEditor.vue) | Complex form + file upload pattern |

## Common Tasks

### Adding a New API Endpoint
1. Define DTO interface in `/src/api/{feature}/{domain}Api.ts`
2. Export function using `request` with `ApiPrefixConstant.{FEATURE}` + `VersionConstant.V1`
3. Add route guard in router if auth required
4. Call from component, catch errors with ElMessage fallback

### Modifying User State
1. Update `[set|update|remove]UserInfoItem` in Storage.ts if persisting
2. Call corresponding action in `useUserStore()` to sync ref
3. Verify dual-storage (session/local) consistency via `rememberMe` flag

### Uploading Files in Forms
1. Track files in `Map<clientId, File>` during selection
2. Create `FormData` in API function: `append('JSONfield', JSON.stringify(dto))` + `append(clientId, file)`
3. Set header `'Content-Type': 'multipart/form-data'`; axios handles boundary
4. Handle multipart response in interceptor (usually unwraps `.data`)

---
**Last updated**: 2026-01-23 | For Vue 3.5 + Vite 7.1 + TypeScript 5.9
