import fs from 'node:fs/promises'
import { parentPort, workerData } from 'node:worker_threads'

import {
  WASI,
  File,
  OpenFile,
  PreopenDirectory,
  Fd,
  // eslint-disable-next-line import/no-unresolved
} from '@bjorn3/browser_wasi_shim'

class PortStdio extends Fd {
  /**
   * @param {'stdout' | 'stderr'} fd
   */
  constructor(fd) {
    super()
    /**
     * @type {'stdout' | 'stderr'}
     */
    this.fd = fd
  }

  /**
   * @param {Uint8Array} view8
   * @param {{ buf: number; buf_len: number }[]} iovs
   * @returns {{ ret: number; nwritten: number }}
   */
  fd_write(view8, iovs) {
    let nwritten = 0
    for (const iovec of iovs) {
      const buffer = view8.slice(iovec.buf, iovec.buf + iovec.buf_len)
      if (buffer.length) parentPort.postMessage({ fd: this.fd, buffer })
      nwritten += buffer.length
    }
    return { ret: 0, nwritten }
  }
}

const { channel, code } = workerData

const args = [
  '-f',
  '/start.js',
  '--selfhosted-xdr-path=/selfhosted.bin',
  '--selfhosted-xdr-mode=encode',
]
const env = []
const fds = [
  new OpenFile(new File([])),
  new PortStdio('stdout'),
  new PortStdio('stderr'),
]
const wasi = new WASI(args, env, fds)

async function prepareDir() {
  /** {@type { [key: string]: File }} */
  const contents = {
    'input.js': new File(new TextEncoder().encode(code)),
  }

  const files = await fs.readdir(new URL('./polyfill', import.meta.url))
  await Promise.all(
    files.map(async file => {
      const code = await fs.readFile(
        new URL(`./polyfill/${file}`, import.meta.url)
      )
      contents[file] = new File(code)
    })
  )
  return new PreopenDirectory('/', contents)
}

async function compile() {
  const bin = await fs.readFile(
    new URL(`./runtime/${channel}.wasm`, import.meta.url)
  )
  return await WebAssembly.compile(bin)
}

const [dir, wasm] = await Promise.all([prepareDir(), compile()])
wasi.fds.push(dir)

const inst = await WebAssembly.instantiate(wasm, {
  wasi_snapshot_preview1: wasi.wasiImport,
})

try {
  wasi.start(inst)
} catch (error) {
  /** コードに誤りがあったときに関係のないエラーを吐くため無視 */
}

