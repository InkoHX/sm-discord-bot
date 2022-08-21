/**
 * 添付ファイルとして送信する内容がDiscordのアップロード制限を超えてないか計算する関数
 * 第二引数に適切な整数を与えることで、サーバーブーストによるアップロード制限の緩和を考慮して計算することができます
 * @param {string | NodeJS.ArrayBufferView | ArrayBuffer | SharedArrayBuffer} content 添付ファイルとして送信するもの
 * @param {number} tier 0から3までの正の整数
 * @returns {boolean} 上限を超えていればtrue、超えていなければfalse
 */
export const calcUploadSizeLimit = (content, tier = 0) => {
  const bufSize = Buffer.byteLength(content, 'utf8')

  switch (tier) {
    case 0:
    case 1:
      return bufSize >= 8 * 1024 ** 2 // 8MB
    case 2:
      return bufSize >= 50 * 1024 ** 2 // 50MB
    case 3:
      return bufSize >= 100 * 1024 ** 2 // 100MB
    default:
      throw new Error('The tier must be a positive integer between 0 and 3.')
  }
}

/**
 * コードブロック内に含まれるバッククォートをエスケープするための関数
 * @param {string} str コードブロックに含む文字列
 * @returns エスケープされた文字列
 */
export const escapeBackQuote = str => str.replaceAll('`', '`\u200b')
