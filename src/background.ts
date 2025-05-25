console.log('=== Contex.ly Background Script Started ===');

// Keep track of active connections
const connections = new Map<number, chrome.runtime.Port>();

// Create context menu when extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed or updated');
  
  // Create the context menu item
  chrome.contextMenus.create({
    id: 'reframe-selection',
    title: 'Reframe',
    contexts: ['selection']
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('Error creating menu:', chrome.runtime.lastError);
    } else {
      console.log('Menu created successfully');
    }
  });
});

// Handle new connections from content scripts
chrome.runtime.onConnect.addListener((port) => {
  const sender = port.sender;
  if (sender && sender.tab && sender.tab.id) {
    const tabId = sender.tab.id;
    connections.set(tabId, port);
    
    console.log(`New connection from tab ${tabId}`);

    // Remove connection when disconnected
    port.onDisconnect.addListener(() => {
      console.log(`Tab ${tabId} disconnected`);
      connections.delete(tabId);
    });
  }
});

// Handle context menu clicks with connection management
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'reframe-selection' && tab?.id !== undefined && info.selectionText) {
    const tabId = tab.id;
    console.log('Contex.ly menu clicked with selection:', info.selectionText);
    
    try {
      // Try sending message to content script
      await chrome.tabs.sendMessage(tabId, {
        type: 'EXPLAIN_TEXT',
        text: info.selectionText
      });
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
      
      try {
        // If content script is not injected, inject it
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        });
        console.log('Content script injected successfully');

        // Establish connection
        const port = chrome.tabs.connect(tabId, { name: 'contex-ly-connection' });
        connections.set(tabId, port);

        // Retry sending the message
        await chrome.tabs.sendMessage(tabId, {
          type: 'EXPLAIN_TEXT',
          text: info.selectionText
        });
        console.log('Message sent successfully after injection');
      } catch (error) {
        console.error('Error after injection:', error);
      }
    }
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    // Try to establish connection with the content script
    try {
      const port = chrome.tabs.connect(tabId, { name: 'contex-ly-connection' });
      connections.set(tabId, port);
    } catch (error) {
      console.error(`Error connecting to tab ${tabId}:`, error);
    }
  }
}); 