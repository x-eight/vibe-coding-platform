'use client'

import { useAppStore } from '@/lib/store'
import { MessageSquare, Eye, FolderTree, Terminal } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'files', label: 'Files', icon: FolderTree },
  { id: 'logs', label: 'Logs', icon: Terminal },
] as const

export function TabBar() {
  const { activeTab, setActiveTab, isLoading, files, logs } = useAppStore()

  return (
    <div className="flex items-center border-b border-border bg-card px-2">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        // Show indicators
        const showFilesIndicator = tab.id === 'files' && files.length > 0
        const showLogsIndicator = tab.id === 'logs' && logs.length > 0
        const showLoadingIndicator = tab.id === 'chat' && isLoading

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
            
            {/* Active indicator */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
            
            {/* Badge indicators */}
            {(showFilesIndicator || showLogsIndicator) && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                {tab.id === 'files' ? files.length : logs.length}
              </span>
            )}
            
            {/* Loading indicator */}
            {showLoadingIndicator && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            )}
          </button>
        )
      })}
    </div>
  )
}
