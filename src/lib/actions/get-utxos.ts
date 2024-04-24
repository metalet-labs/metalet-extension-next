import { getUtxos } from '../account'

export async function process(params: any) {
  return await getUtxos('mvc', params)
}
