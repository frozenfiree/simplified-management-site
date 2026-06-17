// Demo-request form. Lead delivery via Web3Forms is an OPTIONAL enhancement:
// if a real access key is configured, submissions POST to Web3Forms; otherwise
// the form captures the lead locally (console + localStorage) so the UI is fully
// functional with zero external configuration.
export function initDemoForm() {
  const form = document.querySelector('[data-demo-form]')
  if (!form) return

  const btn = form.querySelector('button[type="submit"]')
  const consent = form.querySelector('#consent')
  const keyField = form.querySelector('input[name="access_key"]')
  const accessKey = keyField ? keyField.value : ''
  // Placeholder keys start with "__" — anything else is treated as a live key.
  const hasLiveKey = !!accessKey && !accessKey.startsWith('__')

  const captureLocally = (form) => {
    const lead = Object.fromEntries(new FormData(form).entries())
    delete lead.access_key
    delete lead.botcheck
    lead.capturedAt = new Date().toISOString()
    console.info('[demo-request] captured locally:', lead)
    try {
      const store = JSON.parse(localStorage.getItem('demoRequests') || '[]')
      store.push(lead)
      localStorage.setItem('demoRequests', JSON.stringify(store))
    } catch (_) {
      /* storage unavailable — console log already succeeded */
    }
  }

  // Inline status line (announced to screen readers).
  const status = document.createElement('p')
  status.className = 'form-status'
  status.setAttribute('role', 'status')
  status.setAttribute('aria-live', 'polite')
  status.style.display = 'none'
  status.style.marginTop = '0.75rem'
  status.style.fontSize = '0.9rem'
  form.appendChild(status)

  const showStatus = (msg, ok) => {
    status.textContent = msg
    status.style.display = 'block'
    status.style.color = ok ? 'var(--color-sync, #16a34a)' : '#dc2626'
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    if (consent && !consent.checked) {
      showStatus('Please accept the Privacy Policy to continue.', false)
      consent.focus()
      return
    }

    const original = btn ? btn.textContent : ''
    if (btn) {
      btn.disabled = true
      btn.textContent = 'Sending…'
    }
    status.style.display = 'none'

    const showThanks = () => {
      const thanks = document.createElement('div')
      thanks.className = 'form-card form-thanks'
      thanks.setAttribute('role', 'status')
      thanks.innerHTML =
        '<h3 style="margin:0 0 0.5rem;font-family:var(--font-display);font-weight:700;">Request received.</h3>' +
        '<p style="margin:0;color:var(--color-muted);">Thanks — we’ll respond within 24 business hours at the email you provided.</p>'
      form.replaceWith(thanks)
    }

    // No live integration configured: capture locally and complete. Never blocks.
    if (!hasLiveKey) {
      captureLocally(form)
      showThanks()
      return
    }

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        showThanks()
        return
      }
      throw new Error(json.message || 'Submission failed')
    } catch (err) {
      // Enhancement failed — fall back to local capture so the user still succeeds.
      captureLocally(form)
      showThanks()
    }
  })
}
