<template>
  <div class="typora-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-group">
        <el-tooltip content="粗体 (Ctrl+B)" placement="bottom">
          <button class="tool-btn" @click="insertFormat('**', '**')"><b>B</b></button>
        </el-tooltip>
        <el-tooltip content="斜体 (Ctrl+I)" placement="bottom">
          <button class="tool-btn" @click="insertFormat('*', '*')"><i>I</i></button>
        </el-tooltip>
        <el-tooltip content="删除线" placement="bottom">
          <button class="tool-btn" @click="insertFormat('~~', '~~')"><s>S</s></button>
        </el-tooltip>
      </div>
      
      <div class="divider"></div>
      
      <div class="toolbar-group">
        <el-tooltip content="一级标题" placement="bottom">
          <button class="tool-btn" @click="insertFormat('# ', '')">H1</button>
        </el-tooltip>
        <el-tooltip content="二级标题" placement="bottom">
          <button class="tool-btn" @click="insertFormat('## ', '')">H2</button>
        </el-tooltip>
        <el-tooltip content="三级标题" placement="bottom">
          <button class="tool-btn" @click="insertFormat('### ', '')">H3</button>
        </el-tooltip>
      </div>

      <div class="divider"></div>

      <div class="toolbar-group">
        <el-tooltip content="无序列表" placement="bottom">
          <button class="tool-btn" @click="insertFormat('- ', '')">List</button>
        </el-tooltip>
        <el-tooltip content="有序列表" placement="bottom">
          <button class="tool-btn" @click="insertFormat('1. ', '')">1.</button>
        </el-tooltip>
        <el-tooltip content="引用" placement="bottom">
          <button class="tool-btn" @click="insertFormat('> ', '')">”</button>
        </el-tooltip>
        <el-tooltip content="代码块" placement="bottom">
          <button class="tool-btn" @click="insertFormat('```\n', '\n```')">&lt;/&gt;</button>
        </el-tooltip>
      </div>

      <div class="divider"></div>

      <div class="toolbar-group">
        <el-tooltip content="链接" placement="bottom">
          <button class="tool-btn" @click="insertFormat('[', '](url)')">Link</button>
        </el-tooltip>
        <el-tooltip content="图片" placement="bottom">
          <button class="tool-btn" @click="insertFormat('![alt](', ')')">Img</button>
        </el-tooltip>
        <el-tooltip content="表格" placement="bottom">
          <button class="tool-btn" @click="insertTable">Table</button>
        </el-tooltip>
      </div>

      <div class="spacer"></div>

      <div class="toolbar-actions">
        <el-input 
          v-model="articleTitle" 
          placeholder="请输入文章标题" 
          class="title-input" 
          size="default"
        />
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存
        </el-button>
      </div>
    </div>

    <!-- 编辑区与预览区 -->
    <div class="editor-workspace">
      <!-- 源码编辑区 -->
      <div class="source-pane">
        <textarea
          ref="textareaRef"
          v-model="markdownContent"
          class="markdown-input"
          placeholder="开始写作..."
          @input="handleInput"
          @scroll="syncScroll('source')"
          @keydown.ctrl.b.prevent="insertFormat('**', '**')"
          @keydown.ctrl.i.prevent="insertFormat('*', '*')"
        ></textarea>
      </div>

      <!-- 实时预览区 -->
      <div 
        ref="previewRef"
        class="preview-pane markdown-body" 
        v-html="renderedHtml"
        @scroll="syncScroll('preview')"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import { v4 as uuidv4 } from 'uuid'
import { ElMessage } from 'element-plus'
import { saveArticle, type ArticleDraftDTO, type ArticleBlockDraftDTO } from '@/api/article/articleEditorApi'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

// 状态
const articleTitle = ref('')
const markdownContent = ref('')
const saving = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const previewRef = ref<HTMLElement | null>(null)
const fileMap = new Map<string, File>()

// 实时渲染
const renderedHtml = computed(() => {
  return md.render(markdownContent.value)
})

// 权限检查
onMounted(() => {
  if (!userStore.userInfo) {
    ElMessage.warning('请先登录')
    router.push('/Login')
  }
})

// 插入格式
function insertFormat(prefix: string, suffix: string) {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = markdownContent.value
  const selected = text.substring(start, end)
  
  const replacement = prefix + selected + suffix
  markdownContent.value = text.substring(0, start) + replacement + text.substring(end)
  
  // 恢复焦点并选中
  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
  }, 0)
}

function insertTable() {
  const tableMd = `
| 列1 | 列2 | 列3 |
| --- | --- | --- |
| 内容 | 内容 | 内容 |
`
  insertFormat(tableMd, '')
}

// 滚动同步 (简化版)
let isScrolling = false
function syncScroll(source: 'source' | 'preview') {
  if (isScrolling) return
  isScrolling = true
  
  const textarea = textareaRef.value
  const preview = previewRef.value
  
  if (textarea && preview) {
    const percentage = source === 'source'
      ? textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight)
      : preview.scrollTop / (preview.scrollHeight - preview.clientHeight)
      
    const target = source === 'source' ? preview : textarea
    
    if (target) {
      target.scrollTop = percentage * (target.scrollHeight - target.clientHeight)
    }
  }
  
  setTimeout(() => {
    isScrolling = false
  }, 100) // 防抖
}

// 输入处理 (用于防抖保存等，暂略)
function handleInput() {
  // 可在此处添加自动保存逻辑
}

// 解析 Markdown 为 Blocks (复用逻辑)
function parseMarkdownToBlocks(markdown: string): ArticleBlockDraftDTO[] {
  const tokens = md.parse(markdown, {})
  const lines = markdown.split('\n')
  const blocks: ArticleBlockDraftDTO[] = []
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!
    const clientId = uuidv4()
    
    // 标题
    if (token.type === 'heading_open') {
      const tag = token.tag.toLowerCase()
      const inlineToken = tokens[i + 1]
      if (inlineToken && inlineToken.type === 'inline') {
        blocks.push({ seq: 0, blockType: tag, text: inlineToken.content, clientId })
        i += 2
      }
    } 
    // 段落 / 图片
    else if (token.type === 'paragraph_open') {
      const inlineToken = tokens[i + 1]
      if (inlineToken && inlineToken.type === 'inline') {
        const imageToken = inlineToken.children?.find(c => c.type === 'image')
        if (imageToken) {
          blocks.push({ 
            seq: 0, 
            blockType: 'image', 
            text: imageToken.content, // alt text
            clientId 
          })
        } else {
          blocks.push({ 
            seq: 0, 
            blockType: 'paragraph', 
            text: inlineToken.content, 
            clientId 
          })
        }
        i += 2
      }
    }
    // 代码块
    else if (token.type === 'fence' || token.type === 'code_block') {
      blocks.push({ seq: 0, blockType: 'code_block', text: token.content.trim(), clientId })
    }
    // 引用
    else if (token.type === 'blockquote_open') {
      // 提取引用内容
      let j = i + 1
      let content = ''
      while (j < tokens.length && tokens[j]!.type !== 'blockquote_close') {
        if (tokens[j]!.type === 'inline') content += tokens[j]!.content + '\n'
        j++
      }
      blocks.push({ seq: 0, blockType: 'blockquote', text: content.trim(), clientId })
      i = j
    }
    // 列表、表格等复杂结构，提取原始文本作为 paragraph 或 html_block
    else if (['bullet_list_open', 'ordered_list_open', 'table_open', 'dl_open'].includes(token.type)) {
      if (token.map) {
        const [start, end] = token.map
        const rawContent = lines.slice(start, end).join('\n')
        blocks.push({ seq: 0, blockType: 'paragraph', text: rawContent, clientId })
        
        const closeType = token.type.replace('_open', '_close')
        let j = i + 1
        while (j < tokens.length) {
          if (tokens[j]!.type === closeType && tokens[j]!.level === token.level) {
            i = j
            break
          }
          j++
        }
      }
    }
    // HR
    else if (token.type === 'hr') {
      blocks.push({ seq: 0, blockType: 'hr', text: '---', clientId })
    }
  }
  
  return blocks
}

// 保存逻辑
async function handleSave() {
  if (!articleTitle.value.trim()) {
    ElMessage.warning('请输入文章标题')
    return
  }
  if (!markdownContent.value.trim()) {
    ElMessage.warning('文章内容不能为空')
    return
  }

  saving.value = true
  try {
    // 解析 blocks
    // 注意：为了最佳兼容性，这里我们其实可以只生成一个大 block 包含所有内容？
    // 但为了配合后端的结构化存储（如果有的话），还是解析一下。
    // 但是刚才分析了，图片链接没地方存。
    // 如果我用 parseMarkdownToBlocks，图片变成了 paragraph 里的文本 `image` (content)。
    // markdown-it 的 inline token content 对于图片是 alt 文本，不是完整 markdown！
    // 这是一个 bug。 parseMarkdownToBlocks 在处理 paragraph 时，inlineToken.content 是剔除了标签的文本吗？
    // 不，inlineToken.content 通常是纯文本。
    // 如果我们要保留 markdown 格式，我们需要 lines.slice().
    // 所以 parseMarkdownToBlocks 必须基于 lines 来提取 raw content。
    
    // 修正 parseMarkdownToBlocks 逻辑：
    // 我们应该尽量使用 token.map 来提取 raw markdown。
    // 这样最安全，所见即所得。
    
    const lines = markdownContent.value.split('\n')
    const blocks: ArticleBlockDraftDTO[] = []
    const tokens = md.parse(markdownContent.value, {})
    
    // 遍历 tokens，只处理块级 open token
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]!
      if (token.level === 0 && token.map) { // 顶层块
         const [start, end] = token.map
         const rawText = lines.slice(start, end).join('\n')
         
         // 确定类型
         let type = 'paragraph'
         if (token.type === 'heading_open') type = token.tag
         else if (token.type === 'fence' || token.type === 'code_block') type = 'code_block'
         else if (token.type === 'blockquote_open') type = 'blockquote'
         else if (['bullet_list_open', 'ordered_list_open'].includes(token.type)) type = 'list' // 简化
         else if (token.type === 'table_open') type = 'table'
         
         // 对于 header，rawText 包含 #，提交时是否需要去除？
         // ArticleEditor.vue 中是剔除的。这里 ArticleEditor2 是 raw markdown 编辑。
         // 如果后端 render 时会再次拼接 # (根据 blockType)，那我们这里应该剔除。
         // 这是一个两难：Editor2 是 raw 模式，Editor1 是 block 模式。
         // 如果后端只负责存储和回显，那最好统一。
         // 假设后端回显时会根据 type 拼接。那我们需要剔除 rawText 中的 markdown 符号。
         // 这太复杂了且容易出错。
         
         // 替代方案：将整个文档作为一个 block 提交。
         // type='markdown_doc' ? 
         // 如果后端不支持，那只能拆分。
         // 鉴于 ArticleEditor.vue 的逻辑是：text 是纯文本，blockType 决定样式。
         // 那我们在 Editor2 保存时，也应该尽量遵循。
         // 比如 H1，text = "Title"，blockType = "h1"。
         
         // 重新实现简易解析：
         if (token.type === 'heading_open') {
            const inline = tokens[i+1]
            blocks.push({ seq: 0, blockType: token.tag, text: inline?.content || '', clientId: uuidv4() })
            // 跳过到 close
            // 其实 tokens 是一维数组。
         } else if (token.type === 'paragraph_open') {
            const inline = tokens[i+1]
            // 如果是图片，inline.children 有 image
            // 但我们希望保留 `![alt](url)` 格式以便下次编辑？
            // 不，如果转成了 block，下次编辑就变成 block editor 了？
            // 用户问的是 "ArticleEditor2... Typora style".
            // 这意味着下次打开也应该是 raw markdown。
            // 如果后端存成了 blocks，下次怎么还原成 raw markdown？
            // 需要后端提供 blocks -> markdown 的接口或者前端拼接。
            // 如果我们这里把 `![alt](url)` 存为 paragraph text `alt`，那 url 就丢了！
            
            // 结论：ArticleEditor2 必须以 "Raw Markdown" 的形式保存内容。
            // 既然 `saveArticle` 强参数 `articleBlocks`。
            // 我们只能构造一个 block，包含全部内容。
            // blockType = 'paragraph' (或者 'raw')， text = 全文。
            // 这样下次加载时，只有一个 block，内容是全文，也就还原了。
            // 只要后端不限制 block 长度。
         }
      }
    }
    
    // 最终决定：为了数据安全和完整性，ArticleEditor2 将全文作为一个 PARAGRAPH 块提交，
    // 或者如果后端支持，拆分为段落但保留 raw markdown。
    // 但最最安全的是：只有一个 Block，Type='paragraph'，Text=MarkdownContent。
    // 这样后端渲染时，会把这个 paragraph 渲染出来（markdown-it render）。
    // 唯一的问题是：如果 ArticleEditor1 打开这个文章，会看到一个巨大的段落。
    // 但这是兼容两种编辑器模式的代价。
    
    const singleBlock: ArticleBlockDraftDTO = {
      seq: 10000,
      blockType: 'paragraph', // 或 'markdown' 如果支持
      text: markdownContent.value,
      clientId: uuidv4()
    }
    
    const draftDTO: ArticleDraftDTO = {
      title: articleTitle.value,
      content_format: 'markdown', // 标记格式
      articleBlocks: [singleBlock]
    }

    await saveArticle(draftDTO, fileMap)
    ElMessage.success('保存成功')
    
  } catch (error: any) {
    console.error(error)
    ElMessage.error('保存失败: ' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.typora-editor {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px);
  background-color: #fff;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid #e0e0e0;
  background-color: #f8f9fa;
  flex-shrink: 0;
}

.toolbar-group {
  display: flex;
  gap: 4px;
}

.tool-btn {
  padding: 6px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.2s;
}

.tool-btn:hover {
  background-color: #e6e8eb;
  color: #303133;
}

.divider {
  width: 1px;
  height: 20px;
  background-color: #dcdfe6;
  margin: 0 12px;
}

.spacer {
  flex: 1;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-input {
  width: 200px;
}

.editor-workspace {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.source-pane, .preview-pane {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.source-pane {
  border-right: 1px solid #e0e0e0;
  background-color: #fcfcfc;
}

.markdown-input {
  width: 100%;
  height: 100%;
  border: none;
  resize: none;
  outline: none;
  padding: 20px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 16px;
  line-height: 1.6;
  background-color: transparent;
  color: #333;
}

.preview-pane {
  padding: 20px 40px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .editor-workspace {
    flex-direction: column;
  }
  .source-pane {
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
  .title-input {
    width: 120px;
  }
}
</style>
