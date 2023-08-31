'use strict'

const primordials = (() => {
  const primordials = { __proto__: null }
  const {
    defineProperty: ReflectDefineProperty,
    getOwnPropertyDescriptor: ReflectGetOwnPropertyDescriptor,
    ownKeys: ReflectOwnKeys,
  } = Reflect
  const { apply, bind, call } = Function.prototype
  const uncurryThis = bind.bind(call)
  primordials.uncurryThis = uncurryThis
  const applyBind = bind.bind(apply)
  primordials.applyBind = applyBind
  const varargsMethods = [
    'ArrayOf',
    'ArrayPrototypePush',
    'ArrayPrototypeUnshift',
    'MathHypot',
    'MathMax',
    'MathMin',
    'StringFromCharCode',
    'StringFromCodePoint',
    'StringPrototypeConcat',
    'TypedArrayOf',
  ]
  function getNewKey(key) {
    return typeof key === 'symbol'
      ? `Symbol${key.description[7].toUpperCase()}${key.description.slice(8)}`
      : `${key[0].toUpperCase()}${key.slice(1)}`
  }
  function copyAccessor(dest, prefix, key, { enumerable, get, set }) {
    ReflectDefineProperty(dest, `${prefix}Get${key}`, {
      __proto__: null,
      value: uncurryThis(get),
      enumerable,
    })
    if (set !== undefined) {
      ReflectDefineProperty(dest, `${prefix}Set${key}`, {
        __proto__: null,
        value: uncurryThis(set),
        enumerable,
      })
    }
  }
  function copyPropsRenamed(src, dest, prefix) {
    for (const key of ReflectOwnKeys(src)) {
      const newKey = getNewKey(key)
      const desc = ReflectGetOwnPropertyDescriptor(src, key)
      if ('get' in desc) {
        copyAccessor(dest, prefix, newKey, desc)
      } else {
        const name = `${prefix}${newKey}`
        ReflectDefineProperty(dest, name, { __proto__: null, ...desc })
        if (varargsMethods.includes(name)) {
          ReflectDefineProperty(dest, `${name}Apply`, {
            __proto__: null,
            value: applyBind(desc.value, src),
          })
        }
      }
    }
  }
  function copyPropsRenamedBound(src, dest, prefix) {
    for (const key of ReflectOwnKeys(src)) {
      const newKey = getNewKey(key)
      const desc = ReflectGetOwnPropertyDescriptor(src, key)
      if ('get' in desc) {
        copyAccessor(dest, prefix, newKey, desc)
      } else {
        const { value } = desc
        if (typeof value === 'function') {
          desc.value = value.bind(src)
        }
        const name = `${prefix}${newKey}`
        ReflectDefineProperty(dest, name, { __proto__: null, ...desc })
        if (varargsMethods.includes(name)) {
          ReflectDefineProperty(dest, `${name}Apply`, {
            __proto__: null,
            value: applyBind(value, src),
          })
        }
      }
    }
  }
  function copyPrototype(src, dest, prefix) {
    for (const key of ReflectOwnKeys(src)) {
      const newKey = getNewKey(key)
      const desc = ReflectGetOwnPropertyDescriptor(src, key)
      if ('get' in desc) {
        copyAccessor(dest, prefix, newKey, desc)
      } else {
        const { value } = desc
        if (typeof value === 'function') {
          desc.value = uncurryThis(value)
        }
        const name = `${prefix}${newKey}`
        ReflectDefineProperty(dest, name, { __proto__: null, ...desc })
        if (varargsMethods.includes(name)) {
          ReflectDefineProperty(dest, `${name}Apply`, {
            __proto__: null,
            value: applyBind(value),
          })
        }
      }
    }
  }
  ;['Proxy', 'globalThis'].forEach(name => {
    primordials[name] = globalThis[name]
  })
  ;[decodeURI, decodeURIComponent, encodeURI, encodeURIComponent].forEach(
    fn => {
      primordials[fn.name] = fn
    }
  )
  ;['JSON', 'Math', 'Proxy', 'Reflect'].forEach(name => {
    copyPropsRenamed(globalThis[name], primordials, name)
  })
  ;[
    'AggregateError',
    'Array',
    'ArrayBuffer',
    'BigInt',
    'BigInt64Array',
    'BigUint64Array',
    'Boolean',
    'DataView',
    'Date',
    'Error',
    'EvalError',
    'FinalizationRegistry',
    'Float32Array',
    'Float64Array',
    'Function',
    'Int16Array',
    'Int32Array',
    'Int8Array',
    'Map',
    'Number',
    'Object',
    'RangeError',
    'ReferenceError',
    'RegExp',
    'Set',
    'String',
    'Symbol',
    'SyntaxError',
    'TypeError',
    'URIError',
    'Uint16Array',
    'Uint32Array',
    'Uint8Array',
    'Uint8ClampedArray',
    'WeakMap',
    'WeakRef',
    'WeakSet',
  ].forEach(name => {
    const original = globalThis[name]
    primordials[name] = original
    copyPropsRenamed(original, primordials, name)
    copyPrototype(original.prototype, primordials, `${name}Prototype`)
  })
  ;['Promise'].forEach(name => {
    const original = globalThis[name]
    primordials[name] = original
    copyPropsRenamedBound(original, primordials, name)
    copyPrototype(original.prototype, primordials, `${name}Prototype`)
  })
  ;[
    { name: 'TypedArray', original: Reflect.getPrototypeOf(Uint8Array) },
    {
      name: 'ArrayIterator',
      original: {
        prototype: Reflect.getPrototypeOf(Array.prototype[Symbol.iterator]()),
      },
    },
    {
      name: 'StringIterator',
      original: {
        prototype: Reflect.getPrototypeOf(String.prototype[Symbol.iterator]()),
      },
    },
  ].forEach(({ name, original }) => {
    primordials[name] = original
    copyPrototype(original, primordials, name)
    copyPrototype(original.prototype, primordials, `${name}Prototype`)
  })
  primordials.IteratorPrototype = Reflect.getPrototypeOf(
    primordials.ArrayIteratorPrototype
  )
  const {
    Array: ArrayConstructor,
    ArrayPrototypeForEach,
    ArrayPrototypeMap,
    FinalizationRegistry,
    FunctionPrototypeCall,
    Map,
    ObjectDefineProperties,
    ObjectDefineProperty,
    ObjectFreeze,
    ObjectSetPrototypeOf,
    Promise,
    PromisePrototypeThen,
    PromiseResolve,
    ReflectApply,
    ReflectConstruct,
    ReflectSet,
    ReflectGet,
    RegExp,
    RegExpPrototype,
    RegExpPrototypeExec,
    RegExpPrototypeGetDotAll,
    RegExpPrototypeGetFlags,
    RegExpPrototypeGetGlobal,
    RegExpPrototypeGetHasIndices,
    RegExpPrototypeGetIgnoreCase,
    RegExpPrototypeGetMultiline,
    RegExpPrototypeGetSource,
    RegExpPrototypeGetSticky,
    RegExpPrototypeGetUnicode,
    Set,
    SymbolIterator,
    SymbolMatch,
    SymbolMatchAll,
    SymbolReplace,
    SymbolSearch,
    SymbolSpecies,
    SymbolSplit,
    WeakMap,
    WeakRef,
    WeakSet,
  } = primordials
  const createSafeIterator = (factory, next) => {
    class SafeIterator {
      constructor(iterable) {
        this._iterator = factory(iterable)
      }
      next() {
        return next(this._iterator)
      }
      [SymbolIterator]() {
        return this
      }
    }
    ObjectSetPrototypeOf(SafeIterator.prototype, null)
    ObjectFreeze(SafeIterator.prototype)
    ObjectFreeze(SafeIterator)
    return SafeIterator
  }
  primordials.SafeArrayIterator = createSafeIterator(
    primordials.ArrayPrototypeSymbolIterator,
    primordials.ArrayIteratorPrototypeNext
  )
  primordials.SafeStringIterator = createSafeIterator(
    primordials.StringPrototypeSymbolIterator,
    primordials.StringIteratorPrototypeNext
  )
  const copyProps = (src, dest) => {
    ArrayPrototypeForEach(ReflectOwnKeys(src), key => {
      if (!ReflectGetOwnPropertyDescriptor(dest, key)) {
        ReflectDefineProperty(dest, key, {
          __proto__: null,
          ...ReflectGetOwnPropertyDescriptor(src, key),
        })
      }
    })
  }
  const makeSafe = (unsafe, safe) => {
    if (SymbolIterator in unsafe.prototype) {
      const dummy = new unsafe()
      let next
      ArrayPrototypeForEach(ReflectOwnKeys(unsafe.prototype), key => {
        if (!ReflectGetOwnPropertyDescriptor(safe.prototype, key)) {
          const desc = ReflectGetOwnPropertyDescriptor(unsafe.prototype, key)
          if (
            typeof desc.value === 'function' &&
            desc.value.length === 0 &&
            SymbolIterator in (FunctionPrototypeCall(desc.value, dummy) ?? {})
          ) {
            const createIterator = uncurryThis(desc.value)
            next ??= uncurryThis(createIterator(dummy).next)
            const SafeIterator = createSafeIterator(createIterator, next)
            desc.value = function () {
              return new SafeIterator(this)
            }
          }
          ReflectDefineProperty(safe.prototype, key, {
            __proto__: null,
            ...desc,
          })
        }
      })
    } else {
      copyProps(unsafe.prototype, safe.prototype)
    }
    copyProps(unsafe, safe)
    ObjectSetPrototypeOf(safe.prototype, null)
    ObjectFreeze(safe.prototype)
    ObjectFreeze(safe)
    return safe
  }
  primordials.makeSafe = makeSafe
  primordials.SafeMap = makeSafe(
    Map,
    class SafeMap extends Map {
      constructor(i) {
        super(i)
      }
    }
  )
  primordials.SafeWeakMap = makeSafe(
    WeakMap,
    class SafeWeakMap extends WeakMap {
      constructor(i) {
        super(i)
      }
    }
  )
  primordials.SafeSet = makeSafe(
    Set,
    class SafeSet extends Set {
      constructor(i) {
        super(i)
      }
    }
  )
  primordials.SafeWeakSet = makeSafe(
    WeakSet,
    class SafeWeakSet extends WeakSet {
      constructor(i) {
        super(i)
      }
    }
  )
  primordials.SafeFinalizationRegistry = makeSafe(
    FinalizationRegistry,
    class SafeFinalizationRegistry extends FinalizationRegistry {
      constructor(cleanupCallback) {
        super(cleanupCallback)
      }
    }
  )
  primordials.SafeWeakRef = makeSafe(
    WeakRef,
    class SafeWeakRef extends WeakRef {
      constructor(target) {
        super(target)
      }
    }
  )
  const SafePromise = makeSafe(
    Promise,
    class SafePromise extends Promise {
      constructor(executor) {
        super(executor)
      }
    }
  )
  primordials.SafePromisePrototypeFinally = (thisPromise, onFinally) =>
    new Promise((a, b) =>
      new SafePromise((a, b) => PromisePrototypeThen(thisPromise, a, b))
        .finally(onFinally)
        .then(a, b)
    )
  primordials.AsyncIteratorPrototype = primordials.ReflectGetPrototypeOf(
    primordials.ReflectGetPrototypeOf(async function* () {}).prototype
  )
  const arrayToSafePromiseIterable = (promises, mapFn) =>
    new primordials.SafeArrayIterator(
      ArrayPrototypeMap(
        promises,
        (promise, i) =>
          new SafePromise((a, b) =>
            PromisePrototypeThen(
              mapFn == null ? promise : mapFn(promise, i),
              a,
              b
            )
          )
      )
    )
  primordials.SafePromiseAll = (promises, mapFn) =>
    new Promise((a, b) =>
      SafePromise.all(arrayToSafePromiseIterable(promises, mapFn)).then(a, b)
    )
  primordials.SafePromiseAllReturnArrayLike = (promises, mapFn) =>
    new Promise((resolve, reject) => {
      const { length } = promises
      const returnVal = ArrayConstructor(length)
      ObjectSetPrototypeOf(returnVal, null)
      if (length === 0) resolve(returnVal)
      let pendingPromises = length
      for (let i = 0; i < length; i++) {
        const promise = mapFn != null ? mapFn(promises[i], i) : promises[i]
        PromisePrototypeThen(
          PromiseResolve(promise),
          result => {
            returnVal[i] = result
            if (--pendingPromises === 0) resolve(returnVal)
          },
          reject
        )
      }
    })
  primordials.SafePromiseAllReturnVoid = (promises, mapFn) =>
    new Promise((resolve, reject) => {
      let pendingPromises = promises.length
      if (pendingPromises === 0) resolve()
      for (let i = 0; i < promises.length; i++) {
        const promise = mapFn != null ? mapFn(promises[i], i) : promises[i]
        PromisePrototypeThen(
          PromiseResolve(promise),
          () => {
            if (--pendingPromises === 0) resolve()
          },
          reject
        )
      }
    })
  primordials.SafePromiseAllSettled = (promises, mapFn) =>
    new Promise((a, b) =>
      SafePromise.allSettled(arrayToSafePromiseIterable(promises, mapFn)).then(
        a,
        b
      )
    )
  primordials.SafePromiseAllSettledReturnVoid = async (promises, mapFn) => {
    await primordials.SafePromiseAllSettled(promises, mapFn)
  }
  primordials.SafePromiseAny = (promises, mapFn) =>
    new Promise((a, b) =>
      SafePromise.any(arrayToSafePromiseIterable(promises, mapFn)).then(a, b)
    )
  primordials.SafePromiseRace = (promises, mapFn) =>
    new Promise((a, b) =>
      SafePromise.race(arrayToSafePromiseIterable(promises, mapFn)).then(a, b)
    )
  const {
    exec: OriginalRegExpPrototypeExec,
    [SymbolMatch]: OriginalRegExpPrototypeSymbolMatch,
    [SymbolMatchAll]: OriginalRegExpPrototypeSymbolMatchAll,
    [SymbolReplace]: OriginalRegExpPrototypeSymbolReplace,
    [SymbolSearch]: OriginalRegExpPrototypeSymbolSearch,
    [SymbolSplit]: OriginalRegExpPrototypeSymbolSplit,
  } = RegExpPrototype
  class RegExpLikeForStringSplitting {
    #regex
    constructor() {
      this.#regex = ReflectConstruct(RegExp, arguments)
    }
    get lastIndex() {
      return ReflectGet(this.#regex, 'lastIndex')
    }
    set lastIndex(value) {
      ReflectSet(this.#regex, 'lastIndex', value)
    }
    exec() {
      return ReflectApply(OriginalRegExpPrototypeExec, this.#regex, arguments)
    }
  }
  ObjectSetPrototypeOf(RegExpLikeForStringSplitting.prototype, null)
  primordials.hardenRegExp = function hardenRegExp(pattern) {
    ObjectDefineProperties(pattern, {
      [SymbolMatch]: {
        __proto__: null,
        configurable: true,
        value: OriginalRegExpPrototypeSymbolMatch,
      },
      [SymbolMatchAll]: {
        __proto__: null,
        configurable: true,
        value: OriginalRegExpPrototypeSymbolMatchAll,
      },
      [SymbolReplace]: {
        __proto__: null,
        configurable: true,
        value: OriginalRegExpPrototypeSymbolReplace,
      },
      [SymbolSearch]: {
        __proto__: null,
        configurable: true,
        value: OriginalRegExpPrototypeSymbolSearch,
      },
      [SymbolSplit]: {
        __proto__: null,
        configurable: true,
        value: OriginalRegExpPrototypeSymbolSplit,
      },
      constructor: {
        __proto__: null,
        configurable: true,
        value: {
          [SymbolSpecies]: RegExpLikeForStringSplitting,
        },
      },
      dotAll: {
        __proto__: null,
        configurable: true,
        value: RegExpPrototypeGetDotAll(pattern),
      },
      exec: {
        __proto__: null,
        configurable: true,
        value: OriginalRegExpPrototypeExec,
      },
      global: {
        __proto__: null,
        configurable: true,
        value: RegExpPrototypeGetGlobal(pattern),
      },
      hasIndices: {
        __proto__: null,
        configurable: true,
        value: RegExpPrototypeGetHasIndices(pattern),
      },
      ignoreCase: {
        __proto__: null,
        configurable: true,
        value: RegExpPrototypeGetIgnoreCase(pattern),
      },
      multiline: {
        __proto__: null,
        configurable: true,
        value: RegExpPrototypeGetMultiline(pattern),
      },
      source: {
        __proto__: null,
        configurable: true,
        value: RegExpPrototypeGetSource(pattern),
      },
      sticky: {
        __proto__: null,
        configurable: true,
        value: RegExpPrototypeGetSticky(pattern),
      },
      unicode: {
        __proto__: null,
        configurable: true,
        value: RegExpPrototypeGetUnicode(pattern),
      },
    })
    ObjectDefineProperty(pattern, 'flags', {
      __proto__: null,
      configurable: true,
      value: RegExpPrototypeGetFlags(pattern),
    })
    return pattern
  }
  primordials.SafeStringPrototypeSearch = (str, regexp) => {
    regexp.lastIndex = 0
    const match = RegExpPrototypeExec(regexp, str)
    return match ? match.index : -1
  }
  ObjectSetPrototypeOf(primordials, null)
  ObjectFreeze(primordials)
  return primordials
})()

const createUtilFormat = (
  {
    isAsyncFunction,
    isGeneratorFunction,
    isArgumentsObject,
    isNativeError,
    isPromise,
  },
  {
    kPending,
    kRejected,
    getPromiseDetails,
    getProxyDetails,
    getConstructorName: internalGetConstructorName,
  }
) => {
  const {
    Array,
    ArrayBufferPrototypeGetByteLength,
    ArrayIsArray,
    ArrayPrototypeFilter,
    ArrayPrototypeForEach,
    ArrayPrototypeIncludes,
    ArrayPrototypeIndexOf,
    ArrayPrototypeJoin,
    ArrayPrototypeMap,
    ArrayPrototypePop,
    ArrayPrototypePush,
    ArrayPrototypePushApply,
    ArrayPrototypeSlice,
    ArrayPrototypeSplice,
    ArrayPrototypeSort,
    ArrayPrototypeUnshift,
    BigIntPrototypeValueOf,
    BooleanPrototypeValueOf,
    DataViewPrototypeGetBuffer,
    DatePrototypeGetTime,
    DatePrototypeToISOString,
    DatePrototypeToString,
    ErrorPrototypeToString,
    FunctionPrototypeBind,
    FunctionPrototypeCall,
    FunctionPrototypeToString,
    JSONStringify,
    MapPrototypeGetSize,
    MapPrototypeEntries,
    MathFloor,
    MathMax,
    MathMin,
    MathRound,
    MathSqrt,
    MathTrunc,
    Number,
    NumberIsFinite,
    NumberIsNaN,
    NumberParseFloat,
    NumberParseInt,
    NumberPrototypeToString,
    NumberPrototypeValueOf,
    Object,
    ObjectAssign,
    ObjectDefineProperty,
    ObjectGetOwnPropertyDescriptor,
    ObjectGetOwnPropertyNames,
    ObjectGetOwnPropertySymbols,
    ObjectGetPrototypeOf,
    ObjectIs,
    ObjectKeys,
    ObjectPrototypeHasOwnProperty,
    ObjectPrototypePropertyIsEnumerable,
    ObjectSeal,
    ObjectSetPrototypeOf,
    ReflectApply,
    ReflectOwnKeys,
    RegExp,
    RegExpPrototypeExec,
    RegExpPrototypeGetSource,
    RegExpPrototypeSymbolReplace,
    RegExpPrototypeSymbolSplit,
    RegExpPrototypeToString,
    SafeStringIterator,
    SafeMap,
    SafeSet,
    SetPrototypeGetSize,
    SetPrototypeValues,
    String,
    StringPrototypeCharCodeAt,
    StringPrototypeCodePointAt,
    StringPrototypeIncludes,
    StringPrototypeIndexOf,
    StringPrototypePadEnd,
    StringPrototypePadStart,
    StringPrototypeRepeat,
    StringPrototypeReplace,
    StringPrototypeReplaceAll,
    StringPrototypeSlice,
    StringPrototypeSplit,
    StringPrototypeEndsWith,
    StringPrototypeStartsWith,
    StringPrototypeToLowerCase,
    StringPrototypeTrim,
    StringPrototypeValueOf,
    SymbolFor,
    SymbolPrototypeToString,
    SymbolPrototypeValueOf,
    SymbolIterator,
    SymbolToStringTag,
    TypedArrayPrototypeForEach,
    TypedArrayPrototypeGetLength,
    TypedArrayPrototypeGetSymbolToStringTag,
    Uint8Array,
    WeakMapPrototypeHas,
    WeakSetPrototypeHas,
    globalThis,
  } = primordials

  const {
    isArrayBuffer,
    isDataView,
    isMap,
    isSet,
    isWeakMap,
    isWeakSet,
    isRegExp,
    isDate,
    isTypedArray,
    isStringObject,
    isNumberObject,
    isBooleanObject,
    isBigIntObject,
    isSymbolObject,
  } = {
    isArrayBuffer(v) {
      try {
        ArrayBufferPrototypeGetByteLength(v)
      } catch (_) {
        return false
      }
      return true
    },
    isDataView(v) {
      try {
        DataViewPrototypeGetBuffer(v)
      } catch (_) {
        return false
      }
      return true
    },
    isMap(v) {
      try {
        MapPrototypeGetSize(v)
      } catch (_) {
        return false
      }
      return true
    },
    isSet(v) {
      try {
        SetPrototypeGetSize(v)
      } catch (_) {
        return false
      }
      return true
    },
    isWeakMap(v) {
      try {
        WeakMapPrototypeHas(v)
      } catch (_) {
        return false
      }
      return true
    },
    isWeakSet(v) {
      try {
        WeakSetPrototypeHas(v)
      } catch (_) {
        return false
      }
      return true
    },
    isRegExp(v) {
      try {
        RegExpPrototypeGetSource(v)
      } catch (_) {
        return false
      }
      return true
    },
    isDate(v) {
      try {
        DatePrototypeGetTime(v)
      } catch (_) {
        return false
      }
      return true
    },
    isTypedArray(v) {
      return !!TypedArrayPrototypeGetSymbolToStringTag(v)
    },
    isStringObject(v) {
      try {
        StringPrototypeValueOf(v)
      } catch (_) {
        return false
      }
      return true
    },
    isNumberObject(v) {
      try {
        NumberPrototypeValueOf(v)
      } catch (_) {
        return false
      }
      return true
    },
    isBooleanObject(v) {
      try {
        BooleanPrototypeValueOf(v)
      } catch (_) {
        return false
      }
      return true
    },
    isBigIntObject(v) {
      try {
        BigIntPrototypeValueOf(v)
      } catch (_) {
        return false
      }
      return true
    },
    isSymbolObject(v) {
      try {
        SymbolPrototypeValueOf(v)
      } catch (_) {
        return false
      }
      return true
    },
  }
  const isAnyArrayBuffer = isArrayBuffer
  const isBoxedPrimitive = v =>
    isNumberObject(v) ||
    isStringObject(v) ||
    isBooleanObject(v) ||
    isBigIntObject(v) ||
    isSymbolObject(v)

  const ALL_PROPERTIES = 0,
    ONLY_ENUMERABLE = 1
  const getOwnNonIndexProperties = (value, filter) => {
    const keys = ObjectGetOwnPropertyNames(value)
    return ArrayPrototypeFilter(keys, key => {
      if (
        filter === ONLY_ENUMERABLE &&
        !ObjectPrototypePropertyIsEnumerable(value, key)
      ) {
        return false
      }
      const uint32key = key >>> 0
      if (`${uint32key}` !== key) return true
      return uint32key === 0xffffffff
    })
  }
  let maxStack_ErrorName
  let maxStack_ErrorMessage
  function isStackOverflowError(err) {
    if (maxStack_ErrorMessage === undefined) {
      try {
        const overflowStack = function overflowStack() {
          overflowStack()
        }
        overflowStack()
      } catch (err) {
        maxStack_ErrorMessage = err.message
        maxStack_ErrorName = err.name
      }
    }
    return (
      err &&
      err.name === maxStack_ErrorName &&
      err.message === maxStack_ErrorMessage
    )
  }
  const join = function join(output, separator) {
    let str = ''
    if (output.length !== 0) {
      const lastIndex = output.length - 1
      for (let i = 0; i < lastIndex; i++) {
        str += output[i]
        str += separator
      }
      str += output[lastIndex]
    }
    return str
  }
  // eslint-disable-next-line no-control-regex
  const colorRegExp = /\u001b\[\d\d?m/g
  const removeColors = function removeColors(str) {
    return StringPrototypeReplace(str, colorRegExp, '')
  }
  const customInspectSymbol = SymbolFor('nodejs.util.inspect.custom')
  let hexSlice
  const builtInObjects = new SafeSet(
    ArrayPrototypeFilter(
      ObjectGetOwnPropertyNames(globalThis),
      e => RegExpPrototypeExec(/^[A-Z][a-zA-Z0-9]+$/, e) !== null
    )
  )
  // https://tc39.es/ecma262/#sec-IsHTMLDDA-internal-slot
  const isUndetectableObject = v => typeof v === 'undefined' && v !== undefined
  const inspectDefaultOptions = ObjectSeal({
    showHidden: false,
    depth: 2,
    colors: false,
    customInspect: true,
    showProxy: false,
    maxArrayLength: 100,
    maxStringLength: 10000,
    breakLength: 80,
    compact: 3,
    sorted: false,
    getters: false,
    numericSeparator: false,
  })
  const kObjectType = 0
  const kArrayType = 1
  const kArrayExtrasType = 2

  /* eslint-disable no-control-regex */
  const strEscapeSequencesRegExp =
    /[\x00-\x1f\x27\x5c\x7f-\x9f]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/
  const strEscapeSequencesReplacer =
    /[\x00-\x1f\x27\x5c\x7f-\x9f]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g
  const strEscapeSequencesRegExpSingle =
    /[\x00-\x1f\x5c\x7f-\x9f]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/
  const strEscapeSequencesReplacerSingle =
    /[\x00-\x1f\x5c\x7f-\x9f]|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g
  /* eslint-enable no-control-regex */

  const keyStrRegExp = /^[a-zA-Z_][a-zA-Z_0-9]*$/
  const numberRegExp = /^(0|[1-9][0-9]*)$/
  const classRegExp = /^(\s+[^(]*?)\s*{/
  const stripCommentsRegExp = /(\/\/.*?\n)|(\/\*(.|\n)*?\*\/)/g
  const kMinLineLength = 16
  const meta = [
    '\\x00', '\\x01', '\\x02', '\\x03', '\\x04', '\\x05', '\\x06', '\\x07', // x07
    '\\b', '\\t', '\\n', '\\x0B', '\\f', '\\r', '\\x0E', '\\x0F',           // x0F
    '\\x10', '\\x11', '\\x12', '\\x13', '\\x14', '\\x15', '\\x16', '\\x17', // x17
    '\\x18', '\\x19', '\\x1A', '\\x1B', '\\x1C', '\\x1D', '\\x1E', '\\x1F', // x1F
    '', '', '', '', '', '', '', "\\'", '', '', '', '', '', '', '', '',      // x2F
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',         // x3F
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',         // x4F
    '', '', '', '', '', '', '', '', '', '', '', '', '\\\\', '', '', '',     // x5F
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',         // x6F
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '\\x7F',    // x7F
    '\\x80', '\\x81', '\\x82', '\\x83', '\\x84', '\\x85', '\\x86', '\\x87', // x87
    '\\x88', '\\x89', '\\x8A', '\\x8B', '\\x8C', '\\x8D', '\\x8E', '\\x8F', // x8F
    '\\x90', '\\x91', '\\x92', '\\x93', '\\x94', '\\x95', '\\x96', '\\x97', // x97
    '\\x98', '\\x99', '\\x9A', '\\x9B', '\\x9C', '\\x9D', '\\x9E', '\\x9F', // x9F
  ]
  const ansiPattern =
    '[\\u001B\\u009B][[\\]()#;?]*' +
    '(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*' +
    '|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)' +
    '|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
  const ansi = new RegExp(ansiPattern, 'g')
  const getStringWidth = function getStringWidth(
    str,
    removeControlChars = true
  ) {
    let width = 0
    if (removeControlChars) str = stripVTControlCharacters(str)
    for (const char of new SafeStringIterator(str)) {
      const code = StringPrototypeCodePointAt(char, 0)
      if (isFullWidthCodePoint(code)) {
        width += 2
      } else if (!isZeroWidthCodePoint(code)) {
        width++
      }
    }
    return width
  }
  function getUserOptions(ctx, isCrossContext) {
    const ret = {
      stylize: ctx.stylize,
      showHidden: ctx.showHidden,
      depth: ctx.depth,
      colors: ctx.colors,
      customInspect: ctx.customInspect,
      showProxy: ctx.showProxy,
      maxArrayLength: ctx.maxArrayLength,
      maxStringLength: ctx.maxStringLength,
      breakLength: ctx.breakLength,
      compact: ctx.compact,
      sorted: ctx.sorted,
      getters: ctx.getters,
      numericSeparator: ctx.numericSeparator,
      ...ctx.userOptions,
    }
    if (isCrossContext) {
      ObjectSetPrototypeOf(ret, null)
      for (const key of ObjectKeys(ret)) {
        if (
          (typeof ret[key] === 'object' || typeof ret[key] === 'function') &&
          ret[key] !== null
        ) {
          delete ret[key]
        }
      }
      ret.stylize = ObjectSetPrototypeOf((value, flavour) => {
        let stylized
        try {
          stylized = `${ctx.stylize(value, flavour)}`
        } catch {
          // ignore errors
        }
        if (typeof stylized !== 'string') return value
        return stylized
      }, null)
    }
    return ret
  }
  function inspect(value, opts) {
    const ctx = {
      budget: {},
      indentationLvl: 0,
      seen: [],
      currentDepth: 0,
      stylize: stylizeNoColor,
      showHidden: inspectDefaultOptions.showHidden,
      depth: inspectDefaultOptions.depth,
      colors: inspectDefaultOptions.colors,
      customInspect: inspectDefaultOptions.customInspect,
      showProxy: inspectDefaultOptions.showProxy,
      maxArrayLength: inspectDefaultOptions.maxArrayLength,
      maxStringLength: inspectDefaultOptions.maxStringLength,
      breakLength: inspectDefaultOptions.breakLength,
      compact: inspectDefaultOptions.compact,
      sorted: inspectDefaultOptions.sorted,
      getters: inspectDefaultOptions.getters,
      numericSeparator: inspectDefaultOptions.numericSeparator,
    }
    if (arguments.length > 1) {
      if (arguments.length > 2) {
        if (arguments[2] !== undefined) {
          ctx.depth = arguments[2]
        }
        if (arguments.length > 3 && arguments[3] !== undefined) {
          ctx.colors = arguments[3]
        }
      }
      if (typeof opts === 'boolean') {
        ctx.showHidden = opts
      } else if (opts) {
        const optKeys = ObjectKeys(opts)
        for (let i = 0; i < optKeys.length; ++i) {
          const key = optKeys[i]
          // TODO(BridgeAR): Find a solution what to do about stylize. Either make
          if (
            ObjectPrototypeHasOwnProperty(inspectDefaultOptions, key) ||
            key === 'stylize'
          ) {
            ctx[key] = opts[key]
          } else if (ctx.userOptions === undefined) {
            ctx.userOptions = opts
          }
        }
      }
    }
    if (ctx.colors) ctx.stylize = stylizeWithColor
    if (ctx.maxArrayLength === null) ctx.maxArrayLength = Infinity
    if (ctx.maxStringLength === null) ctx.maxStringLength = Infinity
    return formatValue(ctx, value, 0)
  }
  inspect.custom = customInspectSymbol
  ObjectDefineProperty(inspect, 'defaultOptions', {
    __proto__: null,
    get() {
      return inspectDefaultOptions
    },
  })
  const defaultFG = 39
  const defaultBG = 49
  inspect.colors = {
    __proto__: null,
    reset: [0, 0],
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    blink: [5, 25],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29],
    doubleunderline: [21, 24],
    black: [30, defaultFG],
    red: [31, defaultFG],
    green: [32, defaultFG],
    yellow: [33, defaultFG],
    blue: [34, defaultFG],
    magenta: [35, defaultFG],
    cyan: [36, defaultFG],
    white: [37, defaultFG],
    bgBlack: [40, defaultBG],
    bgRed: [41, defaultBG],
    bgGreen: [42, defaultBG],
    bgYellow: [43, defaultBG],
    bgBlue: [44, defaultBG],
    bgMagenta: [45, defaultBG],
    bgCyan: [46, defaultBG],
    bgWhite: [47, defaultBG],
    framed: [51, 54],
    overlined: [53, 55],
    gray: [90, defaultFG],
    redBright: [91, defaultFG],
    greenBright: [92, defaultFG],
    yellowBright: [93, defaultFG],
    blueBright: [94, defaultFG],
    magentaBright: [95, defaultFG],
    cyanBright: [96, defaultFG],
    whiteBright: [97, defaultFG],
    bgGray: [100, defaultBG],
    bgRedBright: [101, defaultBG],
    bgGreenBright: [102, defaultBG],
    bgYellowBright: [103, defaultBG],
    bgBlueBright: [104, defaultBG],
    bgMagentaBright: [105, defaultBG],
    bgCyanBright: [106, defaultBG],
    bgWhiteBright: [107, defaultBG],
  }
  function defineColorAlias(target, alias) {
    ObjectDefineProperty(inspect.colors, alias, {
      __proto__: null,
      get() {
        return this[target]
      },
      set(value) {
        this[target] = value
      },
      configurable: true,
      enumerable: false,
    })
  }
  defineColorAlias('gray', 'grey')
  defineColorAlias('gray', 'blackBright')
  defineColorAlias('bgGray', 'bgGrey')
  defineColorAlias('bgGray', 'bgBlackBright')
  defineColorAlias('dim', 'faint')
  defineColorAlias('strikethrough', 'crossedout')
  defineColorAlias('strikethrough', 'strikeThrough')
  defineColorAlias('strikethrough', 'crossedOut')
  defineColorAlias('hidden', 'conceal')
  defineColorAlias('inverse', 'swapColors')
  defineColorAlias('inverse', 'swapcolors')
  defineColorAlias('doubleunderline', 'doubleUnderline')
  // TODO(BridgeAR): Add function style support for more complex styles.
  inspect.styles = ObjectAssign(
    { __proto__: null },
    {
      special: 'cyan',
      number: 'yellow',
      bigint: 'yellow',
      boolean: 'yellow',
      undefined: 'grey',
      null: 'bold',
      string: 'green',
      symbol: 'green',
      date: 'magenta',
      // "name": intentionally not styling
      // TODO(BridgeAR): Highlight regular expressions properly.
      regexp: 'red',
      module: 'underline',
    }
  )
  function addQuotes(str, quotes) {
    if (quotes === -1) {
      return `"${str}"`
    }
    if (quotes === -2) {
      return `\`${str}\``
    }
    return `'${str}'`
  }
  function escapeFn(str) {
    const charCode = StringPrototypeCharCodeAt(str)
    return meta.length > charCode
      ? meta[charCode]
      : `\\u${NumberPrototypeToString(charCode, 16)}`
  }
  function strEscape(str) {
    let escapeTest = strEscapeSequencesRegExp
    let escapeReplace = strEscapeSequencesReplacer
    let singleQuote = 39
    if (StringPrototypeIncludes(str, "'")) {
      if (!StringPrototypeIncludes(str, '"')) {
        singleQuote = -1
      } else if (
        !StringPrototypeIncludes(str, '`') &&
        !StringPrototypeIncludes(str, '${')
      ) {
        singleQuote = -2
      }
      if (singleQuote !== 39) {
        escapeTest = strEscapeSequencesRegExpSingle
        escapeReplace = strEscapeSequencesReplacerSingle
      }
    }
    if (str.length < 5000 && RegExpPrototypeExec(escapeTest, str) === null)
      return addQuotes(str, singleQuote)
    if (str.length > 100) {
      str = RegExpPrototypeSymbolReplace(escapeReplace, str, escapeFn)
      return addQuotes(str, singleQuote)
    }
    let result = ''
    let last = 0
    for (let i = 0; i < str.length; i++) {
      const point = StringPrototypeCharCodeAt(str, i)
      if (
        point === singleQuote ||
        point === 92 ||
        point < 32 ||
        (point > 126 && point < 160)
      ) {
        if (last === i) {
          result += meta[point]
        } else {
          result += `${StringPrototypeSlice(str, last, i)}${meta[point]}`
        }
        last = i + 1
      } else if (point >= 0xd800 && point <= 0xdfff) {
        if (point <= 0xdbff && i + 1 < str.length) {
          const point = StringPrototypeCharCodeAt(str, i + 1)
          if (point >= 0xdc00 && point <= 0xdfff) {
            i++
            continue
          }
        }
        result += `${StringPrototypeSlice(
          str,
          last,
          i
        )}\\u${NumberPrototypeToString(point, 16)}`
        last = i + 1
      }
    }
    if (last !== str.length) {
      result += StringPrototypeSlice(str, last)
    }
    return addQuotes(result, singleQuote)
  }
  function stylizeWithColor(str, styleType) {
    const style = inspect.styles[styleType]
    if (style !== undefined) {
      const color = inspect.colors[style]
      if (color !== undefined)
        return `\u001b[${color[0]}m${str}\u001b[${color[1]}m`
    }
    return str
  }
  function stylizeNoColor(str) {
    return str
  }
  function getEmptyFormatArray() {
    return []
  }
  function isInstanceof(object, proto) {
    try {
      return object instanceof proto
    } catch {
      return false
    }
  }
  function getConstructorName(obj, ctx, recurseTimes, protoProps) {
    let firstProto
    const tmp = obj
    while (obj || isUndetectableObject(obj)) {
      const descriptor = ObjectGetOwnPropertyDescriptor(obj, 'constructor')
      if (
        descriptor !== undefined &&
        typeof descriptor.value === 'function' &&
        descriptor.value.name !== '' &&
        isInstanceof(tmp, descriptor.value)
      ) {
        if (
          protoProps !== undefined &&
          (firstProto !== obj || !builtInObjects.has(descriptor.value.name))
        ) {
          addPrototypeProperties(
            ctx,
            tmp,
            firstProto || tmp,
            recurseTimes,
            protoProps
          )
        }
        return String(descriptor.value.name)
      }
      obj = ObjectGetPrototypeOf(obj)
      if (firstProto === undefined) {
        firstProto = obj
      }
    }
    if (firstProto === null) {
      return null
    }
    const res = internalGetConstructorName(tmp)
    if (recurseTimes > ctx.depth && ctx.depth !== null) {
      return `${res} <Complex prototype>`
    }
    const protoConstr = getConstructorName(
      firstProto,
      ctx,
      recurseTimes + 1,
      protoProps
    )
    if (protoConstr === null) {
      return `${res} <${inspect(firstProto, {
        ...ctx,
        customInspect: false,
        depth: -1,
      })}>`
    }
    return `${res} <${protoConstr}>`
  }
  function addPrototypeProperties(ctx, main, obj, recurseTimes, output) {
    let depth = 0
    let keys
    let keySet
    do {
      if (depth !== 0 || main === obj) {
        obj = ObjectGetPrototypeOf(obj)
        if (obj === null) {
          return
        }
        const descriptor = ObjectGetOwnPropertyDescriptor(obj, 'constructor')
        if (
          descriptor !== undefined &&
          typeof descriptor.value === 'function' &&
          builtInObjects.has(descriptor.value.name)
        ) {
          return
        }
      }
      if (depth === 0) {
        keySet = new SafeSet()
      } else {
        ArrayPrototypeForEach(keys, key => keySet.add(key))
      }
      keys = ReflectOwnKeys(obj)
      ArrayPrototypePush(ctx.seen, main)
      for (const key of keys) {
        if (
          key === 'constructor' ||
          ObjectPrototypeHasOwnProperty(main, key) ||
          (depth !== 0 && keySet.has(key))
        ) {
          continue
        }
        const desc = ObjectGetOwnPropertyDescriptor(obj, key)
        if (typeof desc.value === 'function') {
          continue
        }
        const value = formatProperty(
          ctx,
          obj,
          recurseTimes,
          key,
          kObjectType,
          desc,
          main
        )
        if (ctx.colors) {
          ArrayPrototypePush(output, `\u001b[2m${value}\u001b[22m`)
        } else {
          ArrayPrototypePush(output, value)
        }
      }
      ArrayPrototypePop(ctx.seen)
    } while (++depth !== 3)
  }
  function getPrefix(constructor, tag, fallback, size = '') {
    if (constructor === null) {
      if (tag !== '' && fallback !== tag) {
        return `[${fallback}${size}: null prototype] [${tag}] `
      }
      return `[${fallback}${size}: null prototype] `
    }
    if (tag !== '' && constructor !== tag) {
      return `${constructor}${size} [${tag}] `
    }
    return `${constructor}${size} `
  }
  function getKeys(value, showHidden) {
    let keys
    const symbols = ObjectGetOwnPropertySymbols(value)
    if (showHidden) {
      keys = ObjectGetOwnPropertyNames(value)
      if (symbols.length !== 0) ArrayPrototypePushApply(keys, symbols)
    } else {
      // TODO(devsnek): track https:
      try {
        keys = ObjectKeys(value)
      } catch (err) {
        keys = ObjectGetOwnPropertyNames(value)
      }
      if (symbols.length !== 0) {
        const filter = key => ObjectPrototypePropertyIsEnumerable(value, key)
        ArrayPrototypePushApply(keys, ArrayPrototypeFilter(symbols, filter))
      }
    }
    return keys
  }
  function getCtxStyle(value, constructor, tag) {
    let fallback = ''
    if (constructor === null) {
      fallback = internalGetConstructorName(value)
      if (fallback === tag) {
        fallback = 'Object'
      }
    }
    return getPrefix(constructor, tag, fallback)
  }
  function formatProxy(ctx, proxy, recurseTimes) {
    if (recurseTimes > ctx.depth && ctx.depth !== null) {
      return ctx.stylize('Proxy [Array]', 'special')
    }
    recurseTimes += 1
    ctx.indentationLvl += 2
    const res = [
      formatValue(ctx, proxy[0], recurseTimes),
      formatValue(ctx, proxy[1], recurseTimes),
    ]
    ctx.indentationLvl -= 2
    return reduceToSingleString(
      ctx,
      res,
      '',
      ['Proxy [', ']'],
      kArrayExtrasType,
      recurseTimes
    )
  }
  function formatValue(ctx, value, recurseTimes, typedArray) {
    if (
      typeof value !== 'object' &&
      typeof value !== 'function' &&
      !isUndetectableObject(value)
    ) {
      return formatPrimitive(ctx.stylize, value, ctx)
    }
    if (value === null) {
      return ctx.stylize('null', 'null')
    }
    const context = value
    const proxy = getProxyDetails(value, !!ctx.showProxy)
    if (proxy !== undefined) {
      if (proxy === null || proxy[0] === null) {
        return ctx.stylize('<Revoked Proxy>', 'special')
      }
      if (ctx.showProxy) {
        return formatProxy(ctx, proxy, recurseTimes)
      }
      value = proxy
    }
    if (ctx.customInspect) {
      const maybeCustom = value[customInspectSymbol]
      if (
        typeof maybeCustom === 'function' &&
        maybeCustom !== inspect &&
        !(value.constructor && value.constructor.prototype === value)
      ) {
        const depth = ctx.depth === null ? null : ctx.depth - recurseTimes
        const isCrossContext =
          proxy !== undefined || !(context instanceof Object)
        const ret = FunctionPrototypeCall(
          maybeCustom,
          context,
          depth,
          getUserOptions(ctx, isCrossContext),
          inspect
        )
        if (ret !== context) {
          if (typeof ret !== 'string') {
            return formatValue(ctx, ret, recurseTimes)
          }
          return StringPrototypeReplaceAll(
            ret,
            '\n',
            `\n${StringPrototypeRepeat(' ', ctx.indentationLvl)}`
          )
        }
      }
    }
    if (ctx.seen.includes(value)) {
      let index = 1
      if (ctx.circular === undefined) {
        ctx.circular = new SafeMap()
        ctx.circular.set(value, index)
      } else {
        index = ctx.circular.get(value)
        if (index === undefined) {
          index = ctx.circular.size + 1
          ctx.circular.set(value, index)
        }
      }
      return ctx.stylize(`[Circular *${index}]`, 'special')
    }
    return formatRaw(ctx, value, recurseTimes, typedArray)
  }
  function formatRaw(ctx, value, recurseTimes, typedArray) {
    let keys
    let protoProps
    if (ctx.showHidden && (recurseTimes <= ctx.depth || ctx.depth === null)) {
      protoProps = []
    }
    const constructor = getConstructorName(value, ctx, recurseTimes, protoProps)
    if (protoProps !== undefined && protoProps.length === 0) {
      protoProps = undefined
    }
    let tag = value[SymbolToStringTag]
    if (
      typeof tag !== 'string' ||
      (tag !== '' &&
        (ctx.showHidden
          ? ObjectPrototypeHasOwnProperty
          : ObjectPrototypePropertyIsEnumerable)(value, SymbolToStringTag))
    ) {
      tag = ''
    }
    let base = ''
    let formatter = getEmptyFormatArray
    let braces
    let noIterator = true
    let i = 0
    const filter = ctx.showHidden ? ALL_PROPERTIES : ONLY_ENUMERABLE
    let extrasType = kObjectType
    if (SymbolIterator in value || constructor === null) {
      noIterator = false
      if (ArrayIsArray(value)) {
        const prefix =
          constructor !== 'Array' || tag !== ''
            ? getPrefix(constructor, tag, 'Array', `(${value.length})`)
            : ''
        keys = getOwnNonIndexProperties(value, filter)
        braces = [`${prefix}[`, ']']
        if (value.length === 0 && keys.length === 0 && protoProps === undefined)
          return `${braces[0]}]`
        extrasType = kArrayExtrasType
        formatter = formatArray
      } else if (isSet(value)) {
        const size = SetPrototypeGetSize(value)
        const prefix = getPrefix(constructor, tag, 'Set', `(${size})`)
        keys = getKeys(value, ctx.showHidden)
        formatter =
          constructor !== null
            ? FunctionPrototypeBind(formatSet, null, value)
            : FunctionPrototypeBind(formatSet, null, SetPrototypeValues(value))
        if (size === 0 && keys.length === 0 && protoProps === undefined)
          return `${prefix}{}`
        braces = [`${prefix}{`, '}']
      } else if (isMap(value)) {
        const size = MapPrototypeGetSize(value)
        const prefix = getPrefix(constructor, tag, 'Map', `(${size})`)
        keys = getKeys(value, ctx.showHidden)
        formatter =
          constructor !== null
            ? FunctionPrototypeBind(formatMap, null, value)
            : FunctionPrototypeBind(formatMap, null, MapPrototypeEntries(value))
        if (size === 0 && keys.length === 0 && protoProps === undefined)
          return `${prefix}{}`
        braces = [`${prefix}{`, '}']
      } else if (isTypedArray(value)) {
        keys = getOwnNonIndexProperties(value, filter)
        let bound = value
        let fallback = ''
        if (constructor === null) {
          fallback = TypedArrayPrototypeGetSymbolToStringTag(value)
          bound = new primordials[fallback](value)
        }
        const size = TypedArrayPrototypeGetLength(value)
        const prefix = getPrefix(constructor, tag, fallback, `(${size})`)
        braces = [`${prefix}[`, ']']
        if (value.length === 0 && keys.length === 0 && !ctx.showHidden)
          return `${braces[0]}]`
        formatter = FunctionPrototypeBind(formatTypedArray, null, bound, size)
        extrasType = kArrayExtrasType
      } else {
        noIterator = true
      }
    }
    if (noIterator) {
      keys = getKeys(value, ctx.showHidden)
      braces = ['{', '}']
      if (constructor === 'Object') {
        if (isArgumentsObject(value)) {
          braces[0] = '[Arguments] {'
        } else if (tag !== '') {
          braces[0] = `${getPrefix(constructor, tag, 'Object')}{`
        }
        if (keys.length === 0 && protoProps === undefined) {
          return `${braces[0]}}`
        }
      } else if (typeof value === 'function') {
        base = getFunctionBase(value, constructor, tag)
        if (keys.length === 0 && protoProps === undefined)
          return ctx.stylize(base, 'special')
      } else if (isRegExp(value)) {
        base = RegExpPrototypeToString(
          constructor !== null ? value : new RegExp(value)
        )
        const prefix = getPrefix(constructor, tag, 'RegExp')
        if (prefix !== 'RegExp ') base = `${prefix}${base}`
        if (
          (keys.length === 0 && protoProps === undefined) ||
          (recurseTimes > ctx.depth && ctx.depth !== null)
        ) {
          return ctx.stylize(base, 'regexp')
        }
      } else if (isDate(value)) {
        base = NumberIsNaN(DatePrototypeGetTime(value))
          ? DatePrototypeToString(value)
          : DatePrototypeToISOString(value)
        const prefix = getPrefix(constructor, tag, 'Date')
        if (prefix !== 'Date ') base = `${prefix}${base}`
        if (keys.length === 0 && protoProps === undefined) {
          return ctx.stylize(base, 'date')
        }
      } else if (isNativeError(value)) {
        base = formatError(value, constructor, tag, ctx, keys)
        if (keys.length === 0 && protoProps === undefined) return base
      } else if (isAnyArrayBuffer(value)) {
        const arrayType = isArrayBuffer(value)
          ? 'ArrayBuffer'
          : 'SharedArrayBuffer'
        const prefix = getPrefix(constructor, tag, arrayType)
        if (typedArray === undefined) {
          formatter = formatArrayBuffer
        } else if (keys.length === 0 && protoProps === undefined) {
          return `${prefix}{ byteLength: ${formatNumber(
            ctx.stylize,
            value.byteLength,
            false
          )} }`
        }
        braces[0] = `${prefix}{`
        ArrayPrototypeUnshift(keys, 'byteLength')
      } else if (isDataView(value)) {
        braces[0] = `${getPrefix(constructor, tag, 'DataView')}{`
        ArrayPrototypeUnshift(keys, 'byteLength', 'byteOffset', 'buffer')
      } else if (isPromise(value)) {
        braces[0] = `${getPrefix(constructor, tag, 'Promise')}{`
        formatter = formatPromise
      } else if (isWeakSet(value)) {
        braces[0] = `${getPrefix(constructor, tag, 'WeakSet')}{`
        formatter = formatWeakCollection
      } else if (isWeakMap(value)) {
        braces[0] = `${getPrefix(constructor, tag, 'WeakMap')}{`
        formatter = formatWeakCollection
      } else if (isBoxedPrimitive(value)) {
        base = getBoxedBase(value, ctx, keys, constructor, tag)
        if (keys.length === 0 && protoProps === undefined) {
          return base
        }
      } else {
        if (keys.length === 0 && protoProps === undefined) {
          return `${getCtxStyle(value, constructor, tag)}{}`
        }
        braces[0] = `${getCtxStyle(value, constructor, tag)}{`
      }
    }
    if (recurseTimes > ctx.depth && ctx.depth !== null) {
      let constructorName = StringPrototypeSlice(
        getCtxStyle(value, constructor, tag),
        0,
        -1
      )
      if (constructor !== null) constructorName = `[${constructorName}]`
      return ctx.stylize(constructorName, 'special')
    }
    recurseTimes += 1
    ctx.seen.push(value)
    ctx.currentDepth = recurseTimes
    let output
    const { indentationLvl } = ctx
    try {
      output = formatter(ctx, value, recurseTimes)
      for (i = 0; i < keys.length; i++) {
        ArrayPrototypePush(
          output,
          formatProperty(ctx, value, recurseTimes, keys[i], extrasType)
        )
      }
      if (protoProps !== undefined) {
        ArrayPrototypePushApply(output, protoProps)
      }
    } catch (err) {
      const constructorName = StringPrototypeSlice(
        getCtxStyle(value, constructor, tag),
        0,
        -1
      )
      return handleMaxCallStackSize(ctx, err, constructorName, indentationLvl)
    }
    if (ctx.circular !== undefined) {
      const index = ctx.circular.get(value)
      if (index !== undefined) {
        const reference = ctx.stylize(`<ref *${index}>`, 'special')
        if (ctx.compact !== true) {
          base = base === '' ? reference : `${reference} ${base}`
        } else {
          braces[0] = `${reference} ${braces[0]}`
        }
      }
    }
    ctx.seen.pop()
    if (ctx.sorted) {
      const comparator = ctx.sorted === true ? undefined : ctx.sorted
      if (extrasType === kObjectType) {
        ArrayPrototypeSort(output, comparator)
      } else if (keys.length > 1) {
        const sorted = ArrayPrototypeSort(
          ArrayPrototypeSlice(output, output.length - keys.length),
          comparator
        )
        ArrayPrototypeUnshift(
          sorted,
          output,
          output.length - keys.length,
          keys.length
        )
        ReflectApply(ArrayPrototypeSplice, null, sorted)
      }
    }
    const res = reduceToSingleString(
      ctx,
      output,
      base,
      braces,
      extrasType,
      recurseTimes,
      value
    )
    const budget = ctx.budget[ctx.indentationLvl] || 0
    const newLength = budget + res.length
    ctx.budget[ctx.indentationLvl] = newLength
    if (newLength > 2 ** 27) {
      ctx.depth = -1
    }
    return res
  }
  function getBoxedBase(value, ctx, keys, constructor, tag) {
    let fn
    let type
    if (isNumberObject(value)) {
      fn = NumberPrototypeValueOf
      type = 'Number'
    } else if (isStringObject(value)) {
      fn = StringPrototypeValueOf
      type = 'String'
      keys.splice(0, value.length)
    } else if (isBooleanObject(value)) {
      fn = BooleanPrototypeValueOf
      type = 'Boolean'
    } else if (isBigIntObject(value)) {
      fn = BigIntPrototypeValueOf
      type = 'BigInt'
    } else {
      fn = SymbolPrototypeValueOf
      type = 'Symbol'
    }
    let base = `[${type}`
    if (type !== constructor) {
      if (constructor === null) {
        base += ' (null prototype)'
      } else {
        base += ` (${constructor})`
      }
    }
    base += `: ${formatPrimitive(stylizeNoColor, fn(value), ctx)}]`
    if (tag !== '' && tag !== constructor) {
      base += ` [${tag}]`
    }
    if (keys.length !== 0 || ctx.stylize === stylizeNoColor) return base
    return ctx.stylize(base, StringPrototypeToLowerCase(type))
  }
  function getClassBase(value, constructor, tag) {
    const hasName = ObjectPrototypeHasOwnProperty(value, 'name')
    const name = (hasName && value.name) || '(anonymous)'
    let base = `class ${name}`
    if (constructor !== 'Function' && constructor !== null) {
      base += ` [${constructor}]`
    }
    if (tag !== '' && constructor !== tag) {
      base += ` [${tag}]`
    }
    if (constructor !== null) {
      const superName = ObjectGetPrototypeOf(value).name
      if (superName) {
        base += ` extends ${superName}`
      }
    } else {
      base += ' extends [null prototype]'
    }
    return `[${base}]`
  }
  function getFunctionBase(value, constructor, tag) {
    const stringified = FunctionPrototypeToString(value)
    if (
      StringPrototypeStartsWith(stringified, 'class') &&
      StringPrototypeEndsWith(stringified, '}')
    ) {
      const slice = StringPrototypeSlice(stringified, 5, -1)
      const bracketIndex = StringPrototypeIndexOf(slice, '{')
      if (
        bracketIndex !== -1 &&
        (!StringPrototypeIncludes(
          StringPrototypeSlice(slice, 0, bracketIndex),
          '('
        ) ||
          RegExpPrototypeExec(
            classRegExp,
            RegExpPrototypeSymbolReplace(stripCommentsRegExp, slice)
          ) !== null)
      ) {
        return getClassBase(value, constructor, tag)
      }
    }
    let type = 'Function'
    if (isGeneratorFunction(value)) {
      type = `Generator${type}`
    }
    if (isAsyncFunction(value)) {
      type = `Async${type}`
    }
    let base = `[${type}`
    if (constructor === null) {
      base += ' (null prototype)'
    }
    if (value.name === '') {
      base += ' (anonymous)'
    } else {
      base += `: ${value.name}`
    }
    base += ']'
    if (constructor !== type && constructor !== null) {
      base += ` ${constructor}`
    }
    if (tag !== '' && constructor !== tag) {
      base += ` [${tag}]`
    }
    return base
  }
  function identicalSequenceRange(a, b) {
    for (let i = 0; i < a.length - 3; i++) {
      const pos = ArrayPrototypeIndexOf(b, a[i])
      if (pos !== -1) {
        const rest = b.length - pos
        if (rest > 3) {
          let len = 1
          const maxLen = MathMin(a.length - i, rest)
          while (maxLen > len && a[i + len] === b[pos + len]) {
            len++
          }
          if (len > 3) {
            return { len, offset: i }
          }
        }
      }
    }
    return { len: 0, offset: 0 }
  }
  function getStackString(error) {
    return error.stack ? String(error.stack) : ErrorPrototypeToString(error)
  }
  function getStackFrames(ctx, err, stack) {
    const frames = StringPrototypeSplit(stack, '\n')
    let cause
    try {
      ;({ cause } = err)
    } catch {
      // ignore errors
    }
    if (cause != null && isNativeError(cause)) {
      const causeStack = getStackString(cause)
      const causeStackStart = StringPrototypeIndexOf(causeStack, '\n    at')
      if (causeStackStart !== -1) {
        const causeFrames = StringPrototypeSplit(
          StringPrototypeSlice(causeStack, causeStackStart + 1),
          '\n'
        )
        const { len, offset } = identicalSequenceRange(frames, causeFrames)
        if (len > 0) {
          const skipped = len - 2
          const msg = `    ... ${skipped} lines matching cause stack trace ...`
          frames.splice(offset + 1, skipped, ctx.stylize(msg, 'undefined'))
        }
      }
    }
    return frames
  }
  function improveStack(stack, constructor, name, tag) {
    let len = name.length
    if (
      constructor === null ||
      (StringPrototypeEndsWith(name, 'Error') &&
        StringPrototypeStartsWith(stack, name) &&
        (stack.length === len || stack[len] === ':' || stack[len] === '\n'))
    ) {
      let fallback = 'Error'
      if (constructor === null) {
        const start =
          RegExpPrototypeExec(
            /^([A-Z][a-z_ A-Z0-9[\]()-]+)(?::|\n {4}at)/,
            stack
          ) || RegExpPrototypeExec(/^([a-z_A-Z0-9-]*Error)$/, stack)
        fallback = (start && start[1]) || ''
        len = fallback.length
        fallback = fallback || 'Error'
      }
      const prefix = StringPrototypeSlice(
        getPrefix(constructor, tag, fallback),
        0,
        -1
      )
      if (name !== prefix) {
        if (StringPrototypeIncludes(prefix, name)) {
          if (len === 0) {
            stack = `${prefix}: ${stack}`
          } else {
            stack = `${prefix}${StringPrototypeSlice(stack, len)}`
          }
        } else {
          stack = `${prefix} [${name}]${StringPrototypeSlice(stack, len)}`
        }
      }
    }
    return stack
  }
  function removeDuplicateErrorKeys(ctx, keys, err, stack) {
    if (!ctx.showHidden && keys.length !== 0) {
      for (const name of ['name', 'message', 'stack']) {
        const index = ArrayPrototypeIndexOf(keys, name)
        if (index !== -1 && StringPrototypeIncludes(stack, err[name])) {
          ArrayPrototypeSplice(keys, index, 1)
        }
      }
    }
  }
  function formatError(err, constructor, tag, ctx, keys) {
    const name = err.name != null ? String(err.name) : 'Error'
    let stack = getStackString(err)
    removeDuplicateErrorKeys(ctx, keys, err, stack)
    if (
      'cause' in err &&
      (keys.length === 0 || !ArrayPrototypeIncludes(keys, 'cause'))
    ) {
      ArrayPrototypePush(keys, 'cause')
    }
    if (
      ArrayIsArray(err.errors) &&
      (keys.length === 0 || !ArrayPrototypeIncludes(keys, 'errors'))
    ) {
      ArrayPrototypePush(keys, 'errors')
    }
    stack = improveStack(stack, constructor, name, tag)
    let pos = (err.message && StringPrototypeIndexOf(stack, err.message)) || -1
    if (pos !== -1) pos += err.message.length
    const stackStart = StringPrototypeIndexOf(stack, '\n    at', pos)
    if (stackStart === -1) {
      stack = `[${stack}]`
    } else {
      let newStack = StringPrototypeSlice(stack, 0, stackStart)
      const stackFramePart = StringPrototypeSlice(stack, stackStart + 1)
      const lines = getStackFrames(ctx, err, stackFramePart)
      newStack += `\n${ArrayPrototypeJoin(lines, '\n')}`
      stack = newStack
    }
    if (ctx.indentationLvl !== 0) {
      const indentation = StringPrototypeRepeat(' ', ctx.indentationLvl)
      stack = StringPrototypeReplaceAll(stack, '\n', `\n${indentation}`)
    }
    return stack
  }
  function groupArrayElements(ctx, output, value) {
    let totalLength = 0
    let maxLength = 0
    let i = 0
    let outputLength = output.length
    if (ctx.maxArrayLength < output.length) {
      outputLength--
    }
    const separatorSpace = 2
    const dataLen = new Array(outputLength)
    for (; i < outputLength; i++) {
      const len = getStringWidth(output[i], ctx.colors)
      dataLen[i] = len
      totalLength += len + separatorSpace
      if (maxLength < len) maxLength = len
    }
    const actualMax = maxLength + separatorSpace
    if (
      actualMax * 3 + ctx.indentationLvl < ctx.breakLength &&
      (totalLength / actualMax > 5 || maxLength <= 6)
    ) {
      const approxCharHeights = 2.5
      const averageBias = MathSqrt(actualMax - totalLength / output.length)
      const biasedMax = MathMax(actualMax - 3 - averageBias, 1)
      const columns = MathMin(
        MathRound(
          MathSqrt(approxCharHeights * biasedMax * outputLength) / biasedMax
        ),
        MathFloor((ctx.breakLength - ctx.indentationLvl) / actualMax),
        ctx.compact * 4,
        15
      )
      if (columns <= 1) {
        return output
      }
      const tmp = []
      const maxLineLength = []
      for (let i = 0; i < columns; i++) {
        let lineMaxLength = 0
        for (let j = i; j < output.length; j += columns) {
          if (dataLen[j] > lineMaxLength) lineMaxLength = dataLen[j]
        }
        lineMaxLength += separatorSpace
        maxLineLength[i] = lineMaxLength
      }
      let order = StringPrototypePadStart
      if (value !== undefined) {
        for (let i = 0; i < output.length; i++) {
          if (typeof value[i] !== 'number' && typeof value[i] !== 'bigint') {
            order = StringPrototypePadEnd
            break
          }
        }
      }
      for (let i = 0; i < outputLength; i += columns) {
        const max = MathMin(i + columns, outputLength)
        let str = ''
        let j = i
        for (; j < max - 1; j++) {
          const padding = maxLineLength[j - i] + output[j].length - dataLen[j]
          str += order(`${output[j]}, `, padding, ' ')
        }
        if (order === StringPrototypePadStart) {
          const padding =
            maxLineLength[j - i] +
            output[j].length -
            dataLen[j] -
            separatorSpace
          str += StringPrototypePadStart(output[j], padding, ' ')
        } else {
          str += output[j]
        }
        ArrayPrototypePush(tmp, str)
      }
      if (ctx.maxArrayLength < output.length) {
        ArrayPrototypePush(tmp, output[outputLength])
      }
      output = tmp
    }
    return output
  }
  function handleMaxCallStackSize(ctx, err, constructorName, indentationLvl) {
    if (isStackOverflowError(err)) {
      ctx.seen.pop()
      ctx.indentationLvl = indentationLvl
      return ctx.stylize(
        `[${constructorName}: Inspection interrupted prematurely. Maximum call stack size exceeded.]`,
        'special'
      )
    }
  }
  function addNumericSeparator(integerString) {
    let result = ''
    let i = integerString.length
    const start = StringPrototypeStartsWith(integerString, '-') ? 1 : 0
    for (; i >= start + 4; i -= 3) {
      result = `_${StringPrototypeSlice(integerString, i - 3, i)}${result}`
    }
    return i === integerString.length
      ? integerString
      : `${StringPrototypeSlice(integerString, 0, i)}${result}`
  }
  function addNumericSeparatorEnd(integerString) {
    let result = ''
    let i = 0
    for (; i < integerString.length - 3; i += 3) {
      result += `${StringPrototypeSlice(integerString, i, i + 3)}_`
    }
    return i === 0
      ? integerString
      : `${result}${StringPrototypeSlice(integerString, i)}`
  }
  const remainingText = remaining =>
    `... ${remaining} more item${remaining > 1 ? 's' : ''}`
  function formatNumber(fn, number, numericSeparator) {
    if (!numericSeparator) {
      if (ObjectIs(number, -0)) {
        return fn('-0', 'number')
      }
      return fn(`${number}`, 'number')
    }
    const integer = MathTrunc(number)
    const string = String(integer)
    if (integer === number) {
      if (!NumberIsFinite(number) || StringPrototypeIncludes(string, 'e')) {
        return fn(string, 'number')
      }
      return fn(`${addNumericSeparator(string)}`, 'number')
    }
    if (NumberIsNaN(number)) {
      return fn(string, 'number')
    }
    return fn(
      `${addNumericSeparator(string)}.${addNumericSeparatorEnd(
        StringPrototypeSlice(String(number), string.length + 1)
      )}`,
      'number'
    )
  }
  function formatBigInt(fn, bigint, numericSeparator) {
    const string = String(bigint)
    if (!numericSeparator) {
      return fn(`${string}n`, 'bigint')
    }
    return fn(`${addNumericSeparator(string)}n`, 'bigint')
  }
  function formatPrimitive(fn, value, ctx) {
    if (typeof value === 'string') {
      let trailer = ''
      if (value.length > ctx.maxStringLength) {
        const remaining = value.length - ctx.maxStringLength
        value = StringPrototypeSlice(value, 0, ctx.maxStringLength)
        trailer = `... ${remaining} more character${remaining > 1 ? 's' : ''}`
      }
      if (
        ctx.compact !== true &&
        value.length > kMinLineLength &&
        value.length > ctx.breakLength - ctx.indentationLvl - 4
      ) {
        return (
          ArrayPrototypeJoin(
            ArrayPrototypeMap(
              RegExpPrototypeSymbolSplit(/(?<=\n)/, value),
              line => fn(strEscape(line), 'string')
            ),
            ` +\n${StringPrototypeRepeat(' ', ctx.indentationLvl + 2)}`
          ) + trailer
        )
      }
      return fn(strEscape(value), 'string') + trailer
    }
    if (typeof value === 'number')
      return formatNumber(fn, value, ctx.numericSeparator)
    if (typeof value === 'bigint')
      return formatBigInt(fn, value, ctx.numericSeparator)
    if (typeof value === 'boolean') return fn(`${value}`, 'boolean')
    if (typeof value === 'undefined') return fn('undefined', 'undefined')
    return fn(SymbolPrototypeToString(value), 'symbol')
  }
  function formatSpecialArray(ctx, value, recurseTimes, maxLength, output, i) {
    const keys = ObjectKeys(value)
    let index = i
    for (; i < keys.length && output.length < maxLength; i++) {
      const key = keys[i]
      const tmp = +key
      // Arrays can only have up to 2^32 - 1 entries
      if (tmp > 2 ** 32 - 2) {
        break
      }
      if (`${index}` !== key) {
        if (RegExpPrototypeExec(numberRegExp, key) === null) {
          break
        }
        const emptyItems = tmp - index
        const ending = emptyItems > 1 ? 's' : ''
        const message = `<${emptyItems} empty item${ending}>`
        ArrayPrototypePush(output, ctx.stylize(message, 'undefined'))
        index = tmp
        if (output.length === maxLength) {
          break
        }
      }
      ArrayPrototypePush(
        output,
        formatProperty(ctx, value, recurseTimes, key, kArrayType)
      )
      index++
    }
    const remaining = value.length - index
    if (output.length !== maxLength) {
      if (remaining > 0) {
        const ending = remaining > 1 ? 's' : ''
        const message = `<${remaining} empty item${ending}>`
        ArrayPrototypePush(output, ctx.stylize(message, 'undefined'))
      }
    } else if (remaining > 0) {
      ArrayPrototypePush(output, remainingText(remaining))
    }
    return output
  }
  function formatArrayBuffer(ctx, value) {
    let buffer
    try {
      buffer = new Uint8Array(value)
    } catch {
      return [ctx.stylize('(detached)', 'special')]
    }
    if (hexSlice === undefined)
      hexSlice = (buffer, start, end) => {
        let s = ''
        try {
          TypedArrayPrototypeForEach(buffer, (v, i) => {
            if (i < start) return
            s += StringPrototypePadStart(NumberPrototypeToString(v, 16), 2, '0')
            if (i >= end) throw null
          })
        } catch (_) {
          // ignore errors
        }
        return s
      }
    let str = StringPrototypeTrim(
      RegExpPrototypeSymbolReplace(
        /(.{2})/g,
        hexSlice(buffer, 0, MathMin(ctx.maxArrayLength, buffer.length)),
        '$1 '
      )
    )
    const remaining = buffer.length - ctx.maxArrayLength
    if (remaining > 0)
      str += ` ... ${remaining} more byte${remaining > 1 ? 's' : ''}`
    return [`${ctx.stylize('[Uint8Contents]', 'special')}: <${str}>`]
  }
  function formatArray(ctx, value, recurseTimes) {
    const valLen = value.length
    const len = MathMin(MathMax(0, ctx.maxArrayLength), valLen)
    const remaining = valLen - len
    const output = []
    for (let i = 0; i < len; i++) {
      if (!ObjectPrototypeHasOwnProperty(value, i)) {
        return formatSpecialArray(ctx, value, recurseTimes, len, output, i)
      }
      ArrayPrototypePush(
        output,
        formatProperty(ctx, value, recurseTimes, i, kArrayType)
      )
    }
    if (remaining > 0) {
      ArrayPrototypePush(output, remainingText(remaining))
    }
    return output
  }
  function formatTypedArray(value, length, ctx, ignored, recurseTimes) {
    const maxLength = MathMin(MathMax(0, ctx.maxArrayLength), length)
    const remaining = value.length - maxLength
    const output = new Array(maxLength)
    const elementFormatter =
      value.length > 0 && typeof value[0] === 'number'
        ? formatNumber
        : formatBigInt
    for (let i = 0; i < maxLength; ++i) {
      output[i] = elementFormatter(ctx.stylize, value[i], ctx.numericSeparator)
    }
    if (remaining > 0) {
      output[maxLength] = remainingText(remaining)
    }
    if (ctx.showHidden) {
      ctx.indentationLvl += 2
      for (const key of [
        'BYTES_PER_ELEMENT',
        'length',
        'byteLength',
        'byteOffset',
        'buffer',
      ]) {
        const str = formatValue(ctx, value[key], recurseTimes, true)
        ArrayPrototypePush(output, `[${key}]: ${str}`)
      }
      ctx.indentationLvl -= 2
    }
    return output
  }
  function formatSet(value, ctx, ignored, recurseTimes) {
    const length = value.size
    const maxLength = MathMin(MathMax(0, ctx.maxArrayLength), length)
    const remaining = length - maxLength
    const output = []
    ctx.indentationLvl += 2
    let i = 0
    for (const v of value) {
      if (i >= maxLength) break
      ArrayPrototypePush(output, formatValue(ctx, v, recurseTimes))
      i++
    }
    if (remaining > 0) {
      ArrayPrototypePush(output, remainingText(remaining))
    }
    ctx.indentationLvl -= 2
    return output
  }
  function formatMap(value, ctx, ignored, recurseTimes) {
    const length = value.size
    const maxLength = MathMin(MathMax(0, ctx.maxArrayLength), length)
    const remaining = length - maxLength
    const output = []
    ctx.indentationLvl += 2
    let i = 0
    for (const { 0: k, 1: v } of value) {
      if (i >= maxLength) break
      ArrayPrototypePush(
        output,
        `${formatValue(ctx, k, recurseTimes)} => ${formatValue(
          ctx,
          v,
          recurseTimes
        )}`
      )
      i++
    }
    if (remaining > 0) {
      ArrayPrototypePush(output, remainingText(remaining))
    }
    ctx.indentationLvl -= 2
    return output
  }
  function formatWeakCollection(ctx) {
    return [ctx.stylize('<items unknown>', 'special')]
  }
  function formatPromise(ctx, value, recurseTimes) {
    let output
    const { 0: state, 1: result } = getPromiseDetails(value)
    if (state === kPending) {
      output = [ctx.stylize('<pending>', 'special')]
    } else {
      ctx.indentationLvl += 2
      const str = formatValue(ctx, result, recurseTimes)
      ctx.indentationLvl -= 2
      output = [
        state === kRejected
          ? `${ctx.stylize('<rejected>', 'special')} ${str}`
          : str,
      ]
    }
    return output
  }
  function formatProperty(
    ctx,
    value,
    recurseTimes,
    key,
    type,
    desc,
    original = value
  ) {
    let name, str
    let extra = ' '
    desc = desc ||
      ObjectGetOwnPropertyDescriptor(value, key) || {
        value: value[key],
        enumerable: true,
      }
    if (desc.value !== undefined) {
      const diff = ctx.compact !== true || type !== kObjectType ? 2 : 3
      ctx.indentationLvl += diff
      str = formatValue(ctx, desc.value, recurseTimes)
      if (diff === 3 && ctx.breakLength < getStringWidth(str, ctx.colors)) {
        extra = `\n${StringPrototypeRepeat(' ', ctx.indentationLvl)}`
      }
      ctx.indentationLvl -= diff
    } else if (desc.get !== undefined) {
      const label = desc.set !== undefined ? 'Getter/Setter' : 'Getter'
      const s = ctx.stylize
      const sp = 'special'
      if (
        ctx.getters &&
        (ctx.getters === true ||
          (ctx.getters === 'get' && desc.set === undefined) ||
          (ctx.getters === 'set' && desc.set !== undefined))
      ) {
        try {
          const tmp = FunctionPrototypeCall(desc.get, original)
          ctx.indentationLvl += 2
          if (tmp === null) {
            str = `${s(`[${label}:`, sp)} ${s('null', 'null')}${s(']', sp)}`
          } else if (typeof tmp === 'object') {
            str = `${s(`[${label}]`, sp)} ${formatValue(
              ctx,
              tmp,
              recurseTimes
            )}`
          } else {
            const primitive = formatPrimitive(s, tmp, ctx)
            str = `${s(`[${label}:`, sp)} ${primitive}${s(']', sp)}`
          }
          ctx.indentationLvl -= 2
        } catch (err) {
          const message = `<Inspection threw (${err.message})>`
          str = `${s(`[${label}:`, sp)} ${message}${s(']', sp)}`
        }
      } else {
        str = ctx.stylize(`[${label}]`, sp)
      }
    } else if (desc.set !== undefined) {
      str = ctx.stylize('[Setter]', 'special')
    } else {
      str = ctx.stylize('undefined', 'undefined')
    }
    if (type === kArrayType) {
      return str
    }
    if (typeof key === 'symbol') {
      const tmp = RegExpPrototypeSymbolReplace(
        strEscapeSequencesReplacer,
        SymbolPrototypeToString(key),
        escapeFn
      )
      name = `[${ctx.stylize(tmp, 'symbol')}]`
    } else if (key === '__proto__') {
      name = "['__proto__']"
    } else if (desc.enumerable === false) {
      const tmp = RegExpPrototypeSymbolReplace(
        strEscapeSequencesReplacer,
        key,
        escapeFn
      )
      name = `[${tmp}]`
    } else if (RegExpPrototypeExec(keyStrRegExp, key) !== null) {
      name = ctx.stylize(key, 'name')
    } else {
      name = ctx.stylize(strEscape(key), 'string')
    }
    return `${name}:${extra}${str}`
  }
  function isBelowBreakLength(ctx, output, start, base) {
    // TODO(BridgeAR): Add unicode support. Use the readline getStringWidth
    let totalLength = output.length + start
    if (totalLength + output.length > ctx.breakLength) return false
    for (let i = 0; i < output.length; i++) {
      if (ctx.colors) {
        totalLength += removeColors(output[i]).length
      } else {
        totalLength += output[i].length
      }
      if (totalLength > ctx.breakLength) {
        return false
      }
    }
    return base === '' || !StringPrototypeIncludes(base, '\n')
  }
  function reduceToSingleString(
    ctx,
    output,
    base,
    braces,
    extrasType,
    recurseTimes,
    value
  ) {
    if (ctx.compact !== true) {
      if (typeof ctx.compact === 'number' && ctx.compact >= 1) {
        const entries = output.length
        if (extrasType === kArrayExtrasType && entries > 6) {
          output = groupArrayElements(ctx, output, value)
        }
        if (
          ctx.currentDepth - recurseTimes < ctx.compact &&
          entries === output.length
        ) {
          const start =
            output.length +
            ctx.indentationLvl +
            braces[0].length +
            base.length +
            10
          if (isBelowBreakLength(ctx, output, start, base)) {
            const joinedOutput = join(output, ', ')
            if (!StringPrototypeIncludes(joinedOutput, '\n')) {
              return `${base ? `${base} ` : ''}${braces[0]} ${joinedOutput} ${
                braces[1]
              }`
            }
          }
        }
      }
      const indentation = `\n${StringPrototypeRepeat(' ', ctx.indentationLvl)}`
      return (
        `${base ? `${base} ` : ''}${braces[0]}${indentation}  ` +
        `${join(output, `,${indentation}  `)}${indentation}${braces[1]}`
      )
    }
    if (isBelowBreakLength(ctx, output, 0, base)) {
      return `${braces[0]}${base ? ` ${base}` : ''} ${join(output, ', ')} ${
        braces[1]
      }`
    }
    const indentation = StringPrototypeRepeat(' ', ctx.indentationLvl)
    const ln =
      base === '' && braces[0].length === 1
        ? ' '
        : `${base ? ` ${base}` : ''}\n${indentation}  `
    return `${braces[0]}${ln}${join(output, `,\n${indentation}  `)} ${
      braces[1]
    }`
  }
  function hasBuiltInToString(value) {
    const getFullProxy = false
    const proxyTarget = getProxyDetails(value, getFullProxy)
    if (proxyTarget !== undefined) {
      if (proxyTarget === null) {
        return true
      }
      value = proxyTarget
    }
    if (typeof value.toString !== 'function') {
      return true
    }
    if (ObjectPrototypeHasOwnProperty(value, 'toString')) {
      return false
    }
    let pointer = value
    do {
      pointer = ObjectGetPrototypeOf(pointer)
    } while (!ObjectPrototypeHasOwnProperty(pointer, 'toString'))
    const descriptor = ObjectGetOwnPropertyDescriptor(pointer, 'constructor')
    return (
      descriptor !== undefined &&
      typeof descriptor.value === 'function' &&
      builtInObjects.has(descriptor.value.name)
    )
  }
  const firstErrorLine = error =>
    StringPrototypeSplit(error.message, '\n', 1)[0]
  let CIRCULAR_ERROR_MESSAGE
  function tryStringify(arg) {
    try {
      return JSONStringify(arg)
    } catch (err) {
      if (!CIRCULAR_ERROR_MESSAGE) {
        try {
          const a = {}
          a.a = a
          JSONStringify(a)
        } catch (circularError) {
          CIRCULAR_ERROR_MESSAGE = firstErrorLine(circularError)
        }
      }
      if (
        err.name === 'TypeError' &&
        firstErrorLine(err) === CIRCULAR_ERROR_MESSAGE
      ) {
        return '[Circular]'
      }
      throw err
    }
  }
  function format(...args) {
    return formatWithOptionsInternal(undefined, args)
  }
  function formatWithOptions(inspectOptions, ...args) {
    return formatWithOptionsInternal(inspectOptions, args)
  }
  function formatNumberNoColor(number, options) {
    return formatNumber(
      stylizeNoColor,
      number,
      options?.numericSeparator ?? inspectDefaultOptions.numericSeparator
    )
  }
  function formatBigIntNoColor(bigint, options) {
    return formatBigInt(
      stylizeNoColor,
      bigint,
      options?.numericSeparator ?? inspectDefaultOptions.numericSeparator
    )
  }
  function formatWithOptionsInternal(inspectOptions, args) {
    const first = args[0]
    let a = 0
    let str = ''
    let join = ''
    if (typeof first === 'string') {
      if (args.length === 1) {
        return first
      }
      let tempStr
      let lastPos = 0
      for (let i = 0; i < first.length - 1; i++) {
        if (StringPrototypeCharCodeAt(first, i) === 37) {
          const nextChar = StringPrototypeCharCodeAt(first, ++i)
          if (a + 1 !== args.length) {
            switch (nextChar) {
              case 115: {
                const tempArg = args[++a]
                if (typeof tempArg === 'number') {
                  tempStr = formatNumberNoColor(tempArg, inspectOptions)
                } else if (typeof tempArg === 'bigint') {
                  tempStr = formatBigIntNoColor(tempArg, inspectOptions)
                } else if (
                  typeof tempArg !== 'object' ||
                  tempArg === null ||
                  !hasBuiltInToString(tempArg)
                ) {
                  tempStr = String(tempArg)
                } else {
                  tempStr = inspect(tempArg, {
                    ...inspectOptions,
                    compact: 3,
                    colors: false,
                    depth: 0,
                  })
                }
                break
              }
              case 106:
                tempStr = tryStringify(args[++a])
                break
              case 100: {
                const tempNum = args[++a]
                if (typeof tempNum === 'bigint') {
                  tempStr = formatBigIntNoColor(tempNum, inspectOptions)
                } else if (typeof tempNum === 'symbol') {
                  tempStr = 'NaN'
                } else {
                  tempStr = formatNumberNoColor(Number(tempNum), inspectOptions)
                }
                break
              }
              case 79:
                tempStr = inspect(args[++a], inspectOptions)
                break
              case 111:
                tempStr = inspect(args[++a], {
                  ...inspectOptions,
                  showHidden: true,
                  showProxy: true,
                  depth: 4,
                })
                break
              case 105: {
                const tempInteger = args[++a]
                if (typeof tempInteger === 'bigint') {
                  tempStr = formatBigIntNoColor(tempInteger, inspectOptions)
                } else if (typeof tempInteger === 'symbol') {
                  tempStr = 'NaN'
                } else {
                  tempStr = formatNumberNoColor(
                    NumberParseInt(tempInteger),
                    inspectOptions
                  )
                }
                break
              }
              case 102: {
                const tempFloat = args[++a]
                if (typeof tempFloat === 'symbol') {
                  tempStr = 'NaN'
                } else {
                  tempStr = formatNumberNoColor(
                    NumberParseFloat(tempFloat),
                    inspectOptions
                  )
                }
                break
              }
              case 99:
                a += 1
                tempStr = ''
                break
              case 37:
                str += StringPrototypeSlice(first, lastPos, i)
                lastPos = i + 1
                continue
              default:
                continue
            }
            if (lastPos !== i - 1) {
              str += StringPrototypeSlice(first, lastPos, i - 1)
            }
            str += tempStr
            lastPos = i + 1
          } else if (nextChar === 37) {
            str += StringPrototypeSlice(first, lastPos, i)
            lastPos = i + 1
          }
        }
      }
      if (lastPos !== 0) {
        a++
        join = ' '
        if (lastPos < first.length) {
          str += StringPrototypeSlice(first, lastPos)
        }
      }
    }
    while (a < args.length) {
      const value = args[a]
      str += join
      str += typeof value !== 'string' ? inspect(value, inspectOptions) : value
      join = ' '
      a++
    }
    return str
  }
  function isZeroWidthCodePoint(code) {
    return (
      code <= 0x1f ||
      (code >= 0x7f && code <= 0x9f) ||
      (code >= 0x300 && code <= 0x36f) ||
      (code >= 0x200b && code <= 0x200f) ||
      (code >= 0x20d0 && code <= 0x20ff) ||
      (code >= 0xfe00 && code <= 0xfe0f) ||
      (code >= 0xfe20 && code <= 0xfe2f) ||
      (code >= 0xe0100 && code <= 0xe01ef)
    )
  }
  const isFullWidthCodePoint = code => {
    return (
      code >= 0x1100 &&
      (code <= 0x115f ||
        code === 0x2329 ||
        code === 0x232a ||
        (code >= 0x2e80 && code <= 0x3247 && code !== 0x303f) ||
        (code >= 0x3250 && code <= 0x4dbf) ||
        (code >= 0x4e00 && code <= 0xa4c6) ||
        (code >= 0xa960 && code <= 0xa97c) ||
        (code >= 0xac00 && code <= 0xd7a3) ||
        (code >= 0xf900 && code <= 0xfaff) ||
        (code >= 0xfe10 && code <= 0xfe19) ||
        (code >= 0xfe30 && code <= 0xfe6b) ||
        (code >= 0xff01 && code <= 0xff60) ||
        (code >= 0xffe0 && code <= 0xffe6) ||
        (code >= 0x1b000 && code <= 0x1b001) ||
        (code >= 0x1f200 && code <= 0x1f251) ||
        (code >= 0x1f300 && code <= 0x1f64f) ||
        (code >= 0x20000 && code <= 0x3fffd))
    )
  }
  function stripVTControlCharacters(str) {
    return RegExpPrototypeSymbolReplace(ansi, str, '')
  }
  return format
}

const makeDebuggeeValue = (d => {
  d = new (globalThis.newGlobal({ newCompartment: true }).Debugger)()
  d.addDebuggee(globalThis)
  d = d.getDebuggees()[0]
  return d.makeDebuggeeValue.bind(d)
})()

const kPending = 0,
  kFulfilled = 1,
  kRejected = 2
const format = createUtilFormat(
  {
    isAsyncFunction(v) {
      return makeDebuggeeValue(v)?.isAsyncFunction
    },
    isGeneratorFunction(v) {
      return makeDebuggeeValue(v)?.isGeneratorFunction
    },
    isArgumentsObject(v) {
      return makeDebuggeeValue(v)?.class === 'Arguments'
    },
    isNativeError(v) {
      return makeDebuggeeValue(v)?.isError
    },
    isPromise(v) {
      return makeDebuggeeValue(v)?.isPromise
    },
  },
  {
    getConstructorName(value) {
      return makeDebuggeeValue(value)['class']
    },
    getPromiseDetails(value) {
      value = makeDebuggeeValue(value)
      const { promiseState } = value
      if (promiseState === 'pending') {
        return [kPending, undefined]
      } else if (promiseState === 'fulfilled') {
        const { promiseValue } = value
        const isObject =
          typeof promiseValue === 'object' && promiseValue !== null
        return [
          kFulfilled,
          isObject ? promiseValue.unsafeDereference() : promiseValue,
        ]
      } else {
        const { promiseReason } = value
        const isObject =
          typeof promiseReason === 'object' && promiseReason !== null
        return [
          kRejected,
          isObject ? promiseReason.unsafeDereference() : promiseReason,
        ]
      }
    },
    kPending,
    kRejected,
    getProxyDetails(value, getFullProxy) {
      value = makeDebuggeeValue(value)
      if (!value.isProxy) return
      const { proxyHandler, proxyTarget } = value
      if (arguments.length === 1 || getFullProxy === true) {
        return [
          proxyTarget?.unsafeDereference(),
          proxyHandler?.unsafeDereference(),
        ]
      }
      return proxyTarget?.unsafeDereference()
    },
  }
)

const { print } = globalThis
const { apply } = Reflect
console.log = (...args) => {
  print(apply(format, undefined, args))
}
