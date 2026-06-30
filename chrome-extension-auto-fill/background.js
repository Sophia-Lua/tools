console.log('AI Form Auto-Fill background script loaded');

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'callOpenRouter') {
    handleOpenRouterCall(message.prompt)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function handleOpenRouterCall(prompt) {
  const result = await chrome.storage.local.get('apiKey');
  const apiKey = result.apiKey;

  if (!apiKey) {
    throw new Error('API密钥未设置');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': self.location.origin,
      'X-Title': 'AI Form Auto-Fill'
    },
    body: JSON.stringify({
      model: 'google/gemini-flash-1.5',
      messages: [
        {
          role: 'system',
          content: '你是一个表单填写助手。根据提供的表单字段信息和用户数据，为每个字段生成填充建议。返回JSON格式的建议列表。'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`API调用失败: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
