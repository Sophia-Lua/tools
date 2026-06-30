const FormDetector = {
  detectForms() {
    const forms = document.querySelectorAll('form');
    return Array.from(forms).map((form, index) => ({
      id: index,
      action: form.getAttribute('action') || '',
      method: form.getAttribute('method') || '',
      fields: this.getFormFields(form)
    }));
  },

  getFormFields(form) {
    const fields = form.querySelectorAll('input, select, textarea');
    return Array.from(fields).map(field => this.getFieldInfo(field));
  },

  getFieldInfo(field) {
    const label = this.getFieldLabel(field);
    const tagName = field.tagName.toLowerCase();
    let type = tagName;
    if (tagName === 'input') {
      type = field.type || 'text';
    }
    return {
      name: field.name || field.id || '',
      type: type,
      label: label,
      placeholder: field.placeholder || '',
      required: field.required,
      value: field.value || ''
    };
  },

  getFieldLabel(field) {
    if (field.id) {
      const label = document.querySelector(`label[for="${field.id}"]`);
      if (label) return label.textContent.trim();
    }

    const parentLabel = field.closest('label');
    if (parentLabel) return parentLabel.textContent.trim();

    const previousElement = field.previousElementSibling;
    if (previousElement && previousElement.tagName === 'LABEL') {
      return previousElement.textContent.trim();
    }

    return '';
  }
};

export default FormDetector;
