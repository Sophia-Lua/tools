// popup-profiles.js
import StorageUtils from './utils/storage.js';

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', async () => {
  const profileNameInput = document.getElementById('profile-name');
  const profileDataInput = document.getElementById('profile-data');
  const saveProfileBtn = document.getElementById('save-profile-btn');
  const profileList = document.getElementById('profile-list');
  const backBtn = document.getElementById('back-btn');

  // 加载配置文件列表
  await loadProfiles();

  // 保存配置文件
  saveProfileBtn.addEventListener('click', async () => {
    const name = profileNameInput.value.trim();
    const dataStr = profileDataInput.value.trim();
    
    if (!name) {
      alert('请输入配置文件名称');
      return;
    }
    
    try {
      const data = JSON.parse(dataStr);
      await StorageUtils.saveProfile({ name, data });
      profileNameInput.value = '';
      profileDataInput.value = '';
      await loadProfiles();
      alert('配置文件已保存');
    } catch (error) {
      alert('JSON格式错误');
    }
  });

  // 返回按钮
  backBtn.addEventListener('click', () => {
    window.close();
  });

  async function loadProfiles() {
    const profiles = await StorageUtils.getProfiles();
    profileList.innerHTML = '';
    
    profiles.forEach(profile => {
      const profileDiv = document.createElement('div');
      profileDiv.className = 'profile-item';
      const escapedName = escapeHtml(profile.name);
      const escapedData = escapeHtml(JSON.stringify(profile.data, null, 2));
      const safeName = escapeAttr(profile.name);
      profileDiv.innerHTML = `
        <h3>${escapedName}</h3>
        <pre>${escapedData}</pre>
        <button class="delete-btn" data-name="${safeName}">删除</button>
      `;
      profileList.appendChild(profileDiv);
    });

    // 添加删除事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const name = e.target.dataset.name;
        if (confirm(`确定要删除配置文件 "${name}" 吗？`)) {
          await StorageUtils.deleteProfile(name);
          await loadProfiles();
        }
      });
    });
  }
});
