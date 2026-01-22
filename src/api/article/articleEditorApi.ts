import request from '@/utils/request'
import { ApiPrefixConstant, VersionConstant } from '@/api/Constant'

export interface ArticleBlockDraftDTO {
  seq: number
  blockType: string
  text?: string
  articleAssetId?: number
  clientId?: string
}

export interface ArticleDraftDTO {
  title: string
  content_format: string
  summary?: string
  remark?: string
  articleBlocks: ArticleBlockDraftDTO[]
}

/**
 * 保存/发布文章
 * @param data ArticleDraftDTO
 * @param files Map<clientId, File>
 */
export function saveArticle(data: ArticleDraftDTO, files: Map<string, File>): Promise<any> {
  const formData = new FormData()
  
  // 添加 JSON 数据
  formData.append('articleDraftDTOJSON', JSON.stringify(data))
  
  // 添加文件，key 为 clientId
  files.forEach((file, clientId) => {
    formData.append(clientId, file)
  })

  return request({
    url: ApiPrefixConstant.ARTICLE + VersionConstant.V1 + '/draft',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 上传 Markdown 文件
 * @param data ArticleDraftDTO (只包含元数据，blocks 由前端解析后填充)
 * 注：这里其实接口文档描述的是“上传Markdown文件”，但实现要求前端解析。
 * 如果是前端解析后发送给后端保存，那其实就是调用 saveArticle 或者一个新的接口。
 * 接口文档中 URL 为 /upload，且参数结构与 saveArticle 类似。
 * 假设这个 /upload 接口是用来接收前端解析好的 blocks 数据的。
 */
export function uploadMarkdownArticle(data: ArticleDraftDTO): Promise<any> {
  const formData = new FormData()
  formData.append('articleDraftDTOJSON', JSON.stringify(data))

  return request({
    url: ApiPrefixConstant.ARTICLE + VersionConstant.V1 + '/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
