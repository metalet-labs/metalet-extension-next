import dayjs from 'dayjs'

export const prettifyTimestamp = (timestamp: number, format = 'YYYY-MM-DD HH:mm:ss') => {
  return dayjs(timestamp).format(format)
}

export const prettifyTxId = (txId: string) => {
  return `${txId.slice(0, 6)}...${txId.slice(-6)}`
}

export const prettifyBalance = (balance: number): string => {
  if (!balance) return '--'
  const total = balance

  // 如果小于 1000000，则使用sats为单位
  if (total < 1e6) return `${total} sats`

  // 否则使用SPACE为单位
  return `${(total / 1e8).toFixed(8)} SPACE`
}

export const prettifyTokenBalance = (balance: number, decimal: number, useRound = false): string => {
  // If useRound is true, then round the balance
  if (useRound) {
    const roundedBalance = Math.round(balance / 10 ** decimal)
    if (roundedBalance === 0) return '< 1'

    return `≈ ${roundedBalance}`
  }

  // 小数点多于8位，则只显示约等于4位小数
  if (decimal > 8) return `≈ ${(balance / 10 ** decimal).toFixed(4)}`

  // If every decimal is 0, then do not show decimal
  if (balance % 10 ** decimal === 0) return `${balance / 10 ** decimal}`

  return `${(balance / 10 ** decimal).toFixed(decimal)}`
}

export const prettifyTokenGenesis = (genesis: string) => {
  return `${genesis.slice(0, 6)}...${genesis.slice(-6)}`
}

export const shortestAddress = (address: string) => {
  return `${address.slice(0, 4)}...${address.slice(-4)}`
}
