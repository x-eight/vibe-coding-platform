'use client'

import { useAppStore } from '@/lib/store'
import { Terminal, AlertCircle, CheckCircle, Info, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LogIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'error':
      return <AlertCircle className="h-3.5 w-3.5 text-red-400" />
    case 'success':
      return <CheckCircle className="h-3.5 w-3.5 text-green-400" />
    case 'command':
      return <Terminal className="h-3.5 w-3.5 text-blue-400" />
    default:
      return <Info className="h-3.5 w-3.5 text-muted-foreground" />
  }
}

export function LogsPanel() {
  const { logs, clearLogs } = useAppStore()

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Logs</span>
          {logs.length > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground">
              {logs.length}
            </span>
          )}
        </div>
        {logs.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearLogs}
            className="h-7 w-7"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Logs content */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Terminal className="mb-4 h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">No logs yet</p>
            <p className="mt-1 text-muted-foreground/70">
              Logs will appear here as you interact
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className={cn(
                  'flex items-start gap-2 rounded-md px-2 py-1.5',
                  log.type === 'error' && 'bg-red-500/10',
                  log.type === 'success' && 'bg-green-500/10'
                )}
              >
                <span className="shrink-0 text-muted-foreground/70">
                  [{formatTime(log.timestamp)}]
                </span>
                <LogIcon type={log.type} />
                <span
                  className={cn(
                    'flex-1',
                    log.type === 'error' && 'text-red-400',
                    log.type === 'success' && 'text-green-400',
                    log.type === 'command' && 'text-blue-400',
                    log.type === 'info' && 'text-muted-foreground'
                  )}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
