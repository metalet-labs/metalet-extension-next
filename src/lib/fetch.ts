import { network } from './network'
import { getCredential } from '@/lib/account'
import { API2_ORDERS_EXCHANGE, swap } from '@/data/hosts'

export type ApiOptions = { headers?: HeadersInit } & RequestInit & {
    auth?: boolean
  }

async function fetchWrapper(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(url, options)
  if (!response.ok) {
    if (response.status === 422 || response.status === 403) {
      const jsoned = await response.json()

      throw new Error(jsoned.message)
    }

    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return await response.json()
}

export default fetchWrapper

export async function ordersCommonApiFetch(url: string, options?: ApiOptions) {
  const ordersApiUrl = `https://www.orders.exchange/api-book/common/${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  if (options.auth) {
    const { publicKey, signature } = await getCredential({ message: 'orders.exchange' })

    options.headers = {
      ...options.headers,
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    }
  }

  const jsoned: {
    code: number
    message: string
    data: any
  } = await fetchWrapper(ordersApiUrl, options)

  if (jsoned.code === 1) {
    throw new Error(jsoned.message)
  }

  return jsoned.data
}

export async function ordersV2Fetch(url: string, options?: ApiOptions) {
  const ordersApiUrl = `https://www.orders.exchange/api-book/brc20/order-v2/${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  if (options.auth) {
    const { publicKey, signature } = await getCredential({ message: 'orders.exchange' })

    options.headers = {
      ...options.headers,
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    }
  }

  const jsoned: {
    code: number
    message: string
    data: any
  } = await fetchWrapper(ordersApiUrl, options)

  if (jsoned.code === 1) {
    throw new Error(jsoned.message)
  }

  return jsoned.data
}

export async function ordersApiFetch(url: string, options?: ApiOptions) {
  const ordersApiUrl = `https://www.orders.exchange/api-book/brc20/${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  if (options.auth) {
    const { publicKey, signature } = await getCredential({ message: 'orders.exchange' })

    options.headers = {
      ...options.headers,
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    }
  }

  const jsoned: {
    code: number
    message: string
    data: any
  } = await fetchWrapper(ordersApiUrl, options)

  if (jsoned.code === 1) {
    throw new Error(jsoned.message)
  }

  return jsoned.data
}

export async function swapApiFetch(url: string, options?: ApiOptions) {
  const swapApiUrl = `${swap}/${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  if (options.auth) {
    const { publicKey, signature } = await getCredential({ message: 'orders.exchange' })

    options.headers = {
      ...options.headers,
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    }
  }

  const jsoned:
    | {
        status: 'ok'
        data: any
      }
    | {
        status: 'error'
        message: string
      } = await fetchWrapper(swapApiUrl, options)

  if (jsoned.status === 'error') {
    throw new Error(jsoned.message)
  }

  return jsoned.data
}

export async function bridgeApiFetch(
  url: string,
  options?: { headers?: HeadersInit } & RequestInit,
  returnRaw: boolean = false
) {
  const baseUrl = import.meta.env.VITE_HOST_BRIDGE || 'https://api.orders.exchange/api-bridge'
  const ordersApiUrl = `${baseUrl}${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  // if (options?.auth) {
  //   const credentialsStore = useCredentialsStore()
  //   const credential = credentialsStore.get
  //   if (!credential) {
  //     throw new Error('Please login first.')
  //   }

  //   options.headers = {
  //     ...options.headers,
  //     'X-Signature': credential.signature,
  //     'X-Public-Key': credential.publicKey,
  //   }
  // }

  const jsoned:
    | {
        status: 'ok'
        data: any
        success?: boolean
      }
    | {
        status: 'error'
        message: string
        success?: boolean
      } = await fetchWrapper(ordersApiUrl, options)

  if (jsoned.status === 'error') {
    throw new Error(jsoned.message)
  }

  return jsoned.data ?? jsoned
}

export async function metasvApiFetch(
  url: string,
  options?: { headers?: HeadersInit } & RequestInit,
  returnRaw: boolean = false
) {
  const ordersApiUrl = `${import.meta.env.VITE_MVC_API_HOST}${url}` //`https://mainnet.mvcapi.com${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  // if (options?.auth) {
  //   const credentialsStore = useCredentialsStore()
  //   const credential = credentialsStore.get
  //   if (!credential) {
  //     throw new Error('Please login first.')
  //   }

  //   options.headers = {
  //     ...options.headers,
  //     'X-Signature': credential.signature,
  //     'X-Public-Key': credential.publicKey,
  //   }
  // }

  const jsoned:
    | {
        status: 'ok'
        data: any
      }
    | {
        status: 'error'
        message: string
      } = await fetchWrapper(ordersApiUrl, options)

  if (jsoned.status === 'error') {
    throw new Error(jsoned.message)
  }

  return jsoned.data ?? jsoned
}

export async function originalFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, options)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return response
}

export async function proxyApiFetch(url: string, options?: ApiOptions) {
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  if (options.auth) {
    const { publicKey, signature } = await getCredential({ message: 'orders.exchange' })

    options.headers = {
      ...options.headers,
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    }
  }

  const jsoned: {
    code: number
    msg: string
    data: any
  } = await fetchWrapper(`${API2_ORDERS_EXCHANGE}/${url}`, options)

  if (jsoned.code !== 0) {
    throw new Error(jsoned.msg)
  }

  return jsoned.data
}

export async function ordersV3Fetch(url: string, options?: ApiOptions) {
  const prefix = network.value === 'mainnet' ? 'api-book' : 'api-book-testnet'
  const ordersApiUrl = `https://www.orders.exchange/${prefix}/${url}`
  if (!options)
    options = {
      headers: {
        'Content-Type': 'application/json',
      },
    }

  if (options.headers && 'Content-Type' in options.headers) {
  } else {
    options.headers = { ...options.headers, 'Content-Type': 'application/json' }
  }
  if (options.auth) {
    const { publicKey, signature } = await getCredential({ message: 'orders.exchange' })

    options.headers = {
      ...options.headers,
      'X-Signature': signature,
      'X-Public-Key': publicKey,
    }
  }

  const jsoned: {
    code: number
    message: string
    data: any
  } = await fetchWrapper(ordersApiUrl, options)

  if (jsoned.code === 1) {
    throw new Error(jsoned.message)
  }

  return jsoned.data
}
