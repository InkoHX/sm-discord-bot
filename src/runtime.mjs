import { createWriteStream } from 'node:fs'
import { WritableStream } from 'node:stream/web'

export const releaseChannels = {
  stable: 'mozilla-release',
  beta: 'mozilla-beta',
  nightly: 'mozilla-central',
}

export const getRuntimePath = channel =>
  new URL(`./functions/runner/worker/runtime/${channel}.wasm`, import.meta.url)

export const downloadRuntime = async channel => {
  const path = getRuntimePath(channel)
  const file = createWriteStream(path)

  const response = await fetch(
    'https://mozilla-spidermonkey.github.io/sm-wasi-demo/data.json'
  )
    .then(response => response.json())
    .then(data => data.find(it => it.branch === channel).url)
    .then(url => fetch(url))

  await response.body.pipeTo(
    new WritableStream({ write: chunk => file.write(chunk) })
  )
}
