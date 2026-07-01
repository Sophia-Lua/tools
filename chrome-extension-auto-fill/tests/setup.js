global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    onMessage: {
      addListener: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};
