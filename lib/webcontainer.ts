'use client'

import { WebContainer } from '@webcontainer/api'
import type { GeneratedFile } from './store'

let webcontainerInstance: WebContainer | null = null
let bootPromise: Promise<WebContainer> | null = null

export async function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) return webcontainerInstance
  
  if (!bootPromise) {
    bootPromise = WebContainer.boot()
  }
  
  webcontainerInstance = await bootPromise
  return webcontainerInstance
}

export async function writeFiles(files: GeneratedFile[]): Promise<void> {
  const wc = await getWebContainer()
  
  for (const file of files) {
    const parts = file.path.split('/')
    if (parts.length > 1) {
      const dir = parts.slice(0, -1).join('/')
      await wc.fs.mkdir(dir, { recursive: true })
    }
    await wc.fs.writeFile(file.path, file.content)
  }
}

export async function installDependencies(
  onOutput: (data: string) => void
): Promise<{ success: boolean; error?: string }> {
  const wc = await getWebContainer()
  
  // Speed up installations inside the restricted sandbox using performance flags:
  // --prefer-offline: prioritize cached files over fresh registry downloads
  // --no-audit: skip slow security audit analysis
  // --no-fund: skip unnecessary funding notifications
  const installProcess = await wc.spawn('npm', [
    'install',
    '--prefer-offline',
    '--no-audit',
    '--no-fund',
  ])
  
  installProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        onOutput(data)
      },
    })
  )
  
  const exitCode = await installProcess.exit
  
  if (exitCode !== 0) {
    return { success: false, error: `npm install failed with exit code ${exitCode}` }
  }
  
  return { success: true }
}

export async function startDevServer(
  onOutput: (data: string) => void,
  onServerReady: (url: string) => void
): Promise<void> {
  const wc = await getWebContainer()
  
  const serverProcess = await wc.spawn('npm', ['run', 'dev'])
  
  serverProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        onOutput(data)
      },
    })
  )
  
  wc.on('server-ready', (port, url) => {
    onServerReady(url)
  })
}

export async function readDir(path: string): Promise<string[]> {
  const wc = await getWebContainer()
  try {
    const entries = await wc.fs.readdir(path, { withFileTypes: true })
    return entries.map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
  } catch {
    return []
  }
}

export async function readFile(path: string): Promise<string> {
  const wc = await getWebContainer()
  try {
    return await wc.fs.readFile(path, 'utf-8')
  } catch {
    return ''
  }
}

export function destroyWebContainer(): void {
  if (webcontainerInstance) {
    webcontainerInstance.teardown()
    webcontainerInstance = null
    bootPromise = null
  }
}
