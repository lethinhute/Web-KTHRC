import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Plugin to serve parent directory static assets (img, font, videos)
function serveParentAssets(): Plugin {
  const assetDirs = ['img', 'font', 'videos']
  return {
    name: 'serve-parent-assets',
    configureServer(server) {
      assetDirs.forEach((dir) => {
        server.middlewares.use(`/${dir}`, (req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const requestPath = req.url ?? ''
          const filePath = path.join(rootDir, dir, requestPath)
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase()
            const mimeTypes: Record<string, string> = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.svg': 'image/svg+xml',
              '.ico': 'image/x-icon',
              '.gif': 'image/gif',
              '.mp4': 'video/mp4',
              '.ttf': 'font/truetype',
              '.otf': 'font/otf',
            }
            const mime = mimeTypes[ext] || 'application/octet-stream'
            res.writeHead(200, { 'Content-Type': mime })
            fs.createReadStream(filePath).pipe(res)
          } else {
            next()
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveParentAssets()],
  build: {
    outDir: path.resolve(rootDir, 'src', 'public'),
    emptyOutDir: true,
  },
})
