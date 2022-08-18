import { ActivityType, Client, IntentsBitField, REST } from 'discord.js'

import { downloadRuntime, releaseChannels } from './runtime.mjs'

const token = process.env.DISCORD_TOKEN

if (!token)
  throw new Error('The environment variable "DISCORD_TOKEN" is not set.')

export const rest = new REST({ version: '10' }).setToken(token)
export const client = new Client({
  intents:
    IntentsBitField.Flags.Guilds |
    IntentsBitField.Flags.GuildMessages |
    IntentsBitField.Flags.MessageContent,
  presence: {
    activities: [{ type: ActivityType.Streaming, name: 'SpiderMonkey shell' }],
  },
})

// Download SpiderMonkey runtime
await Promise.all(Object.values(releaseChannels).map(it => downloadRuntime(it)))

// Register event handlers
import('./events/index.mjs')
  .then(() => client.login())
  .catch(console.error)
