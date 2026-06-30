import ApiUtils from './api.js';

const AiFiller = {
  async getFillSuggestions(fields, userData) {
    const prompt = this.buildPrompt(fields, userData);
    const response = await ApiUtils.callOpenRouter(prompt);
    return this.parseResponse(response, fields);
  },

  buildPrompt(fields, userData) {
    const fieldsInfo = fields.map(f =>
      `- 字段名: ${f.name}, 类型: ${f.type}, 标签: ${f.label || '无'}`
    ).join('\n');

    const userDataInfo = Object.entries(userData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return `表单字段：
${fieldsInfo}

用户数据：
${userDataInfo}

请为每个字段生成填充建议，返回JSON格式：
[
  {"fieldName": "字段名", "suggestion": "建议值", "confidence": 0.9}
]`;
  },

  parseResponse(response, fields) {
    try {
      const suggestions = JSON.parse(response);
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
