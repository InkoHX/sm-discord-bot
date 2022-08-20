import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  bold,
  DiscordjsError,
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

/**
 * @param {import('discord.js').Message} message
 * @param {string} code
 */
const run = async (message, code) => {
  const reply = await message.reply({
    content: 'リリースチャンネルを選択してください',
    components: [
      new ActionRowBuilder().setComponents(
        new ButtonBuilder()
          .setCustomId('stable')
          .setLabel('安定版')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('beta')
          .setLabel('ベータ版')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('nightly')
          .setLabel('最新版')
          .setStyle(ButtonStyle.Danger)
      ),
    ],
  })

  try {
    const interaction = await reply.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 30000,
      filter: interaction => interaction.user.id === message.author.id,
    })

    await interaction.deferReply()

    const result = await executeInSM(
      code,
      releaseChannels[interaction.customId]
    )

    const resultMessage = await interaction.followUp({
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

    await reply.delete()
    const deleteButtonInteraction = await resultMessage.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 60000,
      filter: interaction => interaction.user.id === message.author.id,
    })

    await resultMessage.delete()
    await deleteButtonInteraction.reply({
      content: '実行結果を削除しました。',
      ephemeral: true,
    })
  } catch (error) {
    if (error instanceof SMTimeoutError) {
      await message.reply(
        generateSMResultReport(
          {
            stdout: null,
            stderr: 'SM worker timed-out',
          },
          message.guild.premiumTier
        )
      )
    }

    if (
      error instanceof DiscordjsError &&
      error.code === DiscordjsErrorCodes.InteractionCollectorError
    )
      return

    throw error
  }
}

client.on('messageCreate', message => {
  if (message.system || message.author.bot) return
  if (!message.content.toLowerCase().startsWith('>run')) return
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

  run(message, code).catch(console.error)
})