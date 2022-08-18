# Application Commands

## Basic

```js
export const data = new SlashCommandBuilder()
  .setName('foo')
  .setDescription('bar')
  .toJSON()

export const execute = async interaction => {
  /**
   * Middleware
   *
   */

  return async (
    {
      /** options */
    }
  ) => {
    await interaction.reply('hoge')
  }
}
```

## with Subcommands

```js
export const data = new SlashCommandBuilder()
  .setName('foo')
  .setDescription('bar')
  .addSubcommand(it => it.setName('bar').setDescription('hoge'))
  .toJSON()

export const execute = async interaction => {
  /**
   * Middleware
   *
   */

  return {
    bar: async (
      {
        /** options */
      }
    ) => {
      /** your code */
    },
  }
}
```

## SubcommandGroup & Subcommand

```js
export const data = new SlashCommandBuilder()
  .setName('foo')
  .setDescription('bar')
  .addSubcommand(it => it.setName('bar').setDescription('hoge'))
  .addSubcommandGroup(it =>
    it
      .setName('test')
      .setDescription('A')
      .addSubcommand(it =>
        it.setName('fuga').setDescription('this is description')
      )
  )
  .toJSON()

export const execute = async interaction => {
  /**
   * Middleware
   *
   */

  return {
    bar: async (
      {
        /** options */
      }
    ) => {
      /** your code */
    },
    test: {
      fuga: async (
        {
          /** options */
        }
      ) => {
        /** code */
      },
    },
  }
}
```
