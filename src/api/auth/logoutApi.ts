// src/api/auth/Logout.ts
import request from "@/utils/request";
import { ApiPrefixConstant, VersionConstant } from "@/api/Constant";

/** 登出请求 */
export function logout() {
  return request({
    url: ApiPrefixConstant.AUTH + VersionConstant.V1 + '/logout',
    method: 'delete'
  });
}