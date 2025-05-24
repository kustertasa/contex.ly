console.log('Popup script loaded');

function debugLog(message) {
  const debugDiv = document.getElementById('debug');
  const timestamp = new Date().toLocaleTimeString();
  const logMessage = `[${timestamp}] ${message}`;
  debugDiv.textContent = logMessage + '\n' + debugDiv.textContent;
  console.log(logMessage);
}

function showStatus(message, isSuccess) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = isSuccess ? 'success' : 'error';
  debugLog(`Status: ${message} (${isSuccess ? 'success' : 'error'})`);
}

// Check if Chrome APIs are available
if (typeof chrome === 'undefined') {
  console.error('Chrome API not available');
  debugLog('ERROR: Chrome API is not available');
} else if (!chrome.storage || !chrome.storage.sync) {
  console.error('Chrome storage API not available');
  debugLog('ERROR: Chrome storage API is not available');
} else {
  debugLog('Chrome APIs available');
}

document.addEventListener('DOMContentLoaded', async () => {
  debugLog('Popup initialized');
  
  const apiKeyInput = document.getElementById('apiKey');
  const saveButton = document.getElementById('saveButton');

  if (!apiKeyInput || !saveButton) {
    debugLog('ERROR: Could not find required DOM elements');
    return;
  }

  // Test storage permission
  try {
    debugLog('Testing storage permission...');
    await chrome.storage.sync.set({ test: 'test' });
    await chrome.storage.sync.remove('test');
    debugLog('Storage permission test successful');
  } catch (error) {
    debugLog(`Storage permission test failed: ${error.message}`);
    showStatus('Storage permission not available', false);
    saveButton.disabled = true;
    return;
  }

  // Load saved API key
  try {
    debugLog('Attempting to load saved API key');
    const data = await chrome.storage.sync.get('openaiApiKey');
    debugLog(`Load result: ${JSON.stringify(data)}`);
    if (data.openaiApiKey) {
      apiKeyInput.value = data.openaiApiKey;
      showStatus('Loaded saved API key', true);
    } else {
      debugLog('No saved API key found');
      showStatus('Please enter your OpenAI API key', false);
    }
  } catch (error) {
    debugLog(`Error loading API key: ${error.message}`);
    showStatus('Error loading saved API key', false);
  }

  // Save API key
  saveButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    debugLog('Save button clicked');
    
    if (!apiKey) {
      showStatus('Please enter an API key', false);
      debugLog('Empty API key attempted to save');
      return;
    }

    saveButton.disabled = true;
    try {
      debugLog('Attempting to save API key');
      await chrome.storage.sync.set({ openaiApiKey: apiKey });
      debugLog('API key saved, verifying...');
      
      // Verify the save
      const verification = await chrome.storage.sync.get('openaiApiKey');
      debugLog(`Verification result: ${JSON.stringify(verification)}`);
      
      if (verification.openaiApiKey === apiKey) {
        showStatus('API key saved successfully!', true);
        debugLog('API key verified successfully');
      } else {
        throw new Error('API key verification failed');
      }
    } catch (error) {
      debugLog(`Error saving API key: ${error.message}`);
      showStatus(`Error saving API key: ${error.message}`, false);
    } finally {
      saveButton.disabled = false;
    }
  });
}); 