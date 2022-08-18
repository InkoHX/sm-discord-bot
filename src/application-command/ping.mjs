import { SlashCommandBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('ボットが応答しているかを確認するためのコマンド')
  .toJSON()

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export const execute = async interaction => {
  /**
   * Middleware
   */

  return async () => {
    await interaction.reply(`Pong! ${interaction.client.ws.ping}ms`)
  }
}
