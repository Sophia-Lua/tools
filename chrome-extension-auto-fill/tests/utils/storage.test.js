import StorageUtils from '../../utils/storage.js';

describe('StorageUtils', () => {
  let store;

  beforeEach(() => {
    store = {};
    global.chrome = {
      storage: {
        local: {
          get: jest.fn((keys) => {
            const result = {};
            if (typeof keys === 'string') {
              result[keys] = store[keys];
            } else if (Array.isArray(keys)) {
              keys.forEach(key => {
                result[key] = store[key];
              });
            } else if (keys === null) {
              Object.assign(result, store);
            }
            return Promise.resolve(result);
          }),
          set: jest.fn((items) => {
            Object.assign(store, items);
            return Promise.resolve();
          }),
          clear: jest.fn(() => {
            Object.keys(store).forEach(key => delete store[key]);
            return Promise.resolve();
          })
        }
      }
    };
  });

  it('should get profiles from storage', async () => {
    const profiles = await StorageUtils.getProfiles();
    expect(Array.isArray(profiles)).toBe(true);
  });

  it('should save profile to storage', async () => {
    const profile = { name: 'Test', data: { name: 'John' } };
    await StorageUtils.saveProfile(profile);
    const profiles = await StorageUtils.getProfiles();
    expect(profiles).toContainEqual(profile);
  });

  it('should clear all data from storage', async () => {
    await StorageUtils.saveProfile({ name: 'Test', data: { name: 'John' } });
    await StorageUtils.saveApiKey('test-key');
    await StorageUtils.deleteAll();
    expect(chrome.storage.local.clear).toHaveBeenCalled();
    const profiles = await StorageUtils.getProfiles();
    expect(profiles).toEqual([]);
  });
});
