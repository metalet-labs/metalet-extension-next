import hash from 'object-hash'
import CryptoJS from 'crypto-js'
import useStorage from './storage'

export const PASSWORD_KEY = 'password'

const storage = useStorage()

export async function getEncryptedPassword() {
  return await storage.get(PASSWORD_KEY)
}

export async function hasPassword() {
  return !!(await getEncryptedPassword())
}

export async function checkPassword(password: string) {
  const encryptedPassword = await getEncryptedPassword()
  if (encryptedPassword === undefined) {
    return false
  }
  return [hash(password), CryptoJS.SHA256(password).toString()].includes(encryptedPassword)
}

export async function setPassword(password: string) {
  const hashed = CryptoJS.SHA256(password).toString()
  await storage.set(PASSWORD_KEY, hashed)
}

type PasswordManager = {
  has: () => Promise<boolean>
  get: () => Promise<string | undefined>
  set: (password: string) => Promise<void>
  check: (password: string) => Promise<boolean>
}

const passwordManager = {} as PasswordManager
passwordManager.has = hasPassword
passwordManager.get = getEncryptedPassword
passwordManager.set = setPassword
passwordManager.check = checkPassword

export default passwordManager
