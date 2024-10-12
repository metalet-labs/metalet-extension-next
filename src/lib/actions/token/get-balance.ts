import { getTokenBalance } from '@/lib/assets'

export async function process(_: unknown, { password }: { host: string; password: string }) {
  return await getTokenBalance(password)
}
