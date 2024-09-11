import en from './_locales/en'
import zh_CN from './_locales/zh_CN'
import { createI18n } from 'vue-i18n'

const messages = {
  en,
  zh_CN,
}

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages,
})

export default i18n
