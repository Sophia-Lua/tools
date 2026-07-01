import AiFiller from './utils/ai-filler.js';
import StorageUtils from './utils/storage.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getFillSuggestions') {
    const { fields, userData } = request;
    AiFiller.getFillSuggestions(fields, userData)
      .then(suggestions => sendResponse({ suggestions }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }

  if (request.type === 'callOpenRouter') {
    handleOpenRouterCall(request.prompt)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleOpenRouterCall(prompt) {
  const apiKey = await StorageUtils.getApiKey();
  if (!apiKey) {
    throw new Error('API密钥未配置，请在设置中添加OpenRouter API密钥');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': chrome.runtime.getURL(''),
      'X-Title': 'AI Form Auto-Fill'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-001',
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API请求失败: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
