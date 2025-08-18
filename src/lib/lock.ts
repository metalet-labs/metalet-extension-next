import hash from 'object-hash'
import useStorage from './storage'
import { IS_DEV } from '@/data/config'
import { notifyBg } from './notify-bg'
import { LAST_LOCK_TIME_KEY, LOCK_KEY } from './storage/key'
import { checkPassword, hasPassword, getEncryptedPassword, setTempPassword } from './password'

const storage = useStorage()

export async function lock() {
  await storage.set(LOCK_KEY, true)
  await notifyBg('lock')()
}

export async function isLocked() {
  if (!(await hasPassword())) {
    return false
  }
  return await storage.get(LOCK_KEY, { defaultValue: false })
}

export async function unlock(password: string) {
  const isCorrect = await checkPassword(password)
  if (!isCorrect) {
    throw new Error('Password incorrect')
  }
  if (!IS_DEV) {
    await notifyBg('setPassword')(password)
  }
  await setTempPassword(password)
  await storage.set(LOCK_KEY, false)
  await notifyBg('unlock')()
}

export async function getLastLockTime() {
  const time = await storage.get(LAST_LOCK_TIME_KEY, { defaultValue: -1 })
  try {
    return Number(time)
  } catch (error) {
    console.error('getLastLockTimeError', error)
    return -1
  }
}

export async function setLastLockTime() {
  return await storage.set(LAST_LOCK_TIME_KEY, Date.now())
}

export async function getPassword(): Promise<string> {
  if (IS_DEV) {
    return (await getEncryptedPassword()) || ''
  } else {
    const password = await notifyBg('getPassword')()

    if (password) {
      return hash(password)
    }
    return password
  }
}
