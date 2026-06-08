import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const isWindows = process.platform === 'win32'
const child = spawn('node', ['server.mjs'], {
  cwd: __dirname,
  stdio: 'inherit',
  detached: !isWindows,
  env: { ...process.env, PORT: process.env.PORT || '4173', NODE_ENV: process.env.NODE_ENV || 'development' },
})

if (!isWindows) child.unref()

const shutdown = (signal) => {
  try { child.kill(signal) } catch {}
  process.exit()
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
child.on('close', (code) => process.exit(code ?? 0))
