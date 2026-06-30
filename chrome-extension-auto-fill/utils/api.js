const ApiUtils = {
  async callOpenRouter(prompt) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type: 'callOpenRouter', prompt },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  }
};

export default ApiUtils;
