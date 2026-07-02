import ApiUtils from './api.js';

const AiFiller = {
  async getFillSuggestions(fields) {
    const prompt = this.buildPrompt(fields);
    const response = await ApiUtils.callOpenRouter(prompt);
    return this.parseResponse(response, fields);
  },

  buildPrompt(fields) {
    const fieldsInfo = fields.map(f =>
      `- 字段名: ${f.name}, 类型: ${f.type}, 标签: ${f.label || '无'}, placeholder: ${f.placeholder || '无'}`
    ).join('\n');

    return `你是一个表单自动填写助手。请根据以下表单字段信息，为每个字段生成合理的填充建议。
要求：根据字段名、类型、标签和placeholder推断合理的填充值，使用中文填写（如果适用）。

表单字段：
${fieldsInfo}

请为每个字段生成填充建议，返回JSON格式：
[
  {"fieldName": "字段名", "suggestion": "建议值", "confidence": 0.9}
]`;
  },

  parseResponse(response, fields) {
    try {
      let text = response.trim();
      // 去掉 markdown 代码块包裹
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '');
      }
      const suggestions = JSON.parse(text);
      return fields.map(field => {
        const suggestion = suggestions.find(s => s.fieldName === field.name);
        return {
          fieldName: field.name,
          suggestion: suggestion ? suggestion.suggestion : '',
          confidence: suggestion ? suggestion.confidence : 0
        };
      });
    } catch (error) {
      console.error('解析AI响应失败:', error);
      return fields.map(field => ({
        fieldName: field.name,
        suggestion: '',
        confidence: 0
      }));
    }
  }
};

export default AiFiller;
