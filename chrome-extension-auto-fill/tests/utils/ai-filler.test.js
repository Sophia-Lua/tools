import AiFiller from '../../utils/ai-filler.js';
import ApiUtils from '../../utils/api.js';

jest.mock('../../utils/api.js', () => ({
  __esModule: true,
  default: {
    callOpenRouter: jest.fn()
  }
}));

describe('AiFiller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should get fill suggestions from API', async () => {
    const fields = [
      { name: 'name', type: 'text', label: '姓名', placeholder: '请输入姓名' },
      { name: 'email', type: 'email', label: '邮箱', placeholder: '请输入邮箱' }
    ];

    ApiUtils.callOpenRouter.mockResolvedValue(JSON.stringify([
      { fieldName: 'name', suggestion: '张三', confidence: 0.95 },
      { fieldName: 'email', suggestion: 'zhangsan@example.com', confidence: 0.9 }
    ]));

    const suggestions = await AiFiller.getFillSuggestions(fields);
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBe(fields.length);
    expect(suggestions[0].fieldName).toBe('name');
    expect(suggestions[0].suggestion).toBe('张三');
    expect(suggestions[1].fieldName).toBe('email');
    expect(suggestions[1].suggestion).toBe('zhangsan@example.com');
  });

  it('should handle API parse failure gracefully', async () => {
    const fields = [
      { name: 'name', type: 'text', label: '姓名', placeholder: '请输入姓名' }
    ];

    ApiUtils.callOpenRouter.mockResolvedValue('invalid json response');

    const suggestions = await AiFiller.getFillSuggestions(fields);
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].suggestion).toBe('');
    expect(suggestions[0].confidence).toBe(0);
  });

  it('should build prompt correctly', () => {
    const fields = [
      { name: 'phone', type: 'tel', label: '电话', placeholder: '请输入电话' }
    ];

    const prompt = AiFiller.buildPrompt(fields);
    expect(prompt).toContain('字段名: phone');
    expect(prompt).toContain('类型: tel');
    expect(prompt).toContain('电话');
    expect(prompt).toContain('请输入电话');
  });
});
