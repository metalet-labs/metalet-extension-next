import assetsManager from '../../assets'

export async function process() {
  return await assetsManager.getTokenBalance()
}
