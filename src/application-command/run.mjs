import {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
  DiscordjsError,
  DiscordjsErrorCodes,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  codeBlock,
} from 'discord.js'

import {
  executeInSM,
  generateSMResultReport,
  SMTimeoutError,
} from '../functions/index.mjs'
import { releaseChannels } from '../runtime.mjs'
import { escapeBackQuote } from '../util/message.mjs'

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
      const resultMessage = await receiveModalInteraction.followUp({
        ...generateSMResultReport(result, interaction.guild?.premiumTier),
        components: [
          new ActionRowBuilder().setComponents(
            new ButtonBuilder()
              .setLabel('ソースコードを公開する')
              .setCustomId('source-code')
              .setStyle(ButtonStyle.Primary)
          ),
        ],
      })

      const sourceCodeButton = await resultMessage.awaitMessageComponent({
        time: 60000,
        componentType: ComponentType.Button,
        filter: it => it.user.id === interaction.user.id,
      })

      await sourceCodeButton.reply(codeBlock('js', escapeBackQuote(code)))
    } catch (error) {
      if (error instanceof SMTimeoutError) {
        await receiveModalInteraction.followUp(
          generateSMResultReport({
            stdout: null,
            stderr: 'SM worker timed-out',
          })
        )

        return
      }

      if (
        error instanceof DiscordjsError &&
        error.code === DiscordjsErrorCodes.InteractionCollectorError
      )
        return

      throw error
    }
  }
}
