import request from '@/utils/request'
import { ApiPrefixConstant, VersionConstant } from '@/api/Constant'
import { type PageResult } from '@/api/PageResult'
export interface ArticleQueryDTO {
  page: number
  pageSize: number
  mostLikes?: boolean
  mostStars?: boolean
  mostViews?: boolean
}


export interface Article {
  id: number
  title: string
  summary?: string
  publishedAt?: string
  views?: number
  likes?: number
  stars?: number
  cover_asset_url?: string
  cover_asset_id?: number
  is_show?: number
  status?: number
  content_format?: string
  version?: number
  owner_user?: string
  published_at?: string
  remark?: string
  admin_create_by?: number
  user_create_by?: number
  create_time?: string
  admin_update_by?: number
  user_update_by?: number
  update_time?: string
}



// 查询指定用户的公开文章群
export function getUserPublicArticles(userId: number, params: ArticleQueryDTO = {page: 1, pageSize: 5}): Promise<PageResult<Article>> {
  return request({
    url: ApiPrefixConstant.ARTICLE + VersionConstant.V1 + `/${userId}`,
    method: 'get',
    params
  })
}


