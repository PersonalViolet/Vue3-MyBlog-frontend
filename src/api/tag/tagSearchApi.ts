import request from '@/utils/request'
import { ApiPrefixConstant, VersionConstant } from '@/api/Constant'

export type TagFilterTargetType = 'article'

export type TagFilterSortBy = 'createTime' | 'likes'

export interface TagFilterQueryDTO {
  targetType?: TagFilterTargetType
  tag: string
  sortBy?: TagFilterSortBy
  limit?: number
  lastCreateTime?: number
  lastLikes?: number
  lastId?: number
}

export interface TagFilterArticleItem {
  id: number
  title: string
  summary: string | null
  coverAssetId: number | null
  coverAssetUrl: string | null
  likes: number | string | null
  stars: number | string | null
  views: number | string | null
  isShow?: number | null
  status?: number | null
  contentFormat?: string | null
  contentJson?: string | null
  version?: number | null
  publishedAt?: string | null
  remark?: string | null
  adminCreateBy?: string | number | null
  userCreateBy?: string | number | null
  createTime?: string | null
  adminUpdateBy?: string | number | null
  userUpdateBy?: string | number | null
  updateTime?: string | null
  username?: string | null
}

export interface TagFilterResult {
  createTime: number | null
  likes: number | null
  id: number | null
  records: TagFilterArticleItem[]
}

const DEFAULT_TARGET_TYPE: TagFilterTargetType = 'article'
const DEFAULT_SORT_BY: TagFilterSortBy = 'createTime'
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 50

function normalizeLimit(limit?: number): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0) {
    return DEFAULT_LIMIT
  }

  return Math.min(Math.floor(limit), MAX_LIMIT)
}

function ensureCursorPair(sortBy: TagFilterSortBy, params: TagFilterQueryDTO) {
  const hasLastId = params.lastId !== undefined && params.lastId !== null

  if (sortBy === 'createTime') {
    const hasLastCreateTime = params.lastCreateTime !== undefined && params.lastCreateTime !== null
    if (hasLastCreateTime !== hasLastId) {
      throw new Error('createTime 模式下 lastCreateTime 与 lastId 必须成对传递')
    }
    return
  }

  const hasLastLikes = params.lastLikes !== undefined && params.lastLikes !== null
  if (hasLastLikes !== hasLastId) {
    throw new Error('likes 模式下 lastLikes 与 lastId 必须成对传递')
  }
}

function buildTagFilterQuery(params: TagFilterQueryDTO): string {
  const normalizedTag = params.tag.trim()
  if (!normalizedTag) {
    throw new Error('标签不能为空')
  }

  const targetType = params.targetType ?? DEFAULT_TARGET_TYPE
  if (targetType !== 'article') {
    throw new Error('目前仅支持 article 目标类型')
  }

  const sortBy = params.sortBy ?? DEFAULT_SORT_BY
  if (sortBy !== 'createTime' && sortBy !== 'likes') {
    throw new Error('不支持的排序方式')
  }

  ensureCursorPair(sortBy, params)

  const query = new URLSearchParams()
  query.append('targetType', targetType)
  query.append('tag', normalizedTag)
  query.append('sortBy', sortBy)
  query.append('limit', String(normalizeLimit(params.limit)))

  if (sortBy === 'createTime') {
    if (params.lastCreateTime !== undefined && params.lastId !== undefined) {
      query.append('lastCreateTime', String(params.lastCreateTime))
      query.append('lastId', String(params.lastId))
    }
  } else if (params.lastLikes !== undefined && params.lastId !== undefined) {
    query.append('lastLikes', String(params.lastLikes))
    query.append('lastId', String(params.lastId))
  }

  return query.toString()
}

export function filterArticlesByTag(params: TagFilterQueryDTO): Promise<TagFilterResult> {
  const queryString = buildTagFilterQuery(params)

  return request({
    url: `${ApiPrefixConstant.TAG}${VersionConstant.V1}/filter?${queryString}`,
    method: 'get'
  })
}
