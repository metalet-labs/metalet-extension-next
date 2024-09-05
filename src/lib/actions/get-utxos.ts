import { getUtxos } from '../account'

export async function process(params: any, { password }: { password: string }) {
  return await getUtxos('mvc', params, password)
}
