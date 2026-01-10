import request from '@/utils/request'

export interface UserArticle {
  id: number
  title: string
  summary?: string
  createdAt?: string
  views?: number
  likes?: number
}

export interface UserArticlePageParams {
  page: number
  pageSize: number
}

export interface UserArticlePageResult {
  list: UserArticle[]
  total: number
  page: number
  pageSize: number
}

// TODO: 具体路径请根据后端实际接口进行调整
export function getMyArticles(params: UserArticlePageParams): Promise<UserArticlePageResult> {
  return request({
    url: '/article/my/list',
    method: 'get',
    params
  })
}


