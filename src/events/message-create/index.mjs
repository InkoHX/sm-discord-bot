import { Worker } from 'node:worker_threads'

import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  bold,
  codeBlock,
} from 'discord.js'

import { client } from '../../index.mjs'
import { releaseChannels } from '../../runtime.mjs'
import { calcUploadSizeLimit } from '../../util/message.mjs'

const codeBlockRegExp = /^`{3}(?<language>[a-z]+)\n(?<code>[\s\S]+)\n`{3}$/mu
const supportLanguages = ['js', 'javascript']

/**
 * @param {import('discord.js').Message} message
 * @param {import('discord.js').ReplyMessageOptions} options
 */
const sendMessage = async (message, options) => {
  const reply = await message.reply({
    ...options,
    components: [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('delete')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('🗑️')
          .setLabel('実行結果を削除')
      ),
    ],
  })

  /** @type {import('discord.js').ButtonInteraction | null} */
  const interaction = await reply
    .awaitMessageComponent({
      componentType: ComponentType.Button,
      filter: interaction => interaction.user.id === message.author.id,
      time: 60000,
    })
    .catch(() => null)

  if (!interaction) return

  await reply.delete()
  await interaction.reply({
    content: '実行結果を削除しました。',
    ephemeral: true,
  })
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
  const firstLine = message.content.split('\n')[0]
  const releaseChannel = firstLine.includes('beta')
    ? releaseChannels.beta
    : firstLine.includes('nightly')
    ? releaseChannels.nightly
    : releaseChannels.stable

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

  let timerId
  const worker = new Worker(new URL('./worker.mjs', import.meta.url), {
    workerData: { code, channel: releaseChannel },
  })

  worker
    .on('message', ({ stdout, stderr }) => {
      clearTimeout(timerId)

      const content = [
        bold('Stdout'),
        codeBlock('js', stdout || 'No outputs'),
        bold('Stderr'),
        codeBlock('js', stderr || 'No errors'),
      ].join('\n')

      if (content.length <= 2000) {
        sendMessage(message, {
          content,
        }).catch(console.error)
      } else {
        const files = []

        if (stdout)
          files.push(
            new AttachmentBuilder(
              calcUploadSizeLimit(stdout, message.guild.premiumTier)
                ? Buffer.from('上限を超えているためアップロードできません')
                : Buffer.from(stdout || 'No outputs')
            )
              .setName('stdout.txt')
              .setDescription('標準出力')
          )
        if (stderr)
          files.push(
            new AttachmentBuilder(
              calcUploadSizeLimit(stderr, message.guild.premiumTier)
                ? Buffer.from('上限を超えているためアップロードできません')
                : Buffer.from(stderr || 'No errors')
            )
              .setName('stderr.txt')
              .setDescription('標準エラー出力')
          )

        sendMessage(message, {
          content: '出力結果が長いため、テキストファイルとして添付しました。',
          files,
        }).catch(console.error)
      }
    })
    .on('online', () => {
      timerId = setTimeout(() => {
        worker
          .terminate()
          .then(() => sendMessage(message, { content: codeBlock('Timeout') }))
          .catch(console.error)
      }, 5000)
    })
})
