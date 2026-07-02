(function() {
  if (window.__aiFormAutoFillInjected) return;
  window.__aiFormAutoFillInjected = true;

  const FormDetector = {
    detectForms() {
      const forms = document.querySelectorAll('form');
      return Array.from(forms).map((form, index) => ({
        id: index,
        action: form.getAttribute('action') || '',
        method: form.getAttribute('method') || '',
        fields: this.getFormFields(form)
      }));
    },

    getFormFields(form) {
      const fields = form.querySelectorAll('input, select, textarea');
      return Array.from(fields).map(field => this.getFieldInfo(field));
    },

    getFieldInfo(field) {
      const label = this.getFieldLabel(field);
      const tagName = field.tagName.toLowerCase();
      let type = tagName;
      if (tagName === 'input') {
        type = field.type || 'text';
      }
      return {
        name: field.name || field.id || '',
        type: type,
        label: label,
        placeholder: field.placeholder || '',
        required: field.required,
        value: field.value || ''
      };
    },

    getFieldLabel(field) {
      if (field.id) {
        const label = document.querySelector(`label[for="${field.id}"]`);
        if (label) return label.textContent.trim();
      }

      const parentLabel = field.closest('label');
      if (parentLabel) return parentLabel.textContent.trim();

      const previousElement = field.previousElementSibling;
      if (previousElement && previousElement.tagName === 'LABEL') {
        return previousElement.textContent.trim();
      }

      return '';
    }
  };

  let formCache = null;
  let cacheTimestamp = 0;
  const CACHE_TTL = 5000;
  let debounceTimer = null;

  function getCachedForms() {
    const now = Date.now();
    if (formCache && (now - cacheTimestamp) < CACHE_TTL) {
      return formCache;
    }
    formCache = FormDetector.detectForms();
    cacheTimestamp = now;
    return formCache;
  }

  function findField(fieldName) {
    try {
      let el = document.querySelector(`[name="${CSS.escape(fieldName)}"]`);
      if (el) return el;
      el = document.querySelector(`#${CSS.escape(fieldName)}`);
      if (el) return el;
      return null;
    } catch {
      return document.querySelector(`[name="${fieldName}"]`) || document.querySelector(`#${fieldName}`) || null;
    }
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'detectForms') {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        const forms = getCachedForms();
        sendResponse({ forms });
      }, 50);
      return true;
    }

    if (request.action === 'fillForm') {
      const { fieldName, value } = request;
      const field = findField(fieldName);
      if (field) {
        const tagName = field.tagName.toLowerCase();
        const type = field.type ? field.type.toLowerCase() : '';

        if (type === 'checkbox') {
          field.checked = value === 'true' || value === '1' || value === 'on';
        } else if (type === 'radio') {
          const radioGroup = document.querySelectorAll(`[name="${CSS.escape(fieldName)}"]`);
          radioGroup.forEach(radio => {
            if (radio.value === value) {
              radio.checked = true;
            }
          });
        } else if (tagName === 'select') {
          const options = field.querySelectorAll('option');
          for (const option of options) {
            if (option.value === value || option.textContent.trim() === value) {
              field.value = option.value;
              break;
            }
          }
        } else {
          field.value = value;
        }

        field.dispatchEvent(new Event('input', { bubbles: true }));
        field.dispatchEvent(new Event('change', { bubbles: true }));
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: '字段未找到' });
      }
      return true;
    }

    if (request.action === 'previewFill') {
      const { fieldName, value } = request;
      const field = findField(fieldName);
      if (field) {
        field.style.backgroundColor = '#FFF9C4';
        field.style.border = '2px solid #FFC107';
        field.title = `预览: ${value}`;
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: '字段未找到' });
      }
      return true;
    }

    return true;
  });
})();
