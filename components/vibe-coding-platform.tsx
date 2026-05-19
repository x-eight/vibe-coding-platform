'use client'

import { Header } from './header'
import { ChatPanel } from './chat-panel'
import { PreviewPanel } from './preview-panel'

export function VibeCodingPlatform() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      
      {/* Main layout - two panels like the original */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Chat */}
        <div className="flex w-[50%] min-w-[400px] flex-col border-r border-border">
          <ChatPanel />
        </div>

        {/* Right panel - Preview with filesystem and output */}
        <div className="flex flex-1 flex-col">
          <PreviewPanel />
        </div>
      </div>
    </div>
  )
}
