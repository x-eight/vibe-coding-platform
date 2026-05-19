import { Sandbox } from '@vercel/sandbox'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json() as { files: { path: string; content: string }[] }

    // Create sandbox
    const sandbox = await Sandbox.create()

    // Write all files to sandbox
    for (const file of files) {
      await sandbox.fs.write(file.path, file.content)
    }

    // Install dependencies
    const installResult = await sandbox.commands.run('pnpm install')
    
    // Start the dev server in background
    const devProcess = await sandbox.commands.run('pnpm run dev', {
      background: true,
    })

    // Wait for the server to be ready
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Get the sandbox URL
    const url = sandbox.getHost(3000)

    return Response.json({
      success: true,
      url: `https://${url}`,
      sandboxId: sandbox.id,
      installOutput: installResult.stdout,
    })
  } catch (error) {
    console.error('Sandbox creation error:', error)
    return Response.json(
      { 
        error: 'Failed to create sandbox',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
