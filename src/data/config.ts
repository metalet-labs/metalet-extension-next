export const VERSION = '3.4.15'

export const FEEB = 5
export const P2PKH_UNLOCK_SIZE = 1 + 1 + 72 + 1 + 33
export const DERIVE_MAX_DEPTH = 1000

const IS_WINDOWS = /windows/i.test(navigator.userAgent)

export const NOTIFICATION_WIDTH = IS_WINDOWS ? 366 : 360
export const NOTIFICATION_HEIGHT = IS_WINDOWS ? 640 : 630

export const DEBUG = false
export const IS_DEV = process.env.NODE_ENV === 'development'
