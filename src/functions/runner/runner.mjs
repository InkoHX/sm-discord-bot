import { once } from 'node:events'
import { Worker } from 'node:worker_threads'
import { setTimeout } from 'timers/promises'

import { releaseChannels } from '../../runtime.mjs'

/**
 * SpiderMonkeyを実行しているWorkerをタイムアウトで強制終了したときに発生するエラー
 */
export class SMTimeoutError extends Error {
  constructor() {
    super('Worker timed out.')

    this.name = 'SMTimeoutError'
  }
}

/**
 * @param {string} code SpiderMonkeyで実行するJavaScript
 * @param {string} channel SpiderMonkeyのリリースチャンネル
 * @returns {Promise<{ fd: "stdout" | "stderr"; content: string }[]>} コードの実行結果を返します。
 */
export const executeInSM = async (code, channel = releaseChannels.stable) => {
  const worker = new Worker(new URL(`./worker/index.mjs`, import.meta.url), {
    workerData: { code, channel },
  })

  await once(worker, 'online')

  /**
   * 隣り合う2つの要素は，`fd`の値が異なるか，前の値が改行で終わっています．
   * @type {{ fd: 'stdout' | 'stderr'; content: string }[]}
   */
  const out = []

  /**
   * 改行されるか，`fd`の値が変わるまでの出力をバッファリングします。
   * @type {{ fd: 'stdout' | 'stderr'; buffers: Uint8Array[] } | undefined}
   */
  let current
  worker.on('message', message => {
    if (current?.fd === message.fd) {
      current.buffers.push(message.buffer)
    } else {
      if (current) out.push({
        fd: current.fd,
        content: Buffer.concat(current.buffers).toString()
      })
      current = {
        fd: message.fd,
        buffers: [message.buffer]
      }
    }
    if (current && Buffer.concat(current.buffers).toString().endsWith('\n')) {
      out.push({
        fd: current.fd,
        content: Buffer.concat(current.buffers).toString()
      })
      current = undefined
    }
  })

  worker.on('error', console.error)

  const exit = await Promise.race([
    once(worker, 'exit'),
    setTimeout(10000).then(() => null),
  ])

  if (!exit) {
    worker.terminate()
    throw new SMTimeoutError()
  }

  return out
}
