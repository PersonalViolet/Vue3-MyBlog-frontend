import request from '@/utils/request'
import { ApiPrefixConstant, VersionConstant } from "@/api/Constant";
import { type UserProfileVO } from "@/api/user/UserProfileApi";

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
  replyCount: number; // 直接子评论数量
  replyDescendantCount: number; // 包含子评论的所有后代评论数量
  children?: CommentVO[]; // 后端不返回该字段，需要前端维护评论树
  version: number;
  createTime: string;
  updateTime: string;
  userProfile?: UserProfileVO;
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


/**
 * 维护评论树
 * @param treeArray 评论树数组
 * @return map of id -> node，记录所有节点
 */
// build map
function buildIdMap(treeArray: CommentVO[], map = new Map<number, CommentVO>()) {
  for (const node of treeArray) {
    map.set(node.id, node);
    if (node.children && node.children.length) {
      buildIdMap(node.children, map);
    }
  }
  return map;
}


/**
 * 该函数只需调用一次
 * @param treeArray 在获取顶层评论后的TreeArray需要交给该函数维护
 * @returns 返回插入函数 insert(node)
 */
export function createInserter(treeArray: CommentVO[]) {
  const idMap = buildIdMap(treeArray) as Map<number, CommentVO>;
  const pending = new Map<number, CommentVO[]>(); // parentId -> [nodes waiting]

  /**
   * 尝试将 pending 中的节点挂到对应父节点上
   * @param nodeId 父节点ID
   */
  function attachPending(nodeId: number) {
    const pend = pending.get(nodeId);
    if (!pend) return;
    const parent = idMap.get(nodeId);
    if (!parent) return;
    if (!Array.isArray(parent.children)) parent.children = [];
    for (const child of pend) {
      parent.children.push({ ...child, children: [] });
      const lastChild = parent.children[parent.children.length - 1];
      if (lastChild) {
        idMap.set(child.id, lastChild);
      }
    }
    pending.delete(nodeId);
  }

  /**
   * 插入函数
   * 支持乱序（pending）
   * @param node 待插入的节点
   * @param commentId 评论ID，查看二级评论的回复时使用，其它情况一概不用
   * @return 是否成功插入
   */
  return function insert(node: CommentVO, commentId?: number) {
    // 封装 children 字段
    const nodeCopy = { ...node, children: [] };

    if (node.parentId === null) {
      // 顶层评论，插入到根数组
      treeArray.push(nodeCopy);
      idMap.set(node.id, nodeCopy);
      // 如果有人在等待以此节点为父的 children，把它们附上
      attachPending(node.id);
      return true;
    }

    if (commentId !== undefined && node.parentId !== null && node.rootId !== null && node.parentId !== node.rootId) {
      // 该节点是需要扁平化的节点
      // 1.检查commentId是否为二级评论的id
      const parent = idMap.get(commentId)
      if (parent !== undefined && parent.rootId === parent.parentId) {
        // 2.commentId为二级评论id
        if (!Array.isArray(parent.children)) parent.children = [];
        parent.children.push(nodeCopy)
        idMap.set(node.id, nodeCopy)
        return true;
      } else {
        // 检查出非法，直接返回
        console.error('Invalid commentId:', commentId);
        return false;
      }
    } else if (node.parentId !== null && node.rootId !== null && node.parentId === node.rootId) {
      // 该节点是二级评论，挂在根节点上
      const parent = idMap.get(node.parentId);
      if (parent) {
        if (!Array.isArray(parent.children)) parent.children = [];
        parent.children.push(nodeCopy);
        idMap.set(node.id, nodeCopy);
        // 如果有 pending 的以此 node.id 为父的，附上
        // attachPending(node.id);
        return true;
      } else {
        // 根节点尚未到达，放入 pending
        const arr = pending.get(node.parentId) || [];
        arr.push(nodeCopy);
        pending.set(node.parentId, arr);
        // 也把这个子节点先放进 idMap（若后续其子节点到来也能直接挂到它上面）
        idMap.set(node.id, nodeCopy);
        return false; // 表示暂时未挂上树
      }
    }
  };
}


