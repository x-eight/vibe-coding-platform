# Vibe Coding Platform ⚡

[![Next.js](https://img.shields.io/badge/Next.js-15.0%2B-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![LangChain](https://img.shields.io/badge/LangChain-Enabled-1C3C3C?style=for-the-badge&logo=chainlink&logoColor=white)](https://js.langchain.com/)
[![Zustand](https://img.shields.io/badge/Zustand-State_Management-navy?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![WebContainers](https://img.shields.io/badge/WebContainers-In--Browser_OS-purple?style=for-the-badge&logo=webassembly&logoColor=white)](https://webcontainers.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

An advanced, production-grade **Vibe Coding Platform** that empowers users to build, edit, install dependencies, and execute full-stack web applications completely in the browser using AI. 

Leveraging cutting-edge technologies like WebAssembly-powered browser sandboxing (**WebContainers**), cloud compute isolation (**Vercel Sandbox**), and real-time streaming LLM orchestration via **LangChain**, this platform represents the next generation of AI-assisted, zero-config software engineering environments.

---

## ⚡ System Architecture & Execution Flow

This platform combines a streaming AI compiler with dual execution sandboxes. The flowchart below details how a user prompt is compiled into real-time in-browser previews:

```mermaid
flowchart TD
    subgraph Client [Browser Client]
        UI[Workspace UI] -->|1. Prompt + API Keys| API_Chat
        UI -->|Keys persisted locally| LocalStore[(Browser LocalStorage)]
    end

    subgraph Server [Next.js Server API]
        API_Chat[/api/chat Route] -->|2. Resolves keys & prompt| LangChain[LangChain Agent]
        LangChain -->|3. Streaming Markdown Blocks| API_Chat
    end

    subgraph Execution [Dual Sandbox Engine]
        API_Chat -->|4. SSE Streaming Chunk| UI
        UI -->|5. Regex Parser| FileParser[Code & File Parser]
        
        FileParser -->|6a. Direct File System Writes| WebContainer[WebContainer API WA Sandbox]
        FileParser -.->|6b. Cloud Sandbox Route| VercelSandbox[Vercel Sandbox Cloud]
        
        WebContainer -->|7. npm install offline| WC_Deps[Sandboxed node_modules]
        WebContainer -->|8. npm run dev| WC_Server[In-Browser Server Ready Event]
        
        WC_Server -->|9. Exposes localhost URL| Iframe[Live Preview Iframe]
        WC_Server -->|10. Streams stdout/stderr| Terminal[Logs Panel]
    end

    classDef client fill:#1E293B,stroke:#3B82F6,stroke-width:2px,color:#fff;
    classDef server fill:#0F172A,stroke:#10B981,stroke-width:2px,color:#fff;
    classDef exec fill:#020617,stroke:#8B5CF6,stroke-width:2px,color:#fff;
    class Client client;
    class Server server;
    class Execution exec;
```

---

## ✨ Features

- **💻 In-Browser WebContainer Sandbox**: Runs full-stack Node.js environments inside a secure browser WebAssembly sandbox via `@webcontainer/api`. Users can run actual dev servers, write files, and inspect outputs with zero local dependencies.
- **☁️ Cloud Vercel Sandbox Fallback**: Integrated Cloud Sandbox support through `@vercel/sandbox` allowing the generation and execution of environments in fully isolated remote runtimes.
- **🤖 LangChain Streaming (OpenAI & Gemini)**: Orchestrated streaming via LangChain (`@langchain/openai` and `@langchain/google`). Markdown code blocks are compiled and streamed chunk-by-chunk using Server-Sent Events (`text/event-stream`).
- **🛡️ Advanced Security Shield**:
  - **Zero credential leaks**: No hardcoded API keys exist in the codebase.
  - **Dual API Key Routing**: Developers can input and persist their own OpenAI and Gemini keys securely inside their browser `localStorage`, or fall back to secure backend server environment variables (`.env`).
  - **Watertight `.gitignore`**: Pre-configured to ignore all forms of environment variables and sandbox operational artifacts.
- **🧊 Premium Glassmorphic Workspace UI**:
  - **Live Preview Panel**: Real-time rendering inside a sandboxed Iframe connected to the container port.
  - **Code Inspector**: Interactive file explorer tree-view with individual file content tabs.
  - **Live Telemetry Terminal**: Color-coded, ANSI-stripped system log terminal tracking package installs and server output.
- **📦 Ultra-Fast Sandboxed Installation**: Executed with speed optimization flags (`--prefer-offline`, `--no-audit`, `--no-fund`) minimizing registry lookups inside the sandbox.

---

## 📂 Project Directory Structure

```bash
├── LICENSE                  # MIT License
├── README.md                # Project documentation & architecture guides
├── .gitignore               # Multi-environment secret protection
├── .env.example             # Clean template configuration for environment setups
├── package.json             # Scripts, LangChain, Zustand & WebContainer dependencies
├── tsconfig.json            # Strict TypeScript configuration
├── lib
│   ├── store.ts             # Centralized Zustand state store & streaming block parsers
│   ├── utils.ts             # Style merging helper utilities
│   └── webcontainer.ts      # WebContainer API boots, commands & event listeners
├── components
│   ├── chat-panel.tsx       # Prompt input & streaming assistant message threads
│   ├── file-explorer.tsx    # Tree-view directory manager for compiled files
│   ├── header.tsx           # Model selectors & secure client-side key config modals
│   ├── logs-panel.tsx       # Live sandboxed console terminal
│   ├── preview-panel.tsx    # Multi-tab view container (Preview Iframe, Code, Console)
│   ├── tab-bar.tsx          # Tab switching manager
│   ├── theme-provider.tsx   # Global dark mode theme provider
│   └── vibe-coding-platform.tsx # High-level workspace layout wrapper
└── app
    ├── api
    │   ├── chat             # SSE router carrying LangChain prompt templates
    │   └── sandbox          # API endpoint spinning up Vercel Cloud Sandboxes
    ├── globals.css          # Tailwind CSS styling framework
    ├── layout.tsx           # Primary HTML header structures
    └── page.tsx             # Next.js workspace viewport entrypoint
```

---

## 🛠️ Getting Started

### 1. Clone & Install Dependencies

Ensure you have **Node.js 18+** installed locally:

```bash
git clone https://github.com/x-eight/vibe-coding-platform.git
cd vibe-coding-platform
pnpm install # or npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (automatically ignored by Git). You can copy the template:

```bash
cp .env.example .env
```

Open `.env` and configure your fallback keys:

```env
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here
```
> Note: If no backend variables are set, the application will prompt users to configure their own keys in the **Settings Dialog** (Key Icon 🔑) inside the app header. Client-side keys are stored securely inside the browser's local sandbox.

### 3. Spin Up local dev environment

Start the local Next.js development server:

```bash
pnpm dev
# or
npm run dev
```

Navigate your browser to [http://localhost:3000](http://localhost:3000) to open the interactive AI workspace!

---

## 🔒 Security Best Practices

When publishing this repository or hosting it publicly, keep the following security structures in mind:

1. **Shared Environment Variables**: If deploying on public hosters like Vercel, do not input personal keys in the public `.env` file. Utilize the hoster's environment panel or rely entirely on client-side key storage.
2. **Cross-Origin Isolation Headers**: WebContainers require SharedArrayBuffer capabilities. The application is pre-configured with security headers inside `next.config.mjs` to satisfy these requirements:
   ```javascript
   headers.push(
     { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
     { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }
   );
   ```

---

## ⚖️ License

This project is licensed under the MIT License. See `LICENSE` for more information.

Developed with 💙 by [x-eight](https://github.com/x-eight).
# vibe-coding-platform
