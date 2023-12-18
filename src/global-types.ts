type SuccessResult = {
  status: 'success'
  txId: string
  recipient: string
  amount: number
  token: {
    symbol: string
    decimal: number
  }
}
type FailedResult = {
  status: 'failed'
  message: string
}
type WarningResult = {
  status: 'warning'
  message: string
}
export type TransactionResult = SuccessResult | FailedResult | WarningResult
