const StorageUtils = {
  async getProfiles() {
    const result = await chrome.storage.local.get('profiles');
    return result.profiles || [];
  },

  async saveProfile(profile) {
    const profiles = await this.getProfiles();
    const existingIndex = profiles.findIndex(p => p.name === profile.name);
    if (existingIndex >= 0) {
      profiles[existingIndex] = profile;
    } else {
      profiles.push(profile);
    }
    await chrome.storage.local.set({ profiles });
  },

  async deleteProfile(name) {
    const profiles = await this.getProfiles();
    const filtered = profiles.filter(p => p.name !== name);
    await chrome.storage.local.set({ profiles: filtered });
  },

  async getApiKey() {
    const result = await chrome.storage.local.get('apiKey');
    return result.apiKey || '';
  },

  async saveApiKey(apiKey) {
    await chrome.storage.local.set({ apiKey });
  }
};

export default StorageUtils;
