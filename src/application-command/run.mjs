import {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
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
  .addBooleanOption(it =>
    it.setName('ephemeral').setDescription('実行結果を隠すか')
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

  return async ({ channel, ephemeral = false }) => {
    const modal = new ModalBuilder()
      .setCustomId(`code-input-${interaction.id}`)
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

    await interaction.showModal(modal)

    let modalInteraction

    try {
      modalInteraction = await interaction.awaitModalSubmit({
        time: 60 * 60 * 1000,
        filter: interaction => interaction.customId === modal.data.custom_id,
      })

      await modalInteraction.deferReply({ ephemeral })

      const code = modalInteraction.fields.getTextInputValue('code')
      const button = new ButtonBuilder()
        .setLabel(
          ephemeral ? 'ソースコードを表示する' : 'ソースコードを公開する'
        )
        .setCustomId(`show-source-code-${interaction.id}`)
        .setStyle(ButtonStyle.Primary)
      const resultMessage = await modalInteraction.followUp({
        ...generateSMResultReport(
          await executeInSM(code, channel),
          interaction.guild?.premiumTier
        ),
        components: [new ActionRowBuilder().setComponents(button)],
      })

      const showSourceCodeButton = await resultMessage
        .awaitMessageComponent({
          time: 60000,
          componentType: ComponentType.Button,
          filter: it => it.user.id === interaction.user.id && it.customId === button.data.custom_id,
        })
        .catch(async e => {
          if (e.code === DiscordjsErrorCodes.InteractionCollectorError) throw e
          await resultMessage.edit({ components: [] })
          return null
        })

      if (!showSourceCodeButton) return

      await showSourceCodeButton.reply({
        content: codeBlock('js', escapeBackQuote(code)),
        ephemeral,
      })
    } catch (error) {
      if (error instanceof SMTimeoutError) {
        await modalInteraction.followUp(
          generateSMResultReport([
            { fd: 'stderr', content: 'SM worker timed-out' },
          ])
        )

        return
      }

      throw error
    }
  }
}
