import request from '@/utils/request'
import { ApiPrefixConstant, VersionConstant } from "@/api/Constant";

export interface CommentVO {
  id: number;
  articleId: number;
  parentId: number | null;
  rootId: number | null;
  userId: number;
  content: string;
  status: number;
  likeCount: number;
  dislikeCount: number;
  replyCount: number;
  version: number;
  createTime: string;
  updateTime: string;
  // User info might be needed for display, usually joined by backend or separate call. 
  // Based on provided JSON, it only has userId. 
  // We might need to fetch user info or backend provides it in a different way.
  // For now, I'll stick to the provided JSON structure.
  username?: string; // Optional, in case backend adds it later or we map it
  userAvatar?: string; // Optional
}

export interface CommentListResult {
  likeCount: number | null;
  createTime: string | null;
  id: number | null;
  comments: CommentVO[];
}

export interface GetCommentsParams {
  likeCount?: number;
  createTime?: number; // TimeStamp (Long)
  id?: number;
  limit?: number;
}

export interface GetCommentsByTimeParams {
  createTime?: number; // TimeStamp (Long)
  id?: number;
  limit?: number;
}

export interface PostCommentDTO {
  articleId: number;
  parentId?: number | null;
  rootId?: number | null;
  content: string;
  media?: string; // URL of uploaded image
}

/**
 * 获取文章评论列表（根级评论）
 * @param articleId 文章ID
 * @param params 查询参数 (cursor)
 */
export function getArticleComments(articleId: number, params?: GetCommentsParams): Promise<CommentListResult> {
  return request({
    url: ApiPrefixConstant.ARTICLE + VersionConstant.V1 + `/${articleId}/comments/`,
    method: 'get',
    params
  })
}

/**
 * 发表评论
 * @param data PostCommentDTO
 */
export function postArticleComment(articleId: number, data: PostCommentDTO): Promise<any> {
  return request({
    url: ApiPrefixConstant.ARTICLE + VersionConstant.V1 + `/${articleId}/comments`,
    method: 'post',
    data
  })
}

/**
 * 获取文章评论列表（根级评论，按时间排序）
 * @param articleId 文章ID
 * @param params 查询参数 (cursor)
 */
export function getArticleCommentsByTime(articleId: number, params?: GetCommentsByTimeParams): Promise<CommentListResult> {
  return request({
    url: ApiPrefixConstant.ARTICLE + VersionConstant.V1 + `/${articleId}/comments/createTimeDesc`,
    method: 'get',
    params
  })
}
