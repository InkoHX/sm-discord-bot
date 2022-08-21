import fs from 'node:fs/promises'
import { parentPort, workerData } from 'node:worker_threads'

import { WASI, init } from '@wasmer/wasi'

await init()

const { channel, code } = workerData
const runtimeModule = await WebAssembly.compile(
  await fs.readFile(new URL(`./runtime/${channel}.wasm`, import.meta.url))
)
const wasi = new WASI({
  args: [
    '-f',
    '/input.js',
    '--selfhosted-xdr-path=/selfhosted.bin',
    '--selfhosted-xdr-mode=encode',
  ],
  env: {},
})

await wasi.instantiate(runtimeModule, {})

for (const file of await fs.readdir(new URL('./polyfill', import.meta.url))) {
  const sourceCode = await fs.readFile(
    new URL(`./polyfill/${file}`, import.meta.url),
    'utf8'
  )
  const virtualFile = wasi.fs.open(`/${file}`, { write: true, create: true })

  virtualFile.writeString(sourceCode)
  virtualFile.seek(0)
}

const inputFile = wasi.fs.open('/input.js', { write: true, create: true })
inputFile.writeString(code)
inputFile.seek(0)

try {
  wasi.start()
} catch (error) {
  /** コードに誤りがあったときに関係のないエラーを吐くため無視 */
}

parentPort.postMessage({
  stdout: wasi.getStdoutString() || null,
  stderr: wasi.getStderrString() || null,
})
