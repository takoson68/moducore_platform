export function ensureScript(src, globalKey) {
  return new Promise((resolve, reject) => {
    if (globalKey && window[globalKey]) {
      resolve(window[globalKey])
      return
    }

    const existing = document.querySelector(`script[data-vendor-src="${src}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(globalKey ? window[globalKey] : true), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load script: ${src}`)), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.vendorSrc = src
    script.onload = () => resolve(globalKey ? window[globalKey] : true)
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`))
    document.head.appendChild(script)
  })
}

export function ensureStylesheet(href) {
  const existing = document.querySelector(`link[data-style-href="${href}"]`)
  if (existing) {
    return existing
  }

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  link.dataset.styleHref = href
  document.head.appendChild(link)
  return link
}
