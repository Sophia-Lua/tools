import StorageUtils from '../../utils/storage.js';

describe('StorageUtils', () => {
  beforeEach(() => {
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
  });

  it('should get profiles from storage', async () => {
    chrome.storage.local.get.mockResolvedValue({ profiles: [] });
    const profiles = await StorageUtils.getProfiles();
    expect(Array.isArray(profiles)).toBe(true);
    expect(chrome.storage.local.get).toHaveBeenCalledWith('profiles');
  });

  it('should save profile to storage', async () => {
    chrome.storage.local.get.mockResolvedValue({ profiles: [] });
    const profile = { name: 'Test', data: { name: 'John' } };
    await StorageUtils.saveProfile(profile);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ profiles: [profile] });
  });

  it('should update existing profile with same name', async () => {
    const existing = [{ name: 'Test', data: { name: 'John' } }];
    chrome.storage.local.get.mockResolvedValue({ profiles: existing });
    const updated = { name: 'Test', data: { name: 'Jane' } };
    await StorageUtils.saveProfile(updated);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ profiles: [updated] });
  });

  it('should delete profile from storage', async () => {
    const profiles = [{ name: 'Test', data: {} }];
    chrome.storage.local.get.mockResolvedValue({ profiles });
    await StorageUtils.deleteProfile('Test');
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ profiles: [] });
  });

  it('should get apiKey from storage', async () => {
    chrome.storage.local.get.mockResolvedValue({ apiKey: 'test-key' });
    const key = await StorageUtils.getApiKey();
    expect(key).toBe('test-key');
    expect(chrome.storage.local.get).toHaveBeenCalledWith('apiKey');
  });

  it('should return empty string when apiKey not in storage', async () => {
    chrome.storage.local.get.mockResolvedValue({});
    const key = await StorageUtils.getApiKey();
    expect(key).toBe('');
  });

  it('should save apiKey to storage', async () => {
    await StorageUtils.saveApiKey('my-api-key');
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ apiKey: 'my-api-key' });
  });
});
