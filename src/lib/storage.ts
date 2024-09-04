import { IS_DEV } from '@/data/config'

interface Storage {
  get<T = string>(key: string): Promise<T | undefined>
  get<T = string>(key: string, option: { defaultValue: T }): Promise<T>
  set(key: string, value: any): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
}

let globalStorage: Storage

type StorageType = 'local' | 'session' | 'sync'

function getDevStorage(storageType: StorageType) {
  switch (storageType) {
    case 'local':
      return window.localStorage
    case 'session':
      return window.sessionStorage
    default:
      return window.localStorage
  }
}

// TODO: Implement a real hook, useStorage should be named createStorage
function useStorage(storageType: StorageType = 'local'): Storage {
  if (globalStorage) {
    return globalStorage
  }
  let storage: {
    get: <T>(key: string) => Promise<T | string | undefined>
    set: (key: string, value: string) => Promise<void>
    remove: (key: string) => Promise<void>
    clear: () => Promise<void>
  }
  if (IS_DEV) {
    const _storage = getDevStorage(storageType)
    storage = {
      get: async function (key: string): Promise<string | undefined> {
        return _storage.getItem(key) ?? undefined
      },
      set: async function (key: string, value: string) {
        _storage.setItem(key, value)
      },
      remove: async function (key: string) {
        _storage.removeItem(key)
      },
      clear: async function () {
        _storage.clear()
      },
    }
  } else {
    let extension
    try {
      if (window.browser) {
        extension = window.browser
      } else {
        throw new Error('Object browser is not found.')
      }
    } catch (e) {
      // TODO：Compatible with various browsers
      extension = chrome
    }
    const _storage = extension.storage[storageType]
    storage = {
      get: async function <T>(key: string): Promise<T | undefined> {
        const result = await _storage.get(key)
        return result?.[key] as T
      },
      set: async function (key: string, value: string) {
        await _storage.set({ [key]: value })
      },
      remove: async function (key: string) {
        await _storage.remove(key)
      },
      clear: async function () {
        await _storage.clear()
      },
    }
  }

  globalStorage = {
    async get<T>(key: string, option?: { defaultValue: T }): Promise<T | string | undefined> {
      const value = await storage.get<T>(key)
      if (value === undefined) {
        return option?.defaultValue
      }
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch (error) {
          return value
        }
      }
      return value
    },
    async set(key: string, value: object | string): Promise<void> {
      if (typeof value === 'object') {
        value = JSON.stringify(value)
      }
      return await storage.set(key, value)
    },
    async delete(key: string): Promise<void> {
      return await storage.remove(key)
    },
    async clear(): Promise<void> {
      return await storage.clear()
    },
  }

  return globalStorage
}

export default useStorage
