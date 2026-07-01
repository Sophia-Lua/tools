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
    expect(chrome.storage.local.set).toHaveBeenCalled();
  });

  it('should delete profile from storage', async () => {
    const profiles = [{ name: 'Test', data: {} }];
    chrome.storage.local.get.mockResolvedValue({ profiles });
    await StorageUtils.deleteProfile('Test');
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ profiles: [] });
  });
});
