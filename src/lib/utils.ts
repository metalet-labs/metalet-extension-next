import router from '@/router'
import { IS_DEV } from '@/data/config'
import { twMerge } from 'tailwind-merge'
import { type ClassValue, clsx } from 'clsx'
import { NOTIFICATION_HEIGHT, NOTIFICATION_WIDTH } from '@/data/config'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'

export const goToPage = (path: string, created = false) => {
  if (IS_DEV || !created) {
    router.push(path)
  } else {
    const browser = window.browser
    browser.windows.create({
      url: browser.runtime.getURL('popup.html#' + path),
      type: 'popup',
      width: NOTIFICATION_WIDTH,
      height: NOTIFICATION_HEIGHT,
      top: 0,
      left: 0,
    })
    window.close()
  }
}

export const goToTab = (path: string, created = false) => {
  if (IS_DEV || !created) {
    router.push(path)
  } else {
    window.open(`${window.location.href.split('#')[0]}#${path}`, '_blank')
    window.close()
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function prettyTimestamp(timestamp: number, isInSeconds = false, cutThisYear = false) {
  if (isInSeconds) timestamp = timestamp * 1000

  if (cutThisYear) return dayjs(timestamp).format('MM-DD HH:mm:ss')

  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

export const formatUnitToBtc = (value: number | string, decimal: number = 8) => {
  if (!value) {
    return 0
  }
  return new Decimal(value).div(10 ** decimal).toNumber()
}
