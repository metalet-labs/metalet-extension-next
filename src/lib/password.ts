import hash from 'object-hash'
import CryptoJS from 'crypto-js'
import useStorage from './storage'

export const PASSWORD_KEY = 'password'

const storage = useStorage()

export async function getPassword() {
  return await storage.get(PASSWORD_KEY)
}

export async function hasPassword() {
  return !!(await getPassword())
}

export async function checkPassword(credential: string) {
  const password = await getPassword()
  return hash(credential) === password || CryptoJS.SHA256(credential).toString() === password
}

export async function setPassword(password: string) {
  // const hashed = hash(password)
  const hashed = CryptoJS.SHA256(password).toString()
  await storage.set(PASSWORD_KEY, hashed)
}

type PasswordManager = {
  has: () => Promise<boolean>
  get: () => Promise<string | undefined>
  set: (password: string) => Promise<void>
  check: (credential: string) => Promise<boolean>
}
const passwordManager = {} as PasswordManager
passwordManager.has = hasPassword
passwordManager.get = getPassword
passwordManager.set = setPassword
passwordManager.check = checkPassword

export default passwordManager
