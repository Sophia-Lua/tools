// popup.js
import StorageUtils from './utils/storage.js';

function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', async () => {
  const providerSelect = document.getElementById('provider-select');
  const apiKeyInput = document.getElementById('api-key');
  const saveKeyBtn = document.getElementById('save-key-btn');
  const modelSelect = document.getElementById('model-select');
  const modelInput = document.getElementById('model-input');
  const detectBtn = document.getElementById('detect-btn');
  const getSuggestionsBtn = document.getElementById('get-suggestions-btn');
  const fillBtn = document.getElementById('fill-btn');
  const previewBtn = document.getElementById('preview-btn');
  const fillActions = document.getElementById('fill-actions');
  const formList = document.getElementById('form-list');
  const status = document.getElementById('status');

  const PROVIDER_MODELS = {
    zhipu: ['GLM-4.7-Flash', 'GLM-4.5-Flash', 'GLM-4-Air', 'GLM-4'],
    siliconflow: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen2.5-7B-Instruct', 'THUDM/glm-4-9b-chat']
  };

  let detectedForms = null;
  let currentSuggestions = null;

  // 切换服务商时更新模型选项
  providerSelect.addEventListener('change', () => {
    const provider = providerSelect.value;
    const models = PROVIDER_MODELS[provider];
    if (models) {
      modelSelect.innerHTML = '';
      models.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        modelSelect.appendChild(opt);
      });
      modelSelect.style.display = '';
      modelInput.style.display = 'none';
    } else {
      modelSelect.style.display = 'none';
      modelInput.style.display = '';
    }
  });

  // 加载已保存的设置
  const provider = await StorageUtils.getProvider();
  providerSelect.value = provider;
  providerSelect.dispatchEvent(new Event('change'));

  const apiKey = await StorageUtils.getApiKey();
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }

  const model = await StorageUtils.getModel();
  if (model) {
    const presetModels = PROVIDER_MODELS[provider];
    if (presetModels && presetModels.includes(model)) {
      modelSelect.value = model;
    } else if (presetModels) {
      modelSelect.style.display = 'none';
      modelInput.style.display = '';
      modelInput.value = model;
    } else {
      modelInput.value = model;
    }
  }

  // 保存服务商 + API密钥
  saveKeyBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();
    const prov = providerSelect.value;
    await StorageUtils.saveProvider(prov);

    // 自动保存模型
    let modelValue;
    if (prov === 'zhipu' && modelSelect.style.display !== 'none') {
      modelValue = modelSelect.value;
    } else {
      modelValue = modelInput.value.trim();
    }
    if (modelValue) {
      await StorageUtils.saveModel(modelValue);
    }

    if (key) {
      await StorageUtils.saveApiKey(key);
      status.textContent = '设置已保存';
      status.className = 'success';
    } else {
      status.textContent = '服务商已切换';
      status.className = 'success';
    }
  });

  // 检测表单
  detectBtn.addEventListener('click', async () => {
    status.textContent = '正在检测表单...';
    status.className = 'loading';

    try {
      const response = await chrome.runtime.sendMessage({ action: 'detectForms' });

      if (response.forms && response.forms.length > 0) {
        detectedForms = response.forms;
        currentSuggestions = null;
        displayForms(response.forms, null);
        getSuggestionsBtn.disabled = false;
        fillActions.style.display = 'none';
        status.textContent = `检测到 ${response.forms.length} 个表单`;
        status.className = 'success';
      } else {
        formList.innerHTML = '<p>未检测到表单</p>';
        detectedForms = null;
        currentSuggestions = null;
        getSuggestionsBtn.disabled = true;
        fillActions.style.display = 'none';
        status.textContent = '未检测到表单';
        status.className = 'error';
      }
    } catch (error) {
      status.textContent = `检测失败: ${error.message}`;
      status.className = 'error';
    }
  });

  // 获取AI建议
  getSuggestionsBtn.addEventListener('click', async () => {
    status.textContent = '正在获取AI建议...';
    status.className = 'loading';

    try {
      const currentModel = await StorageUtils.getModel();
      if (!currentModel) {
        status.textContent = '请先配置模型ID';
        status.className = 'error';
        return;
      }

      const fields = detectedForms[0].fields;

      const suggestionsResponse = await chrome.runtime.sendMessage({
        action: 'getFillSuggestions',
        fields: fields
      });

      if (suggestionsResponse.error) {
        status.textContent = `AI建议获取失败: ${suggestionsResponse.error}`;
        status.className = 'error';
        return;
      }

      currentSuggestions = suggestionsResponse.suggestions;
      displayForms(detectedForms, currentSuggestions);
      fillActions.style.display = 'flex';
      status.textContent = 'AI建议已获取，请检查并编辑后填充';
      status.className = 'success';
    } catch (error) {
      status.textContent = `获取建议失败: ${error.message}`;
      status.className = 'error';
    }
  });

  // 直接填充
  fillBtn.addEventListener('click', async () => {
    status.textContent = '正在填充表单...';
    status.className = 'loading';

    try {
      const suggestions = getSuggestionsFromUI();

      if (suggestions.length === 0) {
        status.textContent = '没有可填充的字段';
        status.className = 'error';
        return;
      }

      for (const suggestion of suggestions) {
        await chrome.runtime.sendMessage({
          action: 'fillForm',
          fieldName: suggestion.fieldName,
          value: suggestion.value
        });
      }

      status.textContent = '表单填充完成';
      status.className = 'success';
    } catch (error) {
      status.textContent = `填充失败: ${error.message}`;
      status.className = 'error';
    }
  });

  // 预览模式
  previewBtn.addEventListener('click', async () => {
    status.textContent = '正在预览填充...';
    status.className = 'loading';

    try {
      const suggestions = getSuggestionsFromUI();

      if (suggestions.length === 0) {
        status.textContent = '没有可预览的字段';
        status.className = 'error';
        return;
      }

      for (const suggestion of suggestions) {
        await chrome.runtime.sendMessage({
          action: 'previewFill',
          fieldName: suggestion.fieldName,
          value: suggestion.value
        });
      }

      status.textContent = '预览模式已激活，表单字段已高亮显示';
      status.className = 'success';
    } catch (error) {
      status.textContent = `预览失败: ${error.message}`;
      status.className = 'error';
    }
  });

  function getSuggestionsFromUI() {
    const suggestions = [];
    const inputs = formList.querySelectorAll('.suggestion-input');
    inputs.forEach(input => {
      suggestions.push({
        fieldName: input.dataset.fieldName,
        value: input.value
      });
    });
    return suggestions;
  }

  function displayForms(forms, suggestions) {
    formList.innerHTML = '';
    forms.forEach((form, formIndex) => {
      const formDiv = document.createElement('div');
      formDiv.className = 'form-item';

      const fieldsHTML = form.fields.map((field, fieldIndex) => {
        const suggestion = suggestions ? suggestions[fieldIndex] : null;
        const suggestionValue = suggestion ? suggestion.suggestion : '';
        const displayType = field.type === 'text' ? '文本' :
                           field.type === 'email' ? '邮箱' :
                           field.type === 'tel' ? '电话' :
                           field.type === 'number' ? '数字' :
                           field.type === 'select' ? '下拉选择' :
                           field.type === 'checkbox' ? '复选框' :
                           field.type === 'radio' ? '单选' :
                           field.type === 'textarea' ? '文本域' : field.type;

        if (suggestions) {
          return `
            <div class="field-item">
              <div class="field-info">
                <span class="field-name">${escapeHTML(field.label || field.name)}</span>
                <span class="field-type">(${escapeHTML(displayType)})</span>
              </div>
              <input type="text"
                     class="suggestion-input"
                     value="${escapeHTML(suggestionValue)}"
                     data-field-name="${escapeHTML(field.name)}"
                     placeholder="输入填充内容">
            </div>
          `;
        } else {
          return `
            <div class="field-item">
              <div class="field-info">
                <span class="field-name">${escapeHTML(field.label || field.name)}</span>
                <span class="field-type">(${escapeHTML(displayType)})</span>
              </div>
            </div>
          `;
        }
      }).join('');

      formDiv.innerHTML = `
        <h3>表单 ${formIndex + 1}</h3>
        <p>字段数: ${form.fields.length}</p>
        <div class="fields-container">
          ${fieldsHTML}
        </div>
      `;
      formList.appendChild(formDiv);
    });
  }
});
