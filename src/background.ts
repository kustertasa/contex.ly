console.log('=== Contex.ly Background Script Started ===');

// This will run when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed or updated');
  
  // Remove any existing menu items first
  chrome.contextMenus.removeAll(() => {
    // Create one simple context menu item
    chrome.contextMenus.create({
      id: 'explain-selection',
      title: '🔍 Explain with Contex.ly',
      contexts: ['selection'],
      enabled: true
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to create menu:', chrome.runtime.lastError);
      } else {
        console.log('Menu created successfully');
      }
    });
  });
});

// Handle menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('Menu click detected:', info.menuItemId);
  
  if (info.menuItemId === 'explain-selection' && info.selectionText) {
    console.log('Contex.ly menu clicked with selection:', info.selectionText);
    
    if (!tab?.id) {
      console.error('No tab ID available');
      return;
    }

    // First, try to inject the content script if it's not already there
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      console.log('Content script injected or already present');
    } catch (error) {
      console.log('Content script injection error (might already be present):', error);
    }

    // Then try to send the message
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'EXPLAIN_TEXT',
        text: info.selectionText
      });
      console.log('Message sent successfully, response:', response);
    } catch (error) {
      console.error('Error sending message:', error);
      // Try to show a fallback notification
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (text) => {
            const notification = document.createElement('div');
            notification.style.cssText = `
              position: fixed;
              top: 20px;
              right: 20px;
              background: #f44336;
              color: white;
              padding: 10px;
              border-radius: 4px;
              z-index: 10000;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            notification.textContent = 'Error: Could not process the selected text. Please try reloading the page.';
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 5000);
          },
          args: [info.selectionText]
        });
      } catch (fallbackError) {
        console.error('Failed to show fallback notification:', fallbackError);
      }
    }
  }
}); 