import request from '@/utils/request'
import { ApiPrefixConstant, VersionConstant } from "@/api/Constant";
import { type UserProfileVO } from "@/api/user/UserProfileApi";
import type { Ref } from "vue";
import { triggerRef } from "vue";
import { tr } from 'element-plus/es/locales.mjs';

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
  userProfileVO?: UserProfileVO;
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

export interface GetCommentRepliesParams {
  lastLikeCount?: number;
  lastCreateTime?: number; // TimeStamp
  lastId?: number;
  limit?: number;
  parentId?: number | null;
  rootId?: number | null;
  id: number; // n-level comment id
  articleId?: number; // Added as per usage in CommentItem
}

export interface CommentReplyResult {
  likeCount: number | null;
  createTime: string | null;
  id: number | null;
  comments: CommentVO[];
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
 * 获取n级评论的回复
 * @param articleId 文章ID
 * @param params GetCommentRepliesParams
 */
export function getCommentReplies(articleId: number, params: GetCommentRepliesParams): Promise<CommentReplyResult> {
  return request({
    url: ApiPrefixConstant.ARTICLE + VersionConstant.V1 + `/${articleId}/comments/depth/hot`,
    method: 'get',
    params
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

export function isLevel2Comment(comment: CommentVO): boolean {
  return comment.parentId !== null && comment.rootId !== null && comment.parentId === comment.rootId;
}

export function isRootComment(comment: CommentVO): boolean {
  return comment.parentId === null && comment.rootId === null;
}

/**
 * 该函数只需调用一次
 * @param treeArray 在获取顶层评论后的TreeArray需要交给该函数维护
 * @returns 返回插入函数 insert(node)
 */
export function createInserter(treeArrayRef: Ref<CommentVO[]>) {
  const treeArray = treeArrayRef.value;
  const idMap = buildIdMap(treeArray) as Map<number, CommentVO>;
  const pending = new Map<number, CommentVO[]>(); // parentId -> [nodes waiting]


  function cleanCommentTree() {
    for (const node of treeArray) {
      idMap.delete(node.id);
      pending.delete(node.id);
    }
    treeArray.length = 0;
  }

  function findLevel2TreeId(commentId: number) {
    console.log ("findLevel2TreeId: ", commentId);
    const parentNode = idMap.get(commentId);
    if (parentNode !== undefined) {
      const parentId = parentNode.id;
      const parentRootId = parentNode.rootId;
      const grandParentId = parentNode.parentId;
      console.log("parentId: ", parentId);
      console.log("parentRootId: ", parentRootId);
      console.log("grandParentId: ", grandParentId);
      if (parentId !== null && parentRootId === grandParentId) {
        return parentId;
      } else if (grandParentId !== null) {
        return findLevel2TreeId(grandParentId);
      } else {
        console.log("Comment not found");
        return null;
      }
    } else {
      console.log("Comment not found");
      return null;
    }
  }

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
   * @param commentId 当isPost为false时，充当被查看回复的评论Id，并且该参数只能传二级评论的id；当isPost为true时，充当新发表的评论的父评论id（如果是一级评论则传null）
   * @param isClean 是否为清空树后重新插入（如切换文章或排序方式时），默认为 false。
   * @param isPost 是否为发表评论且满足该评论大于等于三级评论
   * @return 是否成功
   */
  return function insertOrClean(node?: CommentVO, commentId?: number, isClean: boolean = false, isPost: boolean = false) {
    if (node !== undefined){
      // 封装 children 字段
      const nodeCopy = { ...node, children: [] };

      if (isPost) {
        // 插入用户发表的评论到评论树
        if (commentId === undefined) {
          // 用户发表的评论是小于三级评论的
          if (node.parentId === null) {
            // 一级评论，直接插入到根数组
            console.log("一级评论的ID -> ", node.id);
            treeArray.unshift(nodeCopy);
            idMap.set(node.id, nodeCopy);
            return true;
          }
          if (node.parentId !== null && node.rootId === node.parentId) {
            // 二级评论，插入到对应一级评论的 children 数组
            const parent = idMap.get(node.parentId);
            if (!parent) {
              console.error('Parent not found');
              return false;
            } else {
              if (!Array.isArray(parent.children)) parent.children = [];
              parent.children.unshift(nodeCopy);
              idMap.set(node.id, nodeCopy);
              return true;
            }
          }
          return false;
        }
        // 用户发表的评论是大于等于三级评论
        const level2TreeId = findLevel2TreeId(commentId);
        if (level2TreeId !== undefined && level2TreeId !== null) {
          const level2Tree = idMap.get(level2TreeId);
          console.log("二级评论的ID -> ", level2Tree?.id);
          if (!level2Tree) {
            console.error('Parent not found');
            return false;
          } else {
          if (!Array.isArray(level2Tree.children)) level2Tree.children = [];
          const parentIndex = level2Tree.children.findIndex(child => child.id === commentId);
          level2Tree.children.splice(parentIndex + 1, 0, nodeCopy);
          triggerRef(treeArrayRef);
          //level2Tree.children.unshift(nodeCopy);
          idMap.set(node.id, nodeCopy)
          console.log("level2Tree -> ", level2Tree);
          return true;
          }
        } else {
          console.error('Level2TreeId not found');
          return false;
        }
      }

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
        // 该node节点是二级评论，挂在根节点上
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
    } else if (isClean) {
      // 清空树
      cleanCommentTree();
      return true;
    }
  }
}


