import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { existsSync, readFileSync } from 'fs'
import type { Plugin } from 'vite'

function serveDataDir(): Plugin {
  const dataDir = path.resolve(__dirname, '../data')
  return {
    name: 'serve-data-dir',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const prefix = '/dragon-traveler-wiki/data/'
        if (req.url?.startsWith(prefix)) {
          const filename = req.url.slice(prefix.length)
          const filepath = path.join(dataDir, filename)
          if (existsSync(filepath)) {
            res.setHeader('Content-Type', 'application/json')
            res.end(readFileSync(filepath, 'utf-8'))
            return
          }
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), serveDataDir()],
  base: '/dragon-traveler-wiki/',
})
