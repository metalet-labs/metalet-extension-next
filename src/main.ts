import './style.css'
import i18n from './i18n'
import Main from './Main.vue'
import router from './router'
import { Buffer } from 'buffer'
import tooltip from '@/lib/tooltip'
import { createApp, ref } from 'vue'
// import * as Sentry from '@sentry/vue'
import { IS_DEV } from '@/data/config'
import { notifyBg } from './lib/notify-bg'
import { VueQueryPlugin } from '@tanstack/vue-query'
import Notification from './components/Notification.vue'

const maxRetries = 3

const fetchWithRetry = async (retries = maxRetries) => {
  if (IS_DEV) return
  try {
    return await notifyBg('ping')()
  } catch (error) {
    if (retries > 0) {
      return fetchWithRetry(retries - 1)
    } else {
      console.error('Request failed, maximum retry attempts reached')
      throw error
    }
  }
}

;(async () => {
  await fetchWithRetry()

  // @ts-ignore
  globalThis.Buffer = Buffer

  // @ts-ignore
  globalThis.Buffer = Buffer

  const app = createApp(Main)

  // 全局组件
  app.component('Notification', Notification)

  // 全局状态
  const walletContainer = ref(null)
  app.provide('wallet', walletContainer)
  app.provide('notifying', ref(false))

  // Sentry
  // if (!IS_DEV) {
  //   Sentry.init({
  //     app,
  //     dsn: 'https://f92d053c1f4313c543d17212da499483@o73757.ingest.sentry.io/4506267202879488',
  //     integrations: [
  //       new Sentry.BrowserTracing({
  //         // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
  //         tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
  //         routingInstrumentation: Sentry.vueRouterInstrumentation(router),
  //       }),
  //       new Sentry.Replay(),
  //     ],
  //     // Performance Monitoring
  //     tracesSampleRate: 1.0, // Capture 100% of the transactions
  //     // Session Replay
  //     replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
  //     replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  //   })
  // }

  app.use(i18n)
  app.use(router)
  app.use(VueQueryPlugin)
  app.directive('tooltip', tooltip)
  app.mount('#app')
})()
