'use client'

import { useAppStore } from '@/lib/store'
import { useState, useEffect } from 'react'
import { ChevronDown, HelpCircle, Github, Download, Settings, Key, Eye, EyeOff, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import JSZip from 'jszip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface ModelConfig {
  id: string
  name: string
  provider: 'openai' | 'google'
  description: string
}

export const MODELS: ModelConfig[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', description: 'OpenAI - High capability' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', description: 'OpenAI - Fast & affordable' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai', description: 'OpenAI - Quick responses' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'google', description: 'Google - Balanced speed & quality' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', description: 'Google - Ultimate reasoning' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', description: 'Google - Super fast light model' },
]

export function Header() {
  const { generatedFiles } = useAppStore()

  const handleDownloadZip = async () => {
    if (generatedFiles.length === 0) return
    const zip = new JSZip()
    
    generatedFiles.forEach((file) => {
      zip.file(file.path, file.content)
    })
    
    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vibe-coding-project.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 text-foreground"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        <span className="text-sm font-semibold tracking-wide uppercase">
          OSS Vibe Coding Platform
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Model Selector & Keys UI */}
        <ModelSelector />
        <APISettingsDialog />

        <div className="h-4 w-[1px] bg-border mx-1" />

        {generatedFiles.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadZip}
            className="gap-1.5 h-8 text-xs bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Download ZIP
          </Button>
        )}
        <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs">
          <HelpCircle className="h-4 w-4" />
          What&apos;s this?
        </Button>
        <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs">
          <Github className="h-4 w-4" />
          Clone Template
        </Button>
      </div>
    </header>
  )
}

export function ModelSelector() {
  const { selectedModel, setSelectedModel } = useAppStore()
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs font-medium cursor-pointer">
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${currentModel.provider === 'openai' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
            {currentModel.name}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[220px] bg-background/95 backdrop-blur-md border-border/60">
        {MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
            className="flex flex-col items-start gap-0.5 py-2 cursor-pointer focus:bg-accent"
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${model.provider === 'openai' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <span className="font-semibold text-xs">{model.name}</span>
            </div>
            <span className="text-[10px] text-muted-foreground leading-normal">
              {model.description}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function APISettingsDialog() {
  const { openaiApiKey, setOpenaiApiKey, geminiApiKey, setGeminiApiKey } = useAppStore()
  const [showOpenAI, setShowOpenAI] = useState(false)
  const [showGemini, setShowGemini] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Local state to prevent input stuttering
  const [localOpenAIKey, setLocalOpenAIKey] = useState(openaiApiKey)
  const [localGeminiKey, setLocalGeminiKey] = useState(geminiApiKey)

  // Synchronize local keys when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalOpenAIKey(openaiApiKey)
      setLocalGeminiKey(geminiApiKey)
    }
  }, [isOpen, openaiApiKey, geminiApiKey])

  const handleSave = () => {
    setOpenaiApiKey(localOpenAIKey.trim())
    setGeminiApiKey(localGeminiKey.trim())
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 cursor-pointer" title="API Keys Settings">
          <Settings className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] bg-background/95 backdrop-blur-md border border-border/60 shadow-2xl rounded-2xl p-5">
        <DialogHeader className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Key className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold tracking-tight">API Key Settings</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure your custom API credentials here. They are saved securely in your browser's local storage and used directly in server interactions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* OpenAI Key field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="openai-key" className="text-xs font-semibold">
                OpenAI API Key
              </Label>
              {openaiApiKey ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Saved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Using Env Var
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <Input
                id="openai-key"
                type={showOpenAI ? 'text' : 'password'}
                placeholder="sk-proj-..."
                value={localOpenAIKey}
                onChange={(e) => setLocalOpenAIKey(e.target.value)}
                className="pr-10 bg-secondary/10 border-border/40 focus:border-primary/40 focus:ring-primary/10 text-xs h-9"
              />
              <button
                type="button"
                onClick={() => setShowOpenAI(!showOpenAI)}
                className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showOpenAI ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Gemini Key field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="gemini-key" className="text-xs font-semibold">
                Gemini API Key
              </Label>
              {geminiApiKey ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Saved
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Using Env Var
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <Input
                id="gemini-key"
                type={showGemini ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={localGeminiKey}
                onChange={(e) => setLocalGeminiKey(e.target.value)}
                className="pr-10 bg-secondary/10 border-border/40 focus:border-primary/40 focus:ring-primary/10 text-xs h-9"
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                {showGemini ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-secondary/25 border border-border/30 p-3 flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-normal">
            Your credentials are kept 100% locally in your own browser's storage and only passed in your dynamic request payloads.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 border-t border-border/40 pt-4 mt-3 flex items-center justify-end">
          <DialogClose asChild>
            <Button variant="ghost" size="sm" className="h-8 text-xs cursor-pointer">
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} size="sm" className="h-8 px-4 font-semibold text-xs cursor-pointer">
            Save Keys
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
