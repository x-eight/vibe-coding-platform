'use client'

import { useAppStore } from '@/lib/store'
import { ExternalLink, RefreshCw, Loader2, FileIcon, FolderIcon, ChevronRight, ChevronDown, Monitor, Code2, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useMemo } from 'react'

interface FileTreeNode {
  name: string
  path: string
  type: 'file' | 'folder'
  children?: FileTreeNode[]
}

function buildFileTree(files: { path: string; content: string }[]): FileTreeNode[] {
  const root: FileTreeNode[] = []

  for (const file of files) {
    const parts = file.path.split('/')
    let currentLevel = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      const existingNode = currentLevel.find((n) => n.name === part)

      if (existingNode) {
        if (!isFile && existingNode.children) {
          currentLevel = existingNode.children
        }
      } else {
        const newNode: FileTreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        }
        currentLevel.push(newNode)
        if (!isFile && newNode.children) {
          currentLevel = newNode.children
        }
      }
    }
  }

  return root
}

function FileTreeItem({ node, level = 0 }: { node: FileTreeNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { selectedFilePath, setSelectedFilePath } = useAppStore()

  const isSelected = selectedFilePath === node.path

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 w-full py-1.5 px-2 hover:bg-primary/5 rounded-lg text-sm transition-colors"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <FolderIcon className="h-4 w-4 text-primary/70" />
          <span className="text-foreground">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeItem key={child.path} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setSelectedFilePath(node.path)}
      className={`flex items-center gap-2 w-full py-1.5 px-2 hover:bg-primary/5 rounded-lg text-sm transition-colors ${
        isSelected ? 'bg-primary/10 text-primary' : ''
      }`}
      style={{ paddingLeft: `${level * 12 + 20}px` }}
    >
      <FileIcon className="h-4 w-4 text-muted-foreground" />
      <span>{node.name}</span>
    </button>
  )
}

export function PreviewPanel() {
  const { 
    generatedFiles, 
    previewUrl, 
    previewStatus,
    selectedFilePath,
    logs,
    activeView,
    setActiveView,
  } = useAppStore()
  const [refreshKey, setRefreshKey] = useState(0)

  const fileTree = useMemo(() => {
    return buildFileTree(generatedFiles)
  }, [generatedFiles])

  const selectedFileContent = useMemo(() => {
    const file = generatedFiles.find((f) => f.path === selectedFilePath)
    return file?.content || ''
  }, [generatedFiles, selectedFilePath])

  const refreshPreview = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const getStatusText = () => {
    switch (previewStatus) {
      case 'booting': return 'Booting...'
      case 'installing': return 'Installing...'
      case 'running': return 'Starting...'
      case 'ready': return 'Ready'
      case 'error': return 'Error'
      default: return 'Idle'
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border/40 px-4">
        <div className="flex">
          <button
            onClick={() => setActiveView('preview')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'preview' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Monitor className="h-4 w-4" />
            Preview
          </button>
          <button
            onClick={() => setActiveView('code')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'code' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code2 className="h-4 w-4" />
            Code
          </button>
          <button
            onClick={() => setActiveView('terminal')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === 'terminal' 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Terminal className="h-4 w-4" />
            Output
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            previewStatus === 'ready' ? 'bg-success/10 text-success' :
            previewStatus === 'error' ? 'bg-destructive/10 text-destructive' :
            previewStatus === 'idle' ? 'bg-muted text-muted-foreground' :
            'bg-primary/10 text-primary'
          }`}>
            {getStatusText()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={refreshPreview}
            disabled={!previewUrl}
          >
            <RefreshCw className={`h-4 w-4 ${previewStatus === 'installing' || previewStatus === 'running' ? 'animate-spin' : ''}`} />
          </Button>
          {previewUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'preview' && (
          <div className="h-full relative">
            {previewStatus !== 'idle' && previewStatus !== 'ready' && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{getStatusText()}</span>
                </div>
              </div>
            )}
            
            {previewUrl ? (
              <iframe
                key={refreshKey}
                src={previewUrl}
                className="w-full h-full border-0 bg-white"
                title="Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="mb-4 mx-auto w-16 h-16 rounded-2xl bg-card border border-border/50 flex items-center justify-center">
                    <Monitor className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Preview will appear here</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Start by describing your app</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === 'code' && (
          <div className="flex h-full">
            {/* File tree */}
            <div className="w-56 border-r border-border/40 overflow-y-auto py-2 px-2">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                Files
              </div>
              {fileTree.length > 0 ? (
                fileTree.map((node) => (
                  <FileTreeItem key={node.path} node={node} />
                ))
              ) : (
                <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
                  No files yet
                </div>
              )}
            </div>
            
            {/* File content */}
            <div className="flex-1 overflow-auto bg-card/30">
              {selectedFileContent ? (
                <pre className="p-4 text-xs font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {selectedFileContent}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Select a file to view its contents
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'terminal' && (
          <div className="h-full overflow-auto bg-card/30 p-4 terminal-output">
            {logs.length > 0 ? (
              <div className="space-y-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`text-xs font-mono ${
                      log.type === 'error' ? 'error' :
                      log.type === 'success' ? 'success' :
                      log.type === 'command' ? 'command' :
                      log.type === 'warning' ? 'warning' :
                      'info'
                    }`}
                  >
                    {log.type === 'command' && <span className="text-muted-foreground">$ </span>}
                    {log.message}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Terminal output will appear here
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
