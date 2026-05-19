'use client'

import { useAppStore } from '@/lib/store'
import {
  ChevronRight,
  ChevronDown,
  FileCode,
  Folder,
  FolderOpen,
  FileText,
  FileJson,
  File,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'tsx':
    case 'ts':
    case 'jsx':
    case 'js':
      return <FileCode className="h-4 w-4 text-blue-400" />
    case 'json':
      return <FileJson className="h-4 w-4 text-yellow-400" />
    case 'md':
    case 'txt':
      return <FileText className="h-4 w-4 text-muted-foreground" />
    case 'css':
    case 'scss':
      return <FileCode className="h-4 w-4 text-pink-400" />
    default:
      return <File className="h-4 w-4 text-muted-foreground" />
  }
}

interface FileNodeProps {
  node: {
    name: string
    path: string
    type: 'file' | 'folder'
    content?: string
    children?: any[]
  }
  level: number
}

function FileNode({ node, level }: FileNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const { selectedFile, selectFile } = useAppStore()

  const isSelected = selectedFile?.path === node.path

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex w-full items-center gap-1 px-2 py-1.5 text-sm hover:bg-accent/50 rounded-md transition-colors',
            'text-muted-foreground hover:text-foreground'
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-blue-400" />
          ) : (
            <Folder className="h-4 w-4 text-blue-400" />
          )}
          <span className="ml-1">{node.name}</span>
        </button>
        {isExpanded && node.children && (
          <div>
            {node.children.map((child: any) => (
              <FileNode key={child.path} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => selectFile(node)}
      className={cn(
        'flex w-full items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors',
        isSelected
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      )}
      style={{ paddingLeft: `${level * 12 + 20}px` }}
    >
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </button>
  )
}

export function FileExplorer() {
  const { files, selectedFile } = useAppStore()

  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <Folder className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          No files generated yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Start a conversation to generate code
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* File tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {files.map((node) => (
          <FileNode key={node.path} node={node} level={0} />
        ))}
      </div>

      {/* File content preview */}
      {selectedFile && selectedFile.content && (
        <div className="border-t border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              {selectedFile.path}
            </span>
          </div>
          <div className="max-h-64 overflow-auto bg-card/50 p-3">
            <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
              {selectedFile.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
