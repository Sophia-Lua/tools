import AiFiller from './utils/ai-filler.js';

let pendingRequest = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getFillSuggestions') {
    const { fields } = request;
    if (pendingRequest) {
      return sendResponse({ error: '请求正在进行中，请稍后重试' });
    }
    pendingRequest = Date.now();
    AiFiller.getFillSuggestions(fields)
      .then(suggestions => {
        pendingRequest = null;
        sendResponse({ suggestions });
      })
      .catch(error => {
        pendingRequest = null;
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (['detectForms', 'fillForm', 'previewFill'].includes(request.action)) {
    handleTabMessage(request, sendResponse);
    return true;
  }
});

async function handleTabMessage(request, sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    const response = await chrome.tabs.sendMessage(tab.id, request);
    sendResponse(response);
  } catch (error) {
    sendResponse({ error: error.message });
  }
}
