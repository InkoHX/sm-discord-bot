import colors from 'colors'
import { AttachmentBuilder, codeBlock } from 'discord.js'

import { calcUploadSizeLimit, escapeBackQuote } from '../../util/message.mjs'

/**
 * @param {{ fd: "stdout" | "stderr"; content: string }[]} out
 * @param {number} tier
 * @returns {import('discord.js').MessageOptions}
 */
export const generateSMResultReport = (out, tier = 0) => {
  const ansi = out
    .map(({ fd, content }) => {
      if (fd === 'stdout') return content
      else if (content.endsWith('\n'))
        return colors.red(content.slice(0, -1)) + '\n'
      else return colors.red(content)
    })
    .join('')

  const report = ansi ? codeBlock('ansi', escapeBackQuote(ansi)) : '出力無し'
  if (report.length <= 2000)
    return { content: report, allowedMentions: { repliedUser: true } }

  const files = []

  const stdout = out
    .filter(({ fd }) => fd === 'stdout')
    .map(({ content }) => content)
    .join('')
  if (stdout)
    files.push(
      new AttachmentBuilder(
        Buffer.from(
          calcUploadSizeLimit(stdout, tier)
            ? 'アップロードできる最大容量を超えました。'
            : stdout
        )
      )
        .setName('stdout.txt')
        .setDescription('標準出力')
    )
  const stderr = out
    .filter(({ fd }) => fd === 'stderr')
    .map(({ content }) => content)
    .join('')
  if (stderr)
    files.push(
      new AttachmentBuilder(
        Buffer.from(
          calcUploadSizeLimit(stderr, tier)
            ? 'アップロードできる最大容量を超えました。'
            : stderr
        )
      )
        .setName('stderr.txt')
        .setDescription('標準エラー出力')
    )

  return {
    content: '出力結果が長いため、テキストファイルとして送信します。',
    files,
  }
}
