import { Routes } from 'discord.js'

import * as ApplicationCommands from '../application-command/index.mjs'
import { rest } from '../index.mjs'

const data = Object.values(ApplicationCommands).map(({ data }) => data)

/**
 * @param {string} applicationId
 * @param {string} guildId
 */
export const putGuildCommandAll = async (applicationId, guildId) => {
  try {
    await rest.put(Routes.applicationGuildCommands(applicationId, guildId), {
      body: data,
    })

    console.log(`[REST] Overwrite all application commands to ${guildId}.`)
  } catch (error) {
    console.error(error)
  }
}

/**
 * @param {string} applicationId
 */
export const putGlobalCommandAll = async applicationId => {
  try {
    await rest.put(Routes.applicationCommands(applicationId), { body: data })

    console.log('[REST] Overwrite all global application commands.')
  } catch (error) {
    console.error(error)
  }
}
