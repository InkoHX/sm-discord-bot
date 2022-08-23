import { on } from 'node:events'

import { ApplicationCommandOptionType } from 'discord.js'

import * as ApplicationCommands from '../application-command/index.mjs'
import { client } from '../index.mjs'

function* resolveOptions(interaction, options) {
  for (const { type, name, required = false } of options) {
    switch (type) {
      case ApplicationCommandOptionType.String:
        yield [name, interaction.options.getString(name, required)]
        break
      case ApplicationCommandOptionType.Boolean:
        yield [name, interaction.options.getBoolean(name, required)]
        break
      case ApplicationCommandOptionType.Attachment:
        yield [name, interaction.options.getAttachment(name, required)]
        break
      case ApplicationCommandOptionType.Channel:
        yield [name, interaction.options.getChannel(name, required)]
        break
      case ApplicationCommandOptionType.Integer:
        yield [name, interaction.options.getInteger(name, required)]
        break
      case ApplicationCommandOptionType.Mentionable:
        yield [name, interaction.options.getMentionable(name, required)]
        break
      case ApplicationCommandOptionType.Number:
        yield [name, interaction.options.getNumber(name, required)]
        break
      case ApplicationCommandOptionType.Role:
        yield [name, interaction.options.getRole(name, required)]
        break
      case ApplicationCommandOptionType.User:
        yield [name, interaction.options.getUser(name, required)]
        break
      default:
        throw new TypeError('Invalid ApplicationCommandOptionType')
    }
  }
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
const handleChatInputCommandInteraction = async interaction => {
  const { execute, data } =
    Object.values(ApplicationCommands).find(
      ({ data }) => data.name === interaction.commandName
    ) ?? {}
  if (!(data || execute)) return

  try {
    const handler = await execute(interaction)
    const subcommandName = interaction.options.getSubcommand(false)
    const subcommandGroupName = interaction.options.getSubcommandGroup(false)

    if (subcommandGroupName) {
      throw new Error('not impl ApplicationCommandHandler (SubcommandGroup)')
    } else if (subcommandName) {
      const options =
        data.options.find(it => it.name === subcommandName).options ?? []

      await handler[subcommandName](
        Object.fromEntries([...resolveOptions(interaction, options)])
      )
    } else {
      const options = data.options ?? []

      await handler(
        Object.fromEntries([...resolveOptions(interaction, options)])
      )
    }
  } catch (error) {
    if (typeof error === 'string') {
      await interaction[interaction.deferred ? 'followUp' : 'reply']({
        content: error,
        ephemeral: true,
      })

      return
    } else if (error instanceof Error) {
      console.error(error)
      await interaction[interaction.deferred ? 'followUp' : 'reply']({
        content: 'コマンドの実行中にエラーが発生しました。',
        ephemeral: true,
      })

      return
    }

    throw error
  }
}

;(async () => {
  for await (const [interaction] of on(client, 'interactionCreate')) {
    if (interaction.isChatInputCommand())
      handleChatInputCommandInteraction(interaction).catch(console.error)
  }
})().catch(console.error)
