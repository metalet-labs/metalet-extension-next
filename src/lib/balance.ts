import gsap from 'gsap'
import { ref, watch } from 'vue'
import { type Chain } from './types'

// refactor to global state

interface Asset {
  chain: Chain
  name: string
  value: number
}

export const assetList = ref<Asset[]>([])

export const totalBalance = ref(0)

watch(
  assetList,
  (newAssetList) => {
    gsap.to(totalBalance, {
      value: newAssetList.reduce((sum, asset) => sum + (asset.value || 0), 0),
      duration: 0.3,
    })
  },
  { deep: true }
)

export const resetAssetList = () => {
  assetList.value = []
}

export async function updateAsset(asset: Asset) {
  const preAsset = assetList.value.find((assetItem) => assetItem.name === asset.name && assetItem.chain === asset.chain)
  if (!preAsset) {
    assetList.value.push(asset)
  } else {
    preAsset.value = asset.value
  }
}
