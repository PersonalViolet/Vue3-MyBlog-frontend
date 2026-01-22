import request from "@/utils/request";
import CryptoJS from "crypto-js";
import { ApiPrefixConstant, VersionConstant } from "@/api/Constant";

interface LoginData {
  account: string;
  password: string;
  remember: boolean;
}

export interface UserLoginVO {
  token: string;        // 认证 Token（记住后有效期 30天 ,不记住为 3 小时）
  userInfoVO: {
    id: number;           // 用户 ID
    username: string;     // 用户名
    avatar: string;       // 头像 URL
    rolesCode: string[];  // 角色（admin：管理员；user：普通用户）
    permsCode: string[];  // 权限
    rememberMe: boolean;  // 是否记住我
  };
}

/** 登录请求 */
export function login(data: LoginData): Promise<UserLoginVO> {
  // 构造表单数据
  const params = new URLSearchParams();
  // 在密码传输前进行加密
  const hashedPassword: string = CryptoJS.SHA256(data.password).toString()
  params.append('account', data.account);
  params.append('password', hashedPassword);
  params.append('remember', data.remember.toString());
  return request({
    url: ApiPrefixConstant.AUTH + VersionConstant.V1 + '/login',
    method: 'post',
    data: params,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}