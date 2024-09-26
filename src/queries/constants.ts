import { IS_DEV } from '@/data/config'

export const COMMON_INTERVAL = 10000
export const POOL_QUERY_INTERVAL = 30000
export const ORDER_QUERY_INTERVAL = 3000
export const Activities_QUERY_INTERVAL = 10000
export const Balance_QUERY_INTERVAL = IS_DEV ? false : 10000
