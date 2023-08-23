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
 * @returns {Promise<{ stdout: string | null; stderr: string | null }>} コードの実行結果を返します。`null`を返せばタイムアウト
 */
export const executeInSM = async (code, channel = releaseChannels.stable) => {
  const worker = new Worker(new URL(`./worker/index.mjs`, import.meta.url), {
    workerData: { code, channel },
  })

  await once(worker, 'online')

  const result = await Promise.race([
    once(worker, 'message').then(([it]) => it),
    setTimeout(10000)
      .then(() => worker.terminate())
      .then(() => null),
  ])

  if (!result) throw new SMTimeoutError()

  return result
}
