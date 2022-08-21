import fs from 'node:fs/promises'
import { inspect } from 'node:util'
import { parentPort, workerData } from 'node:worker_threads'

import { WASI, init } from '@wasmer/wasi'

await init()

const { channel, code } = workerData
const preload = await fs.readFile(
  new URL('./preload.js', import.meta.url),
  'utf8'
)
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

const inputFile = wasi.fs.open('/input.js', { write: true, create: true })
inputFile.writeString(preload + code)
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
