const createTooltip = (el, value) => {
  const tooltipEl = document.createElement('div')
  tooltipEl.classList.add('tooltip')
  tooltipEl.textContent = value
  document.body.appendChild(tooltipEl)

  const update = () => {
    const rect = el.getBoundingClientRect()
    tooltipEl.style.left = `${rect.left + rect.width / 2 + 14}px`
    tooltipEl.style.top = `${rect.top + rect.height}px`
  }

  const show = () => {
    update()
    tooltipEl.style.opacity = '1'
    tooltipEl.style.visibility = 'visible'
  }

  const hide = () => {
    tooltipEl.style.opacity = '0'
    tooltipEl.style.visibility = 'hidden'
  }

  el.addEventListener('mouseenter', show)
  el.addEventListener('mouseleave', hide)

  el._tooltip = {
    instance: tooltipEl,
    update,
    show,
    hide,
  }
}

const unmountTooltip = (el) => {
  if (el._tooltip) {
    el.removeEventListener('mouseenter', el._tooltip.show)
    el.removeEventListener('mouseleave', el._tooltip.hide)
    document.body.removeChild(el._tooltip.instance)
    delete el._tooltip
  }
}

export default {
  mounted(el, binding) {
    createTooltip(el, binding.value)
  },
  unmounted(el) {
    unmountTooltip(el)
  },
  updated(el, binding) {
    if (binding.value !== binding.oldValue) {
      unmountTooltip(el)
      createTooltip(el, binding.value)
    }
  },
}
