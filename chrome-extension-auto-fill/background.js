import AiFiller from './utils/ai-filler.js';
import StorageUtils from './utils/storage.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const API_TIMEOUT = 30000;
const MAX_RETRIES = 2;

let pendingRequest = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getFillSuggestions') {
    const { fields, userData } = request;
    if (pendingRequest) {
      return sendResponse({ error: '请求正在进行中，请稍后重试' });
    }
    pendingRequest = Date.now();
    AiFiller.getFillSuggestions(fields, userData)
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

  if (request.type === 'callOpenRouter') {
    handleOpenRouterCall(request.prompt)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function fetchWithTimeout(url, options, timeout = API_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleOpenRouterCall(prompt, retryCount = 0) {
  const apiKey = await StorageUtils.getApiKey();
  if (!apiKey) {
    throw new Error('API密钥未配置，请在设置中添加OpenRouter API密钥');
  }

  try {
    const response = await fetchWithTimeout(OPENROUTER_API_URL, {
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
  } catch (error) {
    if (retryCount < MAX_RETRIES && error.name !== 'AbortError') {
      await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
      return handleOpenRouterCall(prompt, retryCount + 1);
    }
    throw error;
  }
}
