import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  bold,
  DiscordjsErrorCodes,
} from 'discord.js'

import {
  executeInSM,
  generateSMResultReport,
  SMTimeoutError,
} from '../functions/index.mjs'
import { client } from '../index.mjs'
import { releaseChannels } from '../runtime.mjs'

const codeBlockRegExp = /^`{3}(?<language>[a-z]+)\n(?<code>[\s\S]+)\n`{3}$/mu
const supportLanguages = ['js', 'javascript']

const channelRegExp = /^>run(?<channel>:stable|:beta|:nightly)?/mu

/**
 * @param {import('discord.js').Message} message
 * @param {string} code
 * @param {string | undefined} channel
 */
const run = async (message, code, channel) => {
  let result

  try {
    result = await executeInSM(code, releaseChannels[channel ?? 'stable'])
  } catch (error) {
    if (!(error instanceof SMTimeoutError)) throw error

    result = {
      stdout: null,
      stderr: 'SM worker timed-out',
    }
  }

  const resultMessage = await message.reply({
    ...generateSMResultReport(result),
    components: [
      new ActionRowBuilder().setComponents(
        new ButtonBuilder()
          .setLabel('実行結果を削除')
          .setCustomId('delete-result')
          .setStyle(ButtonStyle.Danger)
      ),
    ],
  })

  const deleteButtonInteraction = await resultMessage
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 60000,
      filter: interaction => interaction.user.id === message.author.id,
    })
    .catch(async e => {
      if (e.code !== DiscordjsErrorCodes.InteractionCollectorError) throw e
      await resultMessage.edit({ components: [] })
      return null
    })

  if (!deleteButtonInteraction) return

  await resultMessage.delete()
  await deleteButtonInteraction.reply({
    content: '実行結果を削除しました。',
    ephemeral: true,
  })
}

client.on('messageCreate', message => {
  if (message.system || message.author.bot) return
  if (!channelRegExp.test(message.content)) return
  if (!codeBlockRegExp.test(message.content)) {
    message
      .reply('実行するコードはコードブロックとして送信してください。')
      .catch(console.error)

    return
  }

  const { code, language } = message.content.match(codeBlockRegExp).groups ?? {}
  if (!supportLanguages.includes(language)) {
    message
      .reply(
        `コードブロックの言語識別子は${supportLanguages
          .map(it => bold(it))
          .join('または')}である必要があります。`
      )
      .catch(console.error)

    return
  }
  const { channel } = message.content.match(channelRegExp).groups ?? {}

  run(message, code, channel?.slice(1)).catch(console.error)
})
