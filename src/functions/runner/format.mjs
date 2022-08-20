import { AttachmentBuilder, bold, codeBlock } from 'discord.js'

import { calcUploadSizeLimit } from '../../util/message.mjs'

/**
 * @param {{ stdout: string | null; stderr: string | null; }} param0
 * @param {number} tier
 * @returns {import('discord.js').MessageOptions}
 */
export const generateSMResultReport = ({ stdout, stderr }, tier = 0) => {
  const report = [
    bold('標準出力'),
    codeBlock('js', stdout?.replaceAll('`', '`\u200b') ?? '出力無し'),
    '',
    bold('エラー出力'),
    codeBlock('js', stderr?.replaceAll('`', '`\u200b') ?? '出力無し'),
  ].join('\n')

  if (report.length <= 2000) return { content: report }

  const files = []

  if (stdout)
    files.push(
      new AttachmentBuilder(
        calcUploadSizeLimit(stdout, tier)
          ? 'アップロードできる最大容量を超えました。'
          : Buffer.from(stdout)
      )
        .setName('stdout.txt')
        .setDescription('標準出力')
    )
  if (stderr)
    files.push(
      new AttachmentBuilder(
        calcUploadSizeLimit(stderr, tier)
          ? 'アップロードできる最大容量を超えました。'
          : Buffer.from(stderr)
      )
        .setName('stderr.txt')
        .setDescription('標準エラー出力')
    )

  return {
    content: '出力結果が長いため、テキストファイルとして送信します。',
    files,
  }
}
