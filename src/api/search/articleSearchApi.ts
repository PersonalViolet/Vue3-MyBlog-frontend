import request from '@/utils/request'
import { ApiPrefixConstant, VersionConstant } from '@/api/Constant'

export type SearchEntityType = 'article' | 'user' | 'comment'

export type ArticleSearchSortBy = 'relevance' | 'createTime' | 'views' | 'likes'

export interface ArticleSearchQueryDTO {
  keyword: string
  sortBy?: ArticleSearchSortBy
  limit?: number
  searchAfter?: string[]
}

export interface ArticleSearchItem {
  id: number
  title: string
  summary: string
  coverAssetId: number | null
  coverAssetUrl: string | null
  likes: number
  stars: number
  views: number
  authorId: number
  author: string
  createTime: string
  publishedAt: string
  highlightTitle: string | null
  highlightSummary: string | null
}

export interface ArticleSearchResult {
  total: number
  records: ArticleSearchItem[]
  searchAfter: string[] | null
}

function buildArticleSearchQuery(params: ArticleSearchQueryDTO): string {
  const query = new URLSearchParams()

  query.append('keyword', params.keyword)

  if (params.sortBy) {
    query.append('sortBy', params.sortBy)
  }

  if (params.limit) {
    query.append('limit', String(params.limit))
  }

  if (params.searchAfter && params.searchAfter.length > 0) {
    params.searchAfter.forEach((cursorValue) => {
      query.append('searchAfter', cursorValue)
    })
  }

  return query.toString()
}

export function searchArticles(params: ArticleSearchQueryDTO): Promise<ArticleSearchResult> {
  const queryString = buildArticleSearchQuery(params)

  return request({
    url: `${ApiPrefixConstant.SEARCH}${VersionConstant.V1}/article?${queryString}`,
    method: 'get'
  })
}
