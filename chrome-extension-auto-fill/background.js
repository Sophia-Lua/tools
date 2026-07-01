import AiFiller from './utils/ai-filler.js';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getFillSuggestions') {
    const { fields, userData } = request;
    AiFiller.getFillSuggestions(fields, userData)
      .then(suggestions => sendResponse({ suggestions }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});
