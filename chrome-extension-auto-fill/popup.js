// popup.js
import StorageUtils from './utils/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('api-key');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const profileSelect = document.getElementById('profile-select');
  const manageProfilesBtn = document.getElementById('manage-profiles-btn');
  const detectBtn = document.getElementById('detect-btn');
  const fillBtn = document.getElementById('fill-btn');
  const formList = document.getElementById('form-list');
  const status = document.getElementById('status');

  // 加载API密钥
  const apiKey = await StorageUtils.getApiKey();
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }

  // 加载配置文件
  const profiles = await StorageUtils.getProfiles();
  profiles.forEach(profile => {
    const option = document.createElement('option');
    option.value = profile.name;
    option.textContent = profile.name;
    profileSelect.appendChild(option);
  });

  // 保存API密钥
  saveKeyBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      await StorageUtils.saveApiKey(key);
      status.textContent = 'API密钥已保存';
      status.className = 'success';
    }
  });

  // 检测表单
  detectBtn.addEventListener('click', async () => {
    status.textContent = '正在检测表单...';
    status.className = 'loading';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectForms' });
      
      if (response.forms && response.forms.length > 0) {
        displayForms(response.forms);
        fillBtn.disabled = false;
        status.textContent = `检测到 ${response.forms.length} 个表单`;
        status.className = 'success';
      } else {
        formList.innerHTML = '<p>未检测到表单</p>';
        status.textContent = '未检测到表单';
        status.className = 'error';
      }
    } catch (error) {
      status.textContent = `检测失败: ${error.message}`;
      status.className = 'error';
    }
  });

  // 填充表单
  fillBtn.addEventListener('click', async () => {
    status.textContent = '正在填充表单...';
    status.className = 'loading';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const selectedProfile = profileSelect.value;
      
      if (!selectedProfile) {
        status.textContent = '请先选择配置文件';
        status.className = 'error';
        return;
      }
      
      const profiles = await StorageUtils.getProfiles();
      const profile = profiles.find(p => p.name === selectedProfile);
      
      if (!profile) {
        status.textContent = '配置文件未找到';
        status.className = 'error';
        return;
      }
      
      // 获取表单字段
      const formsResponse = await chrome.tabs.sendMessage(tab.id, { action: 'detectForms' });
      const fields = formsResponse.forms[0].fields;
      
      // 获取AI填充建议
      const suggestionsResponse = await chrome.runtime.sendMessage({
        action: 'getFillSuggestions',
        fields: fields,
        userData: profile.data
      });
      
      if (suggestionsResponse.error) {
        status.textContent = `AI填充失败: ${suggestionsResponse.error}`;
        status.className = 'error';
        return;
      }
      
      // 填充表单
      for (const suggestion of suggestionsResponse.suggestions) {
        await chrome.tabs.sendMessage(tab.id, {
          action: 'fillForm',
          fieldName: suggestion.fieldName,
          value: suggestion.suggestion
        });
      }
      
      status.textContent = '表单填充完成';
      status.className = 'success';
    } catch (error) {
      status.textContent = `填充失败: ${error.message}`;
      status.className = 'error';
    }
  });

  function displayForms(forms) {
    formList.innerHTML = '';
    forms.forEach(form => {
      const formDiv = document.createElement('div');
      formDiv.className = 'form-item';
      formDiv.innerHTML = `
        <h3>表单 ${form.id + 1}</h3>
        <p>字段数: ${form.fields.length}</p>
        <ul>
          ${form.fields.map(field => `
            <li>${field.label || field.name} (${field.type})</li>
          `).join('')}
        </ul>
      `;
      formList.appendChild(formDiv);
    });
  }
});
