<template>
  <div class="editor-container">
    <div class="editor-header">
      <el-input
        v-model="articleDraft.title"
        placeholder="请输入文章标题"
        class="title-input"
        size="large"
      />
      <div class="header-actions">
        <el-button @click="togglePreview">
          {{ showPreview ? '编辑模式' : '预览模式' }}
        </el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          发布文章
        </el-button>
      </div>
    </div>

    <div class="editor-main">
      <!-- 编辑区域 -->
      <div class="editor-content" v-show="!showPreview || splitView">
        <div class="meta-section">
          <el-form label-position="top">
            <el-form-item label="文章概要">
              <el-input
                v-model="articleDraft.summary"
                type="textarea"
                :rows="2"
                placeholder="简要描述文章内容..."
              />
            </el-form-item>
            <el-form-item label="备注">
              <el-input v-model="articleDraft.remark" placeholder="备注信息" />
            </el-form-item>
          </el-form>
        </div>

        <el-divider>内容编辑</el-divider>

        <div class="blocks-container">
          <div
            v-for="(block, index) in articleDraft.articleBlocks"
            :key="block.clientId || block.seq"
            class="block-item"
          >
            <div class="block-controls">
              <el-select v-model="block.blockType" style="width: 120px" @change="handleTypeChange(block)">
                <el-option
                  v-for="option in blockTypeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
              <div class="control-btns">
                <el-button circle size="small" @click="moveBlock(index, -1)" :disabled="index === 0">↑</el-button>
                <el-button circle size="small" @click="moveBlock(index, 1)" :disabled="index === articleDraft.articleBlocks.length - 1">↓</el-button>
                <el-button circle size="small" type="danger" @click="removeBlock(index)">×</el-button>
              </div>
            </div>

            <div class="block-content-editor">
              <!-- 文本类编辑 -->
              <el-input
                v-if="['paragraph', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code_block', 'blockquote'].includes(block.blockType)"
                v-model="block.text"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 10 }"
                placeholder="请输入内容..."
              />

              <!-- 图片编辑 -->
              <div v-if="block.blockType === 'image'" class="image-uploader">
                <div v-if="block.previewUrl" class="image-preview">
                  <img :src="block.previewUrl" alt="Preview" />
                  <div class="image-actions">
                    <el-button size="small" @click="triggerFileSelect(block)">更换图片</el-button>
                  </div>
                </div>
                <div v-else class="upload-placeholder" @click="triggerFileSelect(block)">
                  <el-icon class="upload-icon"><Plus /></el-icon>
                  <span>点击上传图片</span>
                </div>
                <input
                  type="file"
                  ref="fileInputs"
                  :data-client-id="block.clientId"
                  style="display: none"
                  accept="image/*"
                  @change="(e) => handleFileChange(e, block)"
                />
              </div>
            </div>
          </div>

          <div class="add-block-btn">
            <el-button type="primary" plain style="width: 100%" @click="addBlock">
              + 添加内容块
            </el-button>
            <el-button type="success" plain style="width: 100%; margin-left: 0; margin-top: 10px;" :loading="uploadingMd" @click="triggerMdUpload">
              ↑ 上传 Markdown 文件
            </el-button>
            <input
              type="file"
              ref="mdFileInput"
              style="display: none"
              accept=".md,.markdown"
              @change="handleMdFileChange"
            />
          </div>
        </div>
      </div>

      <!-- 预览区域 -->
      <div class="preview-content" v-show="showPreview || splitView">
        <div class="markdown-body" v-html="renderedContent"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { v4 as uuidv4 } from 'uuid'
import MarkdownIt from 'markdown-it'
import { saveArticle, uploadMarkdownArticle, type ArticleDraftDTO, type ArticleBlockDraftDTO } from '@/api/article/articleEditorApi'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const md = new MarkdownIt()

// 状态
const submitting = ref(false)
const uploadingMd = ref(false)
const showPreview = ref(false)
const splitView = ref(true) // 是否分屏显示（大屏默认分屏）
const fileInputs = ref<HTMLInputElement[]>([])
const mdFileInput = ref<HTMLInputElement | null>(null)

const maxImgSize = 10 * 1024 * 1024

// Block Type 定义
const blockTypeOptions = [
  { label: '段落', value: 'paragraph' },
  { label: '一级标题', value: 'h1' },
  { label: '二级标题', value: 'h2' },
  { label: '三级标题', value: 'h3' },
  { label: '四级标题', value: 'h4' },
  { label: '五级标题', value: 'h5' },
  { label: '六级标题', value: 'h6' },
  { label: '图片', value: 'image' },
  { label: '代码块', value: 'code_block' },
  { label: '引用', value: 'blockquote' }
]

// 数据结构扩展，包含前端特有的字段
interface EditableBlock extends ArticleBlockDraftDTO {
  previewUrl?: string // 用于图片预览
}

const articleDraft = reactive<{
  title: string
  summary: string
  remark: string
  articleBlocks: EditableBlock[]
}>({
  title: '',
  summary: '',
  remark: '',
  articleBlocks: []
})

// 文件暂存 Map<clientId, File>
const fileMap = new Map<string, File>()

// 初始化
onMounted(() => {
  // 检查权限
  if (!userStore.userInfo) {
    ElMessage.warning('请先登录')
    router.push('/Login')
    return
  }
  // 这里可以扩展具体的权限检查逻辑
  
  // 添加一个默认块
  if (articleDraft.articleBlocks.length === 0) {
    addBlock()
  }
  
  // 响应式布局检查
  checkResponsive()
  window.addEventListener('resize', checkResponsive)
})

function checkResponsive() {
  splitView.value = window.innerWidth >= 992
}

// 块管理
function addBlock() {
  const newBlock: EditableBlock = {
    seq: 0, // 提交时重新计算
    blockType: 'paragraph',
    text: '',
    clientId: uuidv4()
  }
  articleDraft.articleBlocks.push(newBlock)
}

function removeBlock(index: number) {
  const block = articleDraft.articleBlocks[index]
  if(block == null){
    return
  }
  if (block.clientId && fileMap.has(block.clientId)) {
    fileMap.delete(block.clientId)
  }
  articleDraft.articleBlocks.splice(index, 1)
}

function moveBlock(index: number, direction: number) {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= articleDraft.articleBlocks.length) return
  
  const currentBlock = articleDraft.articleBlocks[index]
   articleDraft.articleBlocks[index] = articleDraft.articleBlocks[newIndex]!
   articleDraft.articleBlocks[newIndex] = currentBlock!
}

function handleTypeChange(block: EditableBlock) {
  // 清理之前可能存在的图片数据
  if (block.blockType !== 'image' && block.clientId && fileMap.has(block.clientId)) {
    fileMap.delete(block.clientId)
    block.previewUrl = undefined
  }
}

// 图片上传处理
function triggerFileSelect(block: EditableBlock) {
  // 查找对应的 input
  // 由于 v-for ref 绑定的是数组，需要自行查找
  // 这里简化处理：我们通过 document selector 或者直接触发
  // 更好的方式是动态 ref，但在 v-for 中 ref 是数组
  // 我们根据 data-client-id 查找
  nextTick(() => {
    const inputs = document.querySelectorAll(`input[data-client-id="${block.clientId}"]`)
    if (inputs.length > 0) {
      (inputs[0] as HTMLInputElement).click()
    }
  })
}

function handleFileChange(event: Event, block: EditableBlock) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]!
    
    // 验证
    if (file.size > maxImgSize) {
      ElMessage.warning(`图片大小不能超过 ${maxImgSize / (1024 * 1024)}MB`)
      return
    }
    
    // 存储文件
    if (!block.clientId) block.clientId = uuidv4()
    fileMap.set(block.clientId, file)
    
    // 预览
    block.previewUrl = URL.createObjectURL(file)
    
    // 清空 input 以便下次重复选择
    target.value = ''
  }
}

// Markdown 文件上传处理
function triggerMdUpload() {
  if (mdFileInput.value) {
    mdFileInput.value.click()
  }
}

async function handleMdFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]!
    uploadingMd.value = true
    
    try {
      const text = await file.text()
      const blocks = parseMarkdownToBlocks(text)
      
      // 更新编辑器状态
      // 选择是追加还是覆盖？这里默认追加，如果是空文章则直接填充
      if (articleDraft.articleBlocks.length === 1 && !articleDraft.articleBlocks[0]!.text) {
        articleDraft.articleBlocks = blocks
      } else {
        articleDraft.articleBlocks.push(...blocks)
      }
      
      // 如果标题为空，尝试从 blocks 中提取第一个标题
      if (!articleDraft.title) {
        const firstHeading = blocks.find(b => ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(b.blockType))
        if (firstHeading) {
          articleDraft.title = firstHeading.text || ''
        }
      }

      // 构建请求数据
      // 重新生成 seq，间隔 10000
      const blocksToSubmit = articleDraft.articleBlocks.map((block, index) => {
        const newBlock = { ...block, seq: (index + 1) * 10000 }
        if (newBlock.blockType !== 'image') {
           delete newBlock.clientId
        }
        delete (newBlock as any).previewUrl
        return newBlock
      })

      const draftDTO: ArticleDraftDTO = {
        title: articleDraft.title || 'Imported Markdown',
        content_format: 'blocks', // 显式标记为 blocks
        summary: articleDraft.summary,
        remark: articleDraft.remark,
        articleBlocks: blocksToSubmit
      }
      
      // 调用 API 上传
      await uploadMarkdownArticle(draftDTO)
      
      ElMessage.success('Markdown 文件解析并上传成功')
      
    } catch (error: any) {
      console.error('Markdown upload error:', error)
      ElMessage.error(error.message || '文件解析或上传失败')
    } finally {
      uploadingMd.value = false
      target.value = '' // 重置 input
    }
  }
}

// 解析 Markdown 文本为 Blocks
function parseMarkdownToBlocks(markdown: string): EditableBlock[] {
  const tokens = md.parse(markdown, {})
  const blocks: EditableBlock[] = []
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!
    
    if (token.type === 'heading_open') {
      // 标题处理
      const tag = token.tag.toLowerCase() // h1, h2...
      // 获取标题内容（下一个 inline token 的 content）
      const inlineToken = tokens[i + 1]
      if (inlineToken && inlineToken.type === 'inline') {
        blocks.push({
          seq: 0,
          blockType: tag, // h1, h2, h3...
          text: inlineToken.content,
          clientId: uuidv4()
        })
        i += 2 // 跳过 inline 和 heading_close
      }
    } else if (token.type === 'paragraph_open') {
      const inlineToken = tokens[i + 1]
      if (inlineToken && inlineToken.type === 'inline') {
        // 检查是否包含图片
        const imageToken = inlineToken.children?.find(c => c.type === 'image')
        if (imageToken) {
           blocks.push({
             seq: 0,
             blockType: 'image',
             text: imageToken.content, // 图片描述
             previewUrl: imageToken.attrGet('src') || undefined,
             clientId: uuidv4()
           })
        } else {
           blocks.push({
             seq: 0,
             blockType: 'paragraph',
             text: inlineToken.content,
             clientId: uuidv4()
           })
        }
        i += 2
      }
    } else if (token.type === 'fence' || token.type === 'code_block') {
      blocks.push({
        seq: 0,
        blockType: 'code_block',
        text: token.content.trim(), // 代码内容
        clientId: uuidv4()
      })
    } else if (token.type === 'blockquote_open') {
       let content = ''
       let j = i + 1
       while (j < tokens.length && tokens[j]!.type !== 'blockquote_close') {
         if (tokens[j]!.type === 'inline') {
           content += tokens[j]!.content + '\n'
         }
         j++
       }
       blocks.push({
         seq: 0,
         blockType: 'blockquote',
         text: content.trim(),
         clientId: uuidv4()
       })
       i = j
    }
    // 列表等其他类型暂映射为 paragraph 或忽略
  }
  
  return blocks
}

// 预览渲染
const renderedContent = computed(() => {
  let markdown = `# ${articleDraft.title || '无标题'}\n\n`
  
  if (articleDraft.summary) {
    markdown += `> ${articleDraft.summary}\n\n`
  }
  
  articleDraft.articleBlocks.forEach(block => {
    switch (block.blockType) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        const level = parseInt(block.blockType.substring(1))
        const hashes = '#'.repeat(level)
        markdown += `${hashes} ${block.text || ''}\n\n`
        break
      case 'paragraph':
        markdown += `${block.text || ''}\n\n`
        break
      case 'blockquote':
        markdown += `> ${block.text || ''}\n\n`
        break
      case 'code_block':
        markdown += `\`\`\`\n${block.text || ''}\n\`\`\`\n\n`
        break
      case 'image':
        if (block.previewUrl) {
          markdown += `![Image](${block.previewUrl})\n\n`
        } else {
          markdown += `*[图片占位]*\n\n`
        }
        break
      default:
        markdown += `${block.text || ''}\n\n`
    }
  })
  
  return md.render(markdown)
})

function togglePreview() {
  showPreview.value = !showPreview.value
}

// 提交
async function handleSubmit() {
  if (!articleDraft.title.trim()) {
    ElMessage.error('请输入文章标题')
    return
  }
  
  if (articleDraft.articleBlocks.length === 0) {
    ElMessage.error('文章内容不能为空')
    return
  }

  // 验证必填项
  for (let i = 0; i < articleDraft.articleBlocks.length; i++) {
    const block = articleDraft.articleBlocks[i]!
    if (block.blockType !== 'image' && !block.text?.trim()) {
      ElMessage.warning(`第 ${i + 1} 个内容块未填写内容`)
      return
    }
    if (block.blockType === 'image' && !block.previewUrl && !block.articleAssetId) {
       ElMessage.warning(`第 ${i + 1} 个内容块未上传图片`)
       return
    }
  }

  submitting.value = true
  
  try {
    // 重新生成 seq，间隔 10000
    const blocksToSubmit = articleDraft.articleBlocks.map((block, index) => {
      const newBlock = { ...block, seq: (index + 1) * 10000 }
      
      // 如果不是图片，移除 clientId，避免后端误判为文件上传关联
      if (newBlock.blockType !== 'image') {
        delete newBlock.clientId
      } else {
        // 如果是图片，保留 clientId 用于文件关联
        // 确保 content 字段即使为空也是字符串
        if (!newBlock.text) {
          newBlock.text = ''
        }
      }
      // 根据 blockType 拼接 Markdown 前缀到 text 字段
      // 注意：这里我们保留原始的 blockType (h1, paragraph 等)，但也根据需求拼接 Markdown 语法到 text 中
      // if (newBlock.text) {
      //   if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(newBlock.blockType)) {
      //     const level = parseInt(newBlock.blockType.substring(1))
      //     const hashes = '#'.repeat(level)
      //     newBlock.text = `${hashes} ${newBlock.text}`
      //   } else {
      //     switch (newBlock.blockType) {
      //       case 'blockquote':
      //         newBlock.text = `> ${newBlock.text}`
      //         break
      //       case 'code_block':
      //         newBlock.text = `\`\`\`\n${newBlock.text}\n\`\`\``
      //         break
      //     }
      //   }
      // }

      console.log(newBlock)
      
      // 移除前端专用的 previewUrl
      delete (newBlock as any).previewUrl
      
      return newBlock
    })

    const draftDTO: ArticleDraftDTO = {
      title: articleDraft.title,
      content_format: 'MARKDOWN', // 或其他
      summary: articleDraft.summary,
      remark: articleDraft.remark,
      articleBlocks: blocksToSubmit
    }

    // 过滤掉不需要上传文件的 clientId (非图片块)
    // 但我们的 fileMap 只在 handleFileChange (type=IMAGE) 时设置，所以应该没事
    
    await saveArticle(draftDTO, fileMap)
    
    ElMessage.success('文章发布成功')
    router.push('/Person') // 或跳转详情页
    
  } catch (error: any) {
    console.error(error)
    ElMessage.error(error.message || '发布失败')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.editor-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px); /* 减去 Header 高度 */
  background-color: #f5f7fa;
  padding: 20px;
  box-sizing: border-box;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}
.header-actions{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 5px;
}

.title-input {
  font-size: 18px;
  font-weight: bold;
}

.editor-main {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow: hidden;
}

.editor-content, .preview-content {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.blocks-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.block-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
  background: #fff;
  transition: all 0.3s;
}

.block-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.block-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.control-btns {
  display: flex;
  gap: 8px;
}

.image-uploader {
  border: 2px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}

.image-uploader:hover {
  border-color: #409eff;
}

.upload-placeholder {
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #8c939d;
}

.image-preview {
  position: relative;
  width: 100%;
}

.image-preview img {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  display: block;
}

.image-actions {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(255,255,255,0.8);
  padding: 4px;
  border-radius: 4px;
}

.markdown-body {
  line-height: 1.6;
}

/* 适配移动端 */
@media (max-width: 991px) {
  .editor-main {
    flex-direction: column;
  }
}
</style>
