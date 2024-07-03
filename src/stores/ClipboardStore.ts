import { reactive } from 'vue'
import { toast } from '@/components/ui/toast/use-toast'

export const ClipboardStore = reactive({
  copiedText: '',
  copy: async (text: string, title = `Copied`, showContent = true) => {
    try {
      await navigator.clipboard.writeText(text)
      ClipboardStore.copiedText = text
      toast({ title, toastType: 'success', description: showContent ? text : '' })
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  },
})
