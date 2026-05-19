import { ChatOpenAI } from '@langchain/openai'
import { ChatGoogle } from '@langchain/google'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

const prompt = fs.readFileSync(
  path.join(process.cwd(), 'app/api/chat/prompt.md'),
  'utf-8'
)

interface LLMRequest {
  model: string
  openaiApiKey?: string
  geminiApiKey?: string
}

function getLLM(req: LLMRequest) {
  const { model, openaiApiKey, geminiApiKey } = req

  // Detect provider based on model ID prefix
  if (model.startsWith('gpt-') || model.startsWith('o1-') || model.startsWith('o3-')) {
    const apiKey = openaiApiKey?.trim() || process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API Key is missing. Configure it in Settings or set OPENAI_API_KEY in your environment.')
    }
    return new ChatOpenAI({
      modelName: model,
      openAIApiKey: apiKey,
      temperature: 0.2,
      maxTokens: 8192,
      streaming: true,
    })
  }
  
  if (model.startsWith('gemini-')) {
    const apiKey = geminiApiKey?.trim() || process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('Gemini API Key is missing. Configure it in Settings or set GEMINI_API_KEY in your environment.')
    }
    return new ChatGoogle({
      apiKey: apiKey,
      model: model,
      streaming: true,
      temperature: 0.1,
      maxOutputTokens: 8192,
    })
  }

  throw new Error(`Unsupported model selected: "${model}"`)
}

export async function POST(request: NextRequest) {
  try {
    const { messages, model = 'gpt-4o', openaiApiKey, geminiApiKey } = await request.json()

    let llm
    try {
      llm = getLLM({ model, openaiApiKey, geminiApiKey })
    } catch (e: any) {
      return Response.json(
        { error: e.message || 'Model configuration error' },
        { status: 400 }
      )
    }

    const langchainMessages = [
      new SystemMessage(prompt),
      ...messages.map((msg: { role: string; content: string }) => {
        if (msg.role === 'user') {
          return new HumanMessage(msg.content)
        }
        return new AIMessage(msg.content)
      }),
    ]

    const stream = await llm.stream(langchainMessages)

    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.content
            if (typeof content === 'string' && content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              )
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
}
