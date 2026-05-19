import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface GeneratedFile {
  path: string
  content: string
  status: 'pending' | 'generating' | 'done'
}

export interface TaskStep {
  id: string
  type: 'boot' | 'install' | 'files' | 'server' | 'ready' | 'message'
  title: string
  status: 'pending' | 'running' | 'done' | 'error'
  details?: string[]
}

export interface LogEntry {
  id: string
  type: 'info' | 'error' | 'success' | 'command' | 'output' | 'warning'
  message: string
  timestamp: Date
}

interface AppState {
  messages: Message[]
  isLoading: boolean
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  updateLastAssistantMessage: (content: string) => void
  setLoading: (loading: boolean) => void
  clearMessages: () => void

  generatedFiles: GeneratedFile[]
  setGeneratedFiles: (files: GeneratedFile[]) => void
  clearGeneratedFiles: () => void
  selectedFilePath: string | null
  setSelectedFilePath: (path: string | null) => void

  taskSteps: TaskStep[]
  addTaskStep: (step: Omit<TaskStep, 'id'>) => string
  updateTaskStep: (id: string, updates: Partial<TaskStep>) => void
  clearTaskSteps: () => void

  previewUrl: string | null
  setPreviewUrl: (url: string | null) => void
  previewStatus: 'idle' | 'booting' | 'installing' | 'running' | 'ready' | 'error'
  setPreviewStatus: (status: AppState['previewStatus']) => void

  logs: LogEntry[]
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void
  clearLogs: () => void

  activeView: 'preview' | 'code' | 'terminal'
  setActiveView: (view: AppState['activeView']) => void
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void

  selectedModel: string
  setSelectedModel: (model: string) => void
  openaiApiKey: string
  geminiApiKey: string
  setOpenaiApiKey: (key: string) => void
  setGeminiApiKey: (key: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  messages: [],
  isLoading: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...message, id: crypto.randomUUID(), timestamp: new Date() },
      ],
    })),
  updateLastAssistantMessage: (content) =>
    set((state) => {
      const messages = [...state.messages]
      const lastIndex = messages.length - 1
      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = { ...messages[lastIndex], content }
      }
      return { messages }
    }),
  setLoading: (loading) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] }),

  generatedFiles: [],
  setGeneratedFiles: (files) => set({ generatedFiles: files }),
  clearGeneratedFiles: () => set({ generatedFiles: [] }),
  selectedFilePath: null,
  setSelectedFilePath: (path) => set({ selectedFilePath: path }),

  taskSteps: [],
  addTaskStep: (step) => {
    const id = crypto.randomUUID()
    set((state) => ({ taskSteps: [...state.taskSteps, { ...step, id }] }))
    return id
  },
  updateTaskStep: (id, updates) =>
    set((state) => ({
      taskSteps: state.taskSteps.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    })),
  clearTaskSteps: () => set({ taskSteps: [] }),

  previewUrl: null,
  setPreviewUrl: (url) => set({ previewUrl: url }),
  previewStatus: 'idle',
  setPreviewStatus: (status) => set({ previewStatus: status }),

  logs: [],
  addLog: (log) =>
    set((state) => {
      // Strip ANSI escape sequences
      const cleanMessage = log.message
        .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
        .replace(/\r/g, '')

      // Ignore if empty
      if (!cleanMessage.trim()) return {}

      // Split multiple lines in stream chunk
      const lines = cleanMessage.split('\n').filter((l) => l.trim() !== '')
      if (lines.length === 0) return {}

      const newLogs = lines.map((line) => {
        let detectedType = log.type
        if (detectedType === 'output' || detectedType === 'info') {
          const lower = line.toLowerCase()
          if (lower.includes('error') || lower.includes('failed') || lower.includes('err_') || lower.includes('invariant:')) {
            detectedType = 'error'
          } else if (lower.includes('success') || lower.includes('ready') || lower.includes('compiled successfully') || lower.includes('environment ready')) {
            detectedType = 'success'
          } else if (lower.includes('warning') || lower.includes('warn')) {
            detectedType = 'warning'
          }
        }

        return {
          ...log,
          type: detectedType,
          message: line,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        }
      })

      return { logs: [...state.logs, ...newLogs] }
    }),
  clearLogs: () => set({ logs: [] }),

  activeView: 'preview',
  setActiveView: (view) => set({ activeView: view }),
  isGenerating: false,
  setIsGenerating: (generating) => set({ isGenerating: generating }),

  selectedModel: typeof window !== 'undefined' ? localStorage.getItem('vibe_selected_model') || 'gpt-4o' : 'gpt-4o',
  setSelectedModel: (model) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibe_selected_model', model)
    }
    set({ selectedModel: model })
  },
  openaiApiKey: typeof window !== 'undefined' ? localStorage.getItem('vibe_openai_api_key') || '' : '',
  geminiApiKey: typeof window !== 'undefined' ? localStorage.getItem('vibe_gemini_api_key') || '' : '',
  setOpenaiApiKey: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibe_openai_api_key', key)
    }
    set({ openaiApiKey: key })
  },
  setGeminiApiKey: (key) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('vibe_gemini_api_key', key)
    }
    set({ geminiApiKey: key })
  },
}))

export function parseGeneratedFiles(response: string): GeneratedFile[] {
  const files: GeneratedFile[] = []
  // Match ```(any-language):(file/path) or ```(file/path) with no language prefix
  const codeBlockRegex = /```(?:[a-zA-Z0-9._-]*)?:([^\n`]+)\n([\s\S]*?)```/g
  
  let match
  while ((match = codeBlockRegex.exec(response)) !== null) {
    const filePath = match[1].trim()
    const content = match[2].trim()
    // Skip empty blocks and obvious non-file paths
    if (!filePath || !content) continue
    files.push({
      path: filePath.startsWith('/') ? filePath.slice(1) : filePath,
      content,
      status: 'done',
    })
  }
  return files
}
