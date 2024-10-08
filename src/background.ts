import hash from 'object-hash'
import { isLocked } from './lib/lock'
import connector from './lib/connector'
import { network } from '@/lib/network'
import actions from './data/query-actions'
import browser from 'webextension-polyfill'
import exActions from './data/extension-actions'
import { getCurrentAccountId } from './lib/account'
import { Chain } from '@metalet/utxo-wallet-service'
import usePasswordStore from '@/stores/PasswordStore'
import { NOTIFICATION_HEIGHT, NOTIFICATION_WIDTH } from './data/config'
import { getCurrentWalletId, hasWallets, getCurrentWallet } from './lib/wallet'
import { getTempPassword } from './lib/password'

// const browser = window.browser as typeof chromex
browser.runtime.onMessage.addListener(async (msg, sender) => {
  const { password, setPassword } = usePasswordStore()
  try {
    if (msg.channel === 'to-bg') {
      if (msg.eventName === 'networkChanged') {
        network.value = msg.args[0]
      } else if (msg.eventName === 'getPassword') {
        let _password = password.value
        if (_password) {
          _password = (await getTempPassword()) ?? ''
        }
        return _password
      } else if (msg.eventName === 'setPassword') {
        if (!msg.args[0]) {
          return { code: 0 }
        } else {
          setPassword(msg.args[0])
          return { code: 1 }
        }
      }
      return
    }

    if (msg.channel === 'inter-metaidwallet') {
      if (msg.eventName === 'lock') {
        return await browser.action.setBadgeText({ text: '🔒' })
      } else if (msg.eventName === 'unlock') {
        return await browser.action.setBadgeText({ text: null })
      }
      return await exActions[msg.fn](...msg.args)
    }

    const actionName = msg.action
      .replace('authorize-', '')
      .replace('query-', '')
      .replace('event-', '')
      .replace('inscribe-', '')
    if (msg.action?.startsWith('query') && actionName === 'Ping') {
      const response = {
        nonce: msg.nonce,
        channel: 'from-metaidwallet',
        action: `respond-${actionName}`,
        host: msg.host as string,
        res: 'pong',
      }
      return response
    }

    const currentWalletId = await getCurrentWalletId()
    const currentAccountId = await getCurrentAccountId()

    // 如果连接状态为未连接，且请求的 action 不是connect或者IsConnected，则返回错误
    let failedStatus: string = ''
    if ((await isLocked()) || !password.value) {
      failedStatus = 'locked'
    } else if (!(await hasWallets())) {
      failedStatus = 'no-wallets'
    } else if (!currentWalletId || !currentAccountId) {
      failedStatus = 'not-logged-in'
    } else if (
      !(await connector.isConnected(currentAccountId, msg.host)) &&
      !['Connect', 'IsConnected', 'ConnectBTC'].includes(actionName)
    ) {
      failedStatus = 'not-connected'
    }

    if (!!failedStatus) {
      const response = {
        nonce: msg.nonce,
        channel: 'from-metaidwallet',
        action: `respond-${actionName}`,
        host: msg.host as string,
        res: {
          status: failedStatus,
        },
      }

      return response
    }

    if (msg.action?.startsWith('inscribe')) {
      if (actionName === 'InscribeTransfer') {
        const rawUrl = 'popup.html#/wallet/inscribe'
        let popupUrl = browser.runtime.getURL(rawUrl)
        const wallet = await getCurrentWallet(Chain.BTC)
        const address = wallet.getAddress()
        popupUrl += `/${msg.params}/${address}`
        let top = 0
        let left = 0
        const lastFocused = await browser.windows.getLastFocused()
        top = lastFocused.top!
        left = lastFocused.left! + lastFocused.width! - NOTIFICATION_WIDTH
        const popupWindow = await browser.windows.create({
          url: popupUrl,
          type: 'popup',
          width: NOTIFICATION_WIDTH,
          height: NOTIFICATION_HEIGHT,
          top,
          left,
        })
      }
      return
    }

    // authorize actions
    if (msg.action?.startsWith('authorize')) {
      const icon = sender.tab?.favIconUrl || msg.icon || ''
      const rawUrl = 'popup.html#authorize'
      // 拼接授权页的参数
      const params = new URLSearchParams()
      params.append('host', msg.host)
      params.append('icon', icon)
      params.append('actionName', actionName)
      params.append('nonce', msg.nonce)
      params.append('params', JSON.stringify(msg.params))

      // 在弹窗创建前，先存储发起请求的tab id
      if (sender.tab?.id) {
        params.append('tabId', sender.tab.id.toString())
      }

      let popupUrl = browser.runtime.getURL(rawUrl)
      popupUrl += `?${params.toString()}`

      // To avoid repeating pop-ups of 'sign btc message'
      let isClose = false
      const tabs = await browser.tabs.query({ active: true })
      tabs.forEach((tab) => {
        isClose =
          (tab.url?.includes('actionName=SignBTCMessage') || false) &&
          (tab.url?.includes(`params=%22${msg.params}%22`) || false)
      })
      if (isClose) {
        return
      }

      let top = 0
      let left = 0
      const lastFocused = await browser.windows.getLastFocused()
      top = lastFocused.top!
      left = lastFocused.left! + lastFocused.width! - NOTIFICATION_WIDTH
      // open authorize page in a popup window
      const popupWindow = await browser.windows.create({
        url: popupUrl,
        type: 'popup',
        width: NOTIFICATION_WIDTH,
        height: NOTIFICATION_HEIGHT,
        top,
        left,
      })

      if (popupWindow.id) {
        // 给弹出窗口的关闭事件添加监听，如果用户关闭了弹窗，则返回取消
        browser.windows.onRemoved.addListener(async (windowId) => {
          if (windowId === popupWindow.id) {
            // 发送消息给 content-script-tab
            const tab = (
              await browser.tabs.query({
                active: true,
                windowType: 'normal',
              })
            ).find((tab) => tab.id === Number(sender.tab?.id))
            if (tab?.id) {
              const response = {
                nonce: msg.nonce,
                channel: 'from-metaidwallet',
                action: `respond-${actionName}`,
                host: msg.host as string,
                res: {
                  status: 'canceled',
                },
              }
              browser.tabs.sendMessage(tab.id, response)
            }
          }
        })
      }

      return true
    }

    // query actions
    if (msg.action?.startsWith('query')) {
      // call corresponding process function
      const action = actions[actionName]
      if (action) {
        const processed = await action.process(msg.params, {
          host: msg.host,
          password: hash(password.value),
        })

        const response = {
          nonce: msg.nonce,
          channel: 'from-metaidwallet',
          action: `respond-${actionName}`,
          host: msg.host as string,
          res: processed,
        }

        return response
      }
    }

    return true
  } catch (error) {
    console.error('browser.runtime.onMessage', error)
  }
})
