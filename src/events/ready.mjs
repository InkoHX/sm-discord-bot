import { on } from 'node:events'

import { client as emitter } from '../index.mjs'
import {
  putGlobalCommandAll,
  putGuildCommandAll,
} from '../interaction/index.mjs'

// NOTE: https://github.com/import-js/eslint-plugin-import/issues/1759
// eslint-disable-next-line import/newline-after-import
;(async () => {
  for await (const [client] of on(emitter, 'ready')) {
    const guildId = process.env.DISCORD_GUILD_ID

    if (guildId) await putGuildCommandAll(client.application.id, guildId)
    else await putGlobalCommandAll(client.application.id)

    console.log(`Logged in ${client.user.tag}`)
  }
})().catch(console.error)
