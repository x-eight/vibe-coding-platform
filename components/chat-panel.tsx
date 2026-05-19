'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, Sparkles, Loader2, Check, Circle, AlertCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore, parseGeneratedFiles, type TaskStep } from '@/lib/store'
import {
  getWebContainer,
  writeFiles,
  installDependencies,
  startDevServer,
} from '@/lib/webcontainer'

const PROMPTS = [
  'Build a counter app with increment and decrement',
  'Create a todo list with add and delete',
  'Make a landing page with hero section',
  'Build a contact form with validation',
]

function TaskStepItem({ step }: { step: TaskStep }) {
  const getIcon = () => {
    if (step.status === 'done') return <Check className="h-3.5 w-3.5 text-success" />
    if (step.status === 'running') return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
    if (step.status === 'error') return <AlertCircle className="h-3.5 w-3.5 text-destructive" />
    return <Circle className="h-3.5 w-3.5 text-muted-foreground" />
  }

  return (
    <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="text-sm font-medium">{step.title}</span>
      </div>
      {step.details && step.details.length > 0 && (
        <div className="mt-2 space-y-1 pl-5">
          {step.details.map((detail, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="h-3 w-3 text-success" />
              <span className="font-mono">{detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ChatPanel() {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    isLoading,
    addMessage,
    updateLastAssistantMessage,
    setLoading,
    clearMessages,
    setGeneratedFiles,
    clearGeneratedFiles,
    taskSteps,
    addTaskStep,
    updateTaskStep,
    clearTaskSteps,
    setPreviewUrl,
    setPreviewStatus,
    addLog,
    clearLogs,
    selectedModel,
    setIsGenerating,
    openaiApiKey,
    geminiApiKey,
  } = useAppStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, taskSteps])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    
    clearTaskSteps()
    clearGeneratedFiles()
    clearLogs()
    setPreviewUrl(null)
    setPreviewStatus('idle')

    addMessage({ role: 'user', content: userMessage })
    addMessage({ role: 'assistant', content: '' })
    setLoading(true)
    setIsGenerating(true)

    addLog({ type: 'info', message: `Processing: "${userMessage}"` })

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }].map(
            (m) => ({ role: m.role, content: m.content })
          ),
          model: selectedModel,
          openaiApiKey: openaiApiKey || undefined,
          geminiApiKey: geminiApiKey || undefined,
        }),
      })

      if (!response.ok) {
        let errorMsg = 'Failed to get response'
        try {
          const errData = await response.json()
          if (errData?.error) {
            errorMsg = errData.error
          }
        } catch {
          // Ignore parse errors
        }
        throw new Error(errorMsg)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break

            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                fullContent += parsed.content
                updateLastAssistantMessage(fullContent)
              }
            } catch {
              // Skip
            }
          }
        }
      }

      const files = parseGeneratedFiles(fullContent)
      
      if (files.length > 0) {
        addLog({ type: 'success', message: `Generated ${files.length} files` })
        setGeneratedFiles(files)

        // Boot WebContainer
        const bootStepId = addTaskStep({
          type: 'boot',
          title: 'Initializing Environment',
          status: 'running',
        })
        setPreviewStatus('booting')
        addLog({ type: 'command', message: 'Booting WebContainer...' })

        try {
          await getWebContainer()
          updateTaskStep(bootStepId, { status: 'done' })
          addLog({ type: 'success', message: 'Environment ready' })

          // Write files
          const filesStepId = addTaskStep({
            type: 'files',
            title: 'Writing Files',
            status: 'running',
            details: files.map((f) => f.path),
          })

          await writeFiles(files)
          updateTaskStep(filesStepId, { status: 'done' })
          addLog({ type: 'success', message: 'Files written' })

          // Install dependencies
          const installStepId = addTaskStep({
            type: 'install',
            title: 'Installing Dependencies',
            status: 'running',
          })
          setPreviewStatus('installing')

          const installResult = await installDependencies((data) => {
            addLog({ type: 'output', message: data })
          })

          if (!installResult.success) {
            updateTaskStep(installStepId, { status: 'error' })
            setPreviewStatus('error')
            addLog({ type: 'error', message: installResult.error || 'Install failed' })
          } else {
            updateTaskStep(installStepId, { status: 'done' })
            addLog({ type: 'success', message: 'Dependencies installed' })

            // Start dev server
            const serverStepId = addTaskStep({
              type: 'server',
              title: 'Starting Dev Server',
              status: 'running',
            })
            setPreviewStatus('running')

            await startDevServer(
              (data) => {
                addLog({ type: 'output', message: data })
              },
              (url) => {
                updateTaskStep(serverStepId, { status: 'done' })
                addTaskStep({
                  type: 'ready',
                  title: 'Application Ready',
                  status: 'done',
                  details: [url],
                })
                setPreviewUrl(url)
                setPreviewStatus('ready')
                addLog({ type: 'success', message: `Server running at ${url}` })
              }
            )
          }
        } catch (err) {
          addLog({ type: 'error', message: `Error: ${err}` })
          setPreviewStatus('error')
        }
      }
    } catch (err) {
      addLog({ type: 'error', message: `Error: ${err}` })
      updateLastAssistantMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
      setIsGenerating(false)
    }
  }

  const handleClear = () => {
    clearMessages()
    clearTaskSteps()
    clearGeneratedFiles()
    clearLogs()
    setPreviewUrl(null)
    setPreviewStatus('idle')
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold">Assistant</span>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">What do you want to build?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Describe your app and watch it come to life
              </p>
            </div>
            <div className="grid w-full max-w-sm gap-2">
              {PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="rounded-xl border border-border/50 bg-card/30 px-4 py-3 text-left text-sm transition-all hover:border-primary/30 hover:bg-card/60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card/60 border border-border/40'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content ? message.content.split('```')[0].trim() || 'Generating...' : 'Thinking...'}
                  </p>
                </div>
              </div>
            ))}
            
            {taskSteps.length > 0 && (
              <div className="space-y-2 pt-2">
                {taskSteps.map((step) => (
                  <TaskStepItem key={step.id} step={step} />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/40 p-4">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Describe what you want to build..."
            className="flex-1 resize-none rounded-xl border border-border/50 bg-card/30 px-4 py-3 text-sm placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            rows={1}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-11 w-11 shrink-0 rounded-xl bg-primary hover:bg-primary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
