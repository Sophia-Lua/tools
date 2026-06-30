document.addEventListener('DOMContentLoaded', () => {
  const detectBtn = document.getElementById('detect-btn');
  const fillBtn = document.getElementById('fill-btn');
  const formList = document.getElementById('form-list');

  detectBtn.addEventListener('click', async () => {
    console.log('检测表单');
  });

  fillBtn.addEventListener('click', async () => {
    console.log('填充表单');
  });
});
