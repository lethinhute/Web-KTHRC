import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

// Plugin to serve parent directory static assets (img, font, videos)
function serveParentAssets() {
  const assetDirs = ['img', 'font', 'videos']
  return {
    name: 'serve-parent-assets',
    configureServer(server: { middlewares: { use: (path: string, handler: Function) => void } }) {
      assetDirs.forEach((dir) => {
        server.middlewares.use(`/${dir}`, (req: { url: string }, res: { writeHead: Function; end: Function; pipe: Function }, next: Function) => {
          const filePath = path.join(rootDir, dir, req.url)
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
            fs.createReadStream(filePath).pipe(res as any)
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
