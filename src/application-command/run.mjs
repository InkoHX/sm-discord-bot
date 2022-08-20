import {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
  DiscordjsError,
  DiscordjsErrorCodes,
} from 'discord.js'

import {
  executeInSM,
  generateSMResultReport,
  SMTimeoutError,
} from '../functions/index.mjs'
import { releaseChannels } from '../runtime.mjs'

const modal = new ModalBuilder()
  .setCustomId('code-input')
  .setTitle('Run your code')
  .setComponents(
    new ActionRowBuilder().setComponents(
      new TextInputBuilder()
        .setCustomId('code')
        .setLabel('コード')
        .setPlaceholder('実行するJavaScript')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired()
    )
  )

export const data = new SlashCommandBuilder()
  .setName('run')
  .setDescription('JavaScriptをSpiderMonkeyに実行させます。')
  .addStringOption(it =>
    it
      .setName('channel')
      .setDescription('リリースチャンネル')
      .setRequired(true)
      .setChoices(
        ...Object.entries(releaseChannels).map(([name, value]) => ({
          name,
          value,
        }))
      )
  )

/**
 *
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 * @returns
 */
export const execute = async interaction => {
  /**
   * Middleware
   */

  return async ({ channel }) => {
    await interaction.showModal(modal)

    const receiveModalInteraction = await interaction.awaitModalSubmit({
      time: 60 * 60 * 1000,
      filter: interaction => interaction.customId === modal.data.custom_id,
    })

    await receiveModalInteraction.deferReply()

    try {
      const code = receiveModalInteraction.fields.getTextInputValue('code')
      const result = await executeInSM(code, channel)

      await receiveModalInteraction.followUp(
        generateSMResultReport(result, interaction.guild?.premiumTier)
      )
    } catch (error) {
      if (error instanceof SMTimeoutError)
        receiveModalInteraction.followUp(
          generateSMResultReport({
            stdout: null,
            stderr: 'SM worker timed-out',
          })
        )

      if (
        error instanceof DiscordjsError &&
        error.code === DiscordjsErrorCodes.InteractionCollectorError
      )
        return

      throw error
    }
  }
}
