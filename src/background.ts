console.log('=== Contex.ly Background Script Started ===');

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

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'reframe-selection' && tab?.id !== undefined && info.selectionText) {
    const tabId = tab.id; // TypeScript will know this is a number
    console.log('Contex.ly menu clicked with selection:', info.selectionText);
    
    // Send message to content script
    chrome.tabs.sendMessage(tabId, {
      type: 'EXPLAIN_TEXT',
      text: info.selectionText
    }).then(response => {
      console.log('Message sent successfully, response:', response);
    }).catch(error => {
      console.error('Error sending message:', error);
      
      // If content script is not injected, inject it
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      }).then(() => {
        console.log('Content script injected successfully');
        // Retry sending the message
        return chrome.tabs.sendMessage(tabId, {
          type: 'EXPLAIN_TEXT',
          text: info.selectionText
        });
      }).then(response => {
        console.log('Message sent successfully after injection, response:', response);
      }).catch(error => {
        console.error('Error after injection:', error);
      });
    });
  }
}); 