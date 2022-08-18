import fs from 'node:fs/promises'

import dayjs from 'dayjs'
import { SlashCommandBuilder, time } from 'discord.js'

import {
  downloadRuntime,
  getRuntimePath,
  releaseChannels,
} from '../runtime.mjs'

export const data = new SlashCommandBuilder()
  .setName('runtime')
  .setDescription('SpiderMonkeyに関するコマンド')
  .addSubcommand(it =>
    it
      .setName('update')
      .setDescription('SpiderMonkeyのアップデートを行います。')
      .addStringOption(it =>
        it
          .setChoices(
            ...Object.entries(releaseChannels).map(([name, value]) => ({
              name,
              value,
            }))
          )
          .setRequired(true)
          .setName('channel')
          .setDescription('リリースチャンネル')
      )
  )
  .addSubcommand(it =>
    it
      .setName('check')
      .setDescription('SpiderMonkeyをダウンロードした日がいつなのかを調べる')
      .addStringOption(it =>
        it
          .setChoices(
            ...Object.entries(releaseChannels).map(([name, value]) => ({
              name,
              value,
            }))
          )
          .setName('channel')
          .setRequired(true)
          .setDescription('リリースチャンネル')
      )
  )
  .toJSON()

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export const execute = async interaction => {
  /**
   * Middleware
   */

  return {
    update: async ({ channel }) => {
      await interaction.deferReply()

      const stat = await fs.stat(getRuntimePath(channel))
      const diff = dayjs().diff(stat.mtime, 'hour')

      if (diff <= 4) throw '5時間以上経過してからアップデートしてください'

      await downloadRuntime(channel)
      await interaction.followUp('更新が完了しました。')
    },
    check: async ({ channel }) => {
      const stat = await fs.stat(getRuntimePath(channel))

      interaction.reply(`最終更新日: ${time(stat.mtime, 'R')}`)
    },
  }
}
