/**
 * Sign message with DOGE wallet
 */

import { getDogeWallet } from './wallet'

interface SignMessageParams {
  message: string
  encoding?: BufferEncoding
}

export async function process(params: SignMessageParams | string): Promise<string> {
  const wallet = await getDogeWallet()
  
  // Handle both object params and string params for compatibility
  const message = typeof params === 'string' ? params : params.message
  const encoding = typeof params === 'string' ? 'base64' : (params.encoding || 'base64')
  
  return wallet.signMessage(message, encoding)
}
