import request from '@/utils/request'
import { ApiPrefixConstant, VersionConstant } from "@/api/Constant";

export interface UserProfileVO {
  userId: number;
  username: string;
  account: string;
  email: string;
  intro?: string;
  avatarUrl?: string;
  articleCount: number;
  starCount: number;
  likeCount: number;
}


export interface UserProfileDTO {
  userId: number;
  username?: string;
  intro?: string;
}


/** 获取用户基本信息 */
export function getUserProfile(userId: number): Promise<UserProfileVO> {
  return request({
    url: ApiPrefixConstant.USER + VersionConstant.V1 + `/${userId}`,
    method: 'get'
  })
}

/**
 * 更新用户信息
 * @param userId 用户ID
 * @param data 表单数据 (FormData)
 */
export function updateUserProfile(userId: number, data: FormData): Promise<any> {
  return request({
    url: ApiPrefixConstant.USER + VersionConstant.V1 + `/${userId}`,
    method: 'put',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}