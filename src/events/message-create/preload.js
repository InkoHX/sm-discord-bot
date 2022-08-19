/* global print printErr */

/**
 * <=====================================> WARNING <=====================================>
 *
 * ここにあるコードはNode.jsでは実行されず、WASI上に構築されたSpiderMonkeyで実行されるコードになります。
 * 動作する環境、実装されている機能が全く異なる場所で実行されることに注意してください
 *
 * <=====================================================================================>
 */

// prettier-ignore
(globalThis => {
  'use strict'

  // Console
  Object.defineProperty(globalThis, 'console', {
    value: {
      log(...args) {
        print(...args)
      },
      error(...args) {
        printErr(...args)
      },
    },
  })
})(globalThis);
