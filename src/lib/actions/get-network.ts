import { getNetwork } from '../network'

export async function process() {
  const network = await getNetwork()
  return { network }
}
