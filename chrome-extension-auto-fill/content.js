import FormDetector from './utils/form-detector.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detectForms') {
    const forms = FormDetector.detectForms();
    sendResponse({ forms });
  }
  
  if (request.action === 'fillForm') {
    const { fieldName, value } = request;
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
      field.value = value;
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: '字段未找到' });
    }
  }
  
  return true;
});
