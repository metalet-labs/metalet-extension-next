<script lang="ts" setup>
import i18n from '@/i18n'
import { ref, Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import useStorage from '@/lib/storage'
import { LANG_KEY } from '@/lib/storage/key'
import ArrowRightIcon from '@/assets/icons-v3/arrow_right.svg?url'
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue'

const { locale } = useI18n()
const storage = useStorage()

type Language = {
  id: number
  name: string
  type: 'en' | 'zh_CN'
}

const languages = [
  { id: 1, type: 'en', name: i18n.global.t('Language.en') },
  { id: 2, type: 'zh_CN', name: i18n.global.t('Language.zh_CN') },
] as Language[]

const initialed = ref(false)

const selectedLanguage: Ref<Language> = ref(languages[0])

storage.get(LANG_KEY).then((languageType) => {
  selectedLanguage.value = languages.find((language) => language.type === languageType) || languages[0]
  initialed.value = true
})
const select = async (language: Language) => {
  selectedLanguage.value = language

  // 存入存储
  await storage.set(LANG_KEY, language.type)
  locale.value = language.type
}
</script>

<template>
  <Listbox
    :modelValue="selectedLanguage"
    @update:modelValue="(language: Language) => select(language)"
    as="component"
    v-slot="{ open }"
  >
    <div class="relative transition-all duration-200">
      <ListboxButton class="relative flex items-center gap-x-0.5 py-1 hover:text-blue-700">
        <span class="capitalize text-sm text-gray-primary" v-if="initialed">{{ selectedLanguage.name }}</span>
        <img :src="ArrowRightIcon" alt="" />
      </ListboxButton>

      <ListboxOptions class="absolute right-0 mt-1 divide-y divide-gray-100 rounded-md bg-white shadow-md z-10">
        <ListboxOption
          :value="language"
          :key="language.id"
          v-for="language in languages"
          :disabled="selectedLanguage.name === language.name"
          :class="[
            ' px-8 py-4 capitalize whitespace-nowrap',
            selectedLanguage.name === language.name
              ? 'cursor-not-allowed text-blue-500'
              : 'cursor-pointer hover:bg-gray-50 hover:text-blue-500',
          ]"
        >
          {{ language.name }}
        </ListboxOption>
      </ListboxOptions>
    </div>
  </Listbox>
</template>
