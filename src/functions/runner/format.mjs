import colors from 'colors'
import { AttachmentBuilder, codeBlock } from 'discord.js'

import { calcUploadSizeLimit, escapeBackQuote } from '../../util/message.mjs'

/**
 * @param {{ stdout: string | null; stderr: string | null; }} param0
 * @param {number} tier
 * @returns {import('discord.js').MessageOptions}
 */
export const generateSMResultReport = ({ stdout, stderr }, tier = 0) => {
  /** @type {string[]} */
  const out = []
  if (stdout) out.push(stdout.replace(/(^\n+|\n+$)/, ''))
  if (stderr) out.push(colors.red(stderr.replace(/(^\n+|\n+$)/, '')))

  const report = out.length
    ? codeBlock('ansi', escapeBackQuote(out.join('\n')))
    : '出力無し'
  if (report.length <= 2000)
    return { content: report, allowedMentions: { repliedUser: true } }

  const files = []

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
