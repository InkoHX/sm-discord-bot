import { client } from '../index.mjs'
import {
  putGlobalCommandAll,
  putGuildCommandAll,
} from '../interaction/index.mjs'

client.on('ready', client => {
  const guildId = process.env.DISCORD_GUILD_ID

  if (guildId) putGuildCommandAll(client.application.id, guildId)
  else putGlobalCommandAll(client.application.id)

  console.log(`Logged in ${client.user.tag}`)
})
