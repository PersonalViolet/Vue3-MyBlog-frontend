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
  coverAssetUrl?: string
  coverAssetId?: number
  isShow?: number
  status?: number
  contentFormat?: string
  version?: number
  remark?: string
  adminCreateBy?: number
  userCreateBy?: number
  createTime?: string
  adminUpdateBy?: number
  userUpdateBy?: number
  updateTime?: string
}



export interface ArticleBlockVO {
  id: number
  articleId: number
  seq: number
  blockType: string
  text: string | null
  articleAssetId: number | null
  createTime: string
  updateTime: string
  url: string | null
}

export interface ArticleDetailVO {
  isOwner: boolean
  article: Article
  articleBlockVO: ArticleBlockVO[]
}

// 查询指定用户的公开文章群
export function getUserPublicArticles(userId: number, params: ArticleQueryDTO = {page: 1, pageSize: 5}): Promise<PageResult<Article>> {
  return request({
    url: ApiPrefixConstant.ARTICLE + VersionConstant.V1 + `/${userId}`,
    method: 'get',
    params
  })
}

// 查询指定文章详情
export function getArticleDetail(userId: number, articleId: number): Promise<ArticleDetailVO> {
  return request({
    url: ApiPrefixConstant.ARTICLE + VersionConstant.V1 + `/${userId}/${articleId}`,
    method: 'get'
  })
}

/**
 * 修改指定文章状态
 */
export function updateArticleStatus(userId: number, articleId: number, status: number): Promise<any> {
  return request({
    url: ApiPrefixConstant.ARTICLE + VersionConstant.V1 + `/${userId}/${articleId}/status`,
    method: 'patch', // 使用 PATCH 方法与后端对应
    headers: {
        'Content-Type': 'application/json'
    },
    data: status // 将状态放在请求体中
  })
}

/**
 * 修改指定文章状态
 */
export function incrementArticleViews(articleId: number): Promise<any> {
  return request({
    url: ApiPrefixConstant.ARTICLE + VersionConstant.V1 + `/${articleId}/views`,
    method: 'post', // 使用 POST 方法与后端对应
    headers: {
        'Content-Type': 'application/json'
    },
    data: {} // 空对象，因为后端不需要额外的数据
  })
}



