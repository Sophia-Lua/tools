import FormDetector from '../../utils/form-detector.js';

describe('FormDetector', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should detect forms on page', () => {
    const form = document.createElement('form');
    form.innerHTML = '<input type="text" name="username">';
    document.body.appendChild(form);
    
    const forms = FormDetector.detectForms();
    expect(Array.isArray(forms)).toBe(true);
    expect(forms.length).toBe(1);
  });

  it('should detect multiple forms', () => {
    document.body.innerHTML = `
      <form><input type="text" name="field1"></form>
      <form><input type="text" name="field2"></form>
    `;
    
    const forms = FormDetector.detectForms();
    expect(forms.length).toBe(2);
  });

  it('should return form metadata', () => {
    const form = document.createElement('form');
    form.action = '/submit';
    form.method = 'POST';
    form.innerHTML = '<input type="text" name="username">';
    document.body.appendChild(form);
    
    const forms = FormDetector.detectForms();
    expect(forms[0].action).toBe('/submit');
    expect(forms[0].method).toBe('POST');
    expect(Array.isArray(forms[0].fields)).toBe(true);
  });

  it('should get field info', () => {
    const field = document.createElement('input');
    field.type = 'text';
    field.name = 'username';
    field.placeholder = '请输入用户名';
    
    const info = FormDetector.getFieldInfo(field);
    expect(info.name).toBe('username');
    expect(info.type).toBe('text');
    expect(info.placeholder).toBe('请输入用户名');
  });

  it('should detect field with label', () => {
    document.body.innerHTML = `
      <label for="email">邮箱</label>
      <input type="email" id="email" name="email">
    `;
    const field = document.querySelector('input');
    
    const info = FormDetector.getFieldInfo(field);
    expect(info.label).toBe('邮箱');
  });

  it('should detect nested label', () => {
    document.body.innerHTML = `
      <label>
        密码
        <input type="password" name="password">
      </label>
    `;
    const field = document.querySelector('input');
    
    const info = FormDetector.getFieldInfo(field);
    expect(info.label).toBe('密码');
  });

  it('should detect required field', () => {
    const field = document.createElement('input');
    field.type = 'text';
    field.required = true;
    
    const info = FormDetector.getFieldInfo(field);
    expect(info.required).toBe(true);
  });

  it('should handle select field', () => {
    const select = document.createElement('select');
    select.name = 'country';
    select.innerHTML = '<option value="CN">中国</option>';
    
    const info = FormDetector.getFieldInfo(select);
    expect(info.name).toBe('country');
    expect(info.type).toBe('select');
  });

  it('should handle textarea', () => {
    const textarea = document.createElement('textarea');
    textarea.name = 'bio';
    textarea.placeholder = '请输入简介';
    
    const info = FormDetector.getFieldInfo(textarea);
    expect(info.name).toBe('bio');
    expect(info.type).toBe('textarea');
  });
});
