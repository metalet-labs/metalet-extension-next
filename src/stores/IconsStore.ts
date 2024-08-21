import { onMounted, ref } from 'vue'
import { createGlobalState } from '@vueuse/core'
import { type Icons, getIcons } from '@/queries/icons'
import { CoinCategory } from '@/queries/exchange-rates'

export const useIconsStore = createGlobalState(() => {
  const icons = ref<Icons>()

  function getIcon(coinCategory: CoinCategory, coinSymbol: string) {
    if (icons) {
      const icon =
        icons.value?.[coinCategory.toLocaleLowerCase()]?.[coinSymbol] ||
        icons.value?.[coinCategory.toLocaleLowerCase()]?.[coinSymbol?.toLocaleLowerCase()]

      if (icon) {
        return `https://www.metalet.space/wallet-api${icon}`
      }
    }
  }

  onMounted(async () => {
    icons.value = await getIcons()
  })

  return {
    getIcon,
  }
})
