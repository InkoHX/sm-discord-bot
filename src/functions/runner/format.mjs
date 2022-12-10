import { AttachmentBuilder, bold, codeBlock } from 'discord.js'

import { calcUploadSizeLimit, escapeBackQuote } from '../../util/message.mjs'

/**
 * @param {{ stdout: string | null; stderr: string | null; }} param0
 * @param {number} tier
 * @returns {import('discord.js').MessageOptions}
 */
export const generateSMResultReport = ({ stdout, stderr }, tier = 0) => {
  const report = [
    bold('出力'),
    codeBlock('js', stdout ? escapeBackQuote(stdout) : '出力無し'),
    bold('エラー出力'),
    codeBlock('js', stderr ? escapeBackQuote(stderr) : '出力無し'),
  ].join('\n')

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
