import FormDetector from './utils/form-detector.js';

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
    return document.querySelector(`[name="${CSS.escape(fieldName)}"]`);
  } catch {
    return document.querySelector(`[name="${fieldName}"]`);
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
