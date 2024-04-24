// import accountManager from '../account'
import { getPublicKey } from '../account'

export async function process(params: any) {
  return await getPublicKey('mvc', params?.path)
}
