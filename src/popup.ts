console.log('=== Contex.ly Popup Script Started ===');

function debugLog(message: string) {
  const debugDiv = document.getElementById('debug');
  if (debugDiv) {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    debugDiv.textContent = logMessage + '\n' + debugDiv.textContent;
  }
  console.log(`[Contex.ly Popup] ${message}`);
}

function showStatus(message: string, isSuccess: boolean) {
  const statusDiv = document.getElementById('status');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = isSuccess ? 'success' : 'error';
    statusDiv.style.display = 'block';
    debugLog(`Status: ${message} (${isSuccess ? 'success' : 'error'})`);
    
    // Hide the status after 3 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// Initialize the popup
async function initializePopup() {
  debugLog('Initializing popup');
  
  const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
  const saveButton = document.getElementById('saveButton') as HTMLButtonElement;

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
    const e = error as Error;
    debugLog(`Storage permission test failed: ${e.message}`);
    showStatus('Storage permission not available', false);
    saveButton.disabled = true;
    return;
  }

  // Load saved API key
  try {
    debugLog('Loading saved API key');
    const data = await chrome.storage.sync.get('openaiApiKey');
    if (data.openaiApiKey) {
      apiKeyInput.value = data.openaiApiKey;
      showStatus('API key loaded', true);
    } else {
      debugLog('No saved API key found');
      showStatus('Please enter your OpenAI API key', false);
    }
  } catch (error) {
    const e = error as Error;
    debugLog(`Error loading API key: ${e.message}`);
    showStatus('Error loading API key', false);
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
      debugLog('Saving API key');
      await chrome.storage.sync.set({ openaiApiKey: apiKey });
      
      // Verify the save
      const verification = await chrome.storage.sync.get('openaiApiKey');
      if (verification.openaiApiKey === apiKey) {
        showStatus('API key saved successfully!', true);
        debugLog('API key verified successfully');
      } else {
        throw new Error('API key verification failed');
      }
    } catch (error) {
      const e = error as Error;
      debugLog(`Error saving API key: ${e.message}`);
      showStatus(`Error saving API key: ${e.message}`, false);
    } finally {
      saveButton.disabled = false;
    }
  });
}

// Initialize when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePopup);
} else {
  initializePopup();
} 