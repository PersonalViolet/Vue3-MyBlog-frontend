export interface userInfo {
    id: number;           // 用户 ID
    username: string;     // 用户名
    avatar: string;       // 头像 URL
    rolesCode: string[];  // 角色（admin：管理员；user：普通用户）
    permsCode: string[];  // 权限
  };