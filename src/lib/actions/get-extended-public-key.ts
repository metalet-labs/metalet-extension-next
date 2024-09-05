import { getXPublicKey } from '../account'

export async function process(_: unknown, { password }: { password: string }) {
  return await getXPublicKey(password)
}
