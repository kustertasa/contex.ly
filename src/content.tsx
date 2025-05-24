// Content script that runs in the context of web pages
try {
  console.log('=== Contex.ly Content Script Started ===');
  console.log('Document readyState:', document.readyState);

  function logContent(message: string) {
    console.log(`[Contex.ly Content] ${message}`);
  }

  // Log initial state
  logContent('Initializing content script...');

  interface OpenAIError {
    error?: {
      message: string;
    };
    message?: string;
  }

  interface OpenAIResponse {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  }

  const metaphorStyles = {
    'pop-culture': 'Explain using references to movies, TV shows, celebrities, and current trends. Use well-known pop culture moments and characters that most people would recognize.',
    'kid-friendly': 'Explain as if talking to a 10-year-old child. Use simple words, fun examples, and relatable situations from a kid\'s perspective, like school, toys, or playground scenarios.',
    'gossip-girl': 'Explain in the style of Gossip Girl - dramatic, scandalous, and full of Upper East Side drama. Use fashion, luxury, and social status references. Start with "Hey Upper East Siders..." and end with "XOXO, Gossip Girl"',
    'gen-z': 'Explain using Gen Z slang, TikTok references, and modern internet culture. Include emojis, current memes, and trending phrases. Keep it very casual and slightly chaotic.',
    'harry-potter': 'Explain using references to the Harry Potter universe, including magical concepts, Hogwarts houses, spells, and characters.',
    'marvel': 'Explain using references to the Marvel Cinematic Universe, including superheroes, villains, infinity stones, and iconic MCU moments.'
  };

  // Inject styles
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .contex-ly-container {
      position: fixed;
      z-index: 10000;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      width: 600px;
      max-width: 80vw;
      height: 80vh;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: contex-ly-fade-in 0.3s ease-out;
      pointer-events: none;
      display: flex;
      flex-direction: column;
    }

    .contex-ly-container.active {
      pointer-events: auto;  /* Active state: allow interaction */
    }

    /* Add fade out animation */
    @keyframes contex-ly-fade-out {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(10px); }
    }

    .contex-ly-container.closing {
      animation: contex-ly-fade-out 0.2s ease-in forwards;
    }

    .contex-ly-content {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .contex-ly-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: white;
      border-bottom: 1px solid #e0e0e0;
      border-radius: 12px 12px 0 0;
    }

    .contex-ly-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .contex-ly-controls {
      padding: 16px 24px;
      background: white;
      border-top: 1px solid #e0e0e0;
      border-radius: 0 0 12px 12px;
    }

    .contex-ly-text-container {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      font-size: 14px;
      line-height: 1.5;
      border: 1px solid #e0e0e0;
    }

    .contex-ly-explanation {
      background: white;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.6;
      flex: 1;
    }

    .contex-ly-select-wrapper {
      margin-bottom: 16px;
    }

    @keyframes contex-ly-fade-in {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .contex-ly-select {
      width: 100%;
      padding: 10px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      background: white;
      font-size: 14px;
      color: #333;
      cursor: pointer;
      transition: all 0.2s ease;
      appearance: none;
      background-image: url('data:image/svg+xml;charset=US-ASCII,<svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L7 7L13 1" stroke="%23666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 32px;
    }

    .contex-ly-select:hover {
      border-color: #2196F3;
    }

    .contex-ly-select:focus {
      outline: none;
      border-color: #2196F3;
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
    }

    .contex-ly-button {
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .contex-ly-button-primary {
      background: #2196F3;
      color: white;
    }

    .contex-ly-button-primary:hover {
      background: #1976D2;
      transform: translateY(-1px);
    }

    .contex-ly-button-secondary {
      background: #e0e0e0;
      color: #333;
    }

    .contex-ly-button-secondary:hover {
      background: #d0d0d0;
    }

    .contex-ly-close {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      padding: 8px;
      cursor: pointer;
      color: #333;
      font-size: 20px;
      line-height: 1;
      transition: all 0.2s ease;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      position: relative;
      z-index: 1001;
      margin: 0;
    }

    .contex-ly-close:hover {
      background: #e0e0e0;
      color: #000;
    }

    .contex-ly-close:active {
      background: #ccc;
      transform: scale(0.95);
    }

    .contex-ly-divider {
      height: 1px;
      background: #e0e0e0;
      margin: 16px 0;
    }

    .contex-ly-text {
      color: #666;
      font-size: 14px;
      line-height: 1.6;
    }

    .contex-ly-label {
      display: block;
      margin-bottom: 8px;
      color: #666;
      font-size: 14px;
      font-weight: 500;
    }
  `;
  document.head.appendChild(styleSheet);

  async function generateExplanation(text: string, style: string): Promise<string> {
    try {
      logContent('Fetching API key from storage...');
      const data = await chrome.storage.sync.get('openaiApiKey');
      logContent('Storage access successful');
      
      if (!data.openaiApiKey) {
        throw new Error('No API key found. Please add your OpenAI API key in the extension settings.');
      }

      const stylePrompt = metaphorStyles[style as keyof typeof metaphorStyles];
      logContent(`Using metaphor style: ${style} (${stylePrompt})`);

      let systemPrompt = 'You are a creative assistant that explains concepts using metaphors and analogies. ';
      let userPrompt = '';

      switch (style) {
        case 'pop-culture':
          systemPrompt += 'You specialize in using current pop culture references. Make sure to reference specific movies, shows, or celebrities that are widely known.';
          userPrompt = `Explain this using popular movies, TV shows, or celebrity references: "${text}"`;
          break;
        case 'kid-friendly':
          systemPrompt += 'You are talking to a 10-year-old child. Use simple words and fun examples that kids can relate to.';
          userPrompt = `Explain this to a 10-year-old using things they understand like toys, school, or games: "${text}"`;
          break;
        case 'gossip-girl':
          systemPrompt += 'You are Gossip Girl. Be dramatic, scandalous, and use Upper East Side references.';
          userPrompt = `Hey Upper East Siders, let me tell you about this juicy situation: "${text}" XOXO`;
          break;
        case 'gen-z':
          systemPrompt += 'You are a Gen Z social media expert. Use current slang, emojis, and internet culture references.';
          userPrompt = `bestie, explain this using gen z vibes and current internet trends fr fr: "${text}"`;
          break;
        case 'harry-potter':
          systemPrompt += 'You are a Hogwarts professor explaining concepts using magical references.';
          userPrompt = `Explain this using Harry Potter references and magical concepts: "${text}"`;
          break;
        case 'marvel':
          systemPrompt += 'You are a Marvel superfan who explains everything through MCU references.';
          userPrompt = `Explain this using Marvel Cinematic Universe references and characters: "${text}"`;
          break;
        default:
          systemPrompt += stylePrompt;
          userPrompt = `Explain this text: "${text}"`;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.8,
          max_tokens: 250
        })
      });

      logContent(`API response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.json() as OpenAIError;
        throw new Error(error.error?.message || `API Error (${response.status}): ${error.message || 'Unknown error'}`);
      }

      const result = await response.json() as OpenAIResponse;
      if (!result.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI');
      }

      logContent('Successfully generated explanation');
      return result.choices[0].message.content;
    } catch (error) {
      const e = error as Error;
      const errorMessage = `Error generating explanation: ${e.message}`;
      logContent(errorMessage);
      return errorMessage;
    }
  }

  // Create a notification element to confirm script loading
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 10px;
    border-radius: 4px;
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  notification.textContent = 'Contex.ly loaded!';
  document.body.appendChild(notification);
  logContent('Notification added to page');
  setTimeout(() => {
    notification.remove();
    logContent('Initial notification removed');
  }, 5000);

  // Create and inject the result container
  const container = document.createElement('div');
  container.id = 'contex-ly-result';
  container.className = 'contex-ly-container';
  document.body.appendChild(container);
  logContent('Result container ready');

  function createStyleSelector(currentText: string): string {
    const options = Object.entries(metaphorStyles)
      .map(([value, description]) => {
        const displayName = {
          'pop-culture': '🎬 Pop Culture',
          'kid-friendly': '🎈 Kid-Friendly',
          'gossip-girl': '💋 Gossip Girl',
          'gen-z': '✨ Gen Z',
          'harry-potter': '⚡ Harry Potter',
          'marvel': '🦸‍♂️ Marvel'
        }[value] || value;
        
        return `<option value="${value}" title="${description}">${displayName}</option>`;
      })
      .join('');

    return `
      <div>
        <label class="contex-ly-label">
          Choose your vibe:
        </label>
        <select id="metaphor-style" class="contex-ly-select">
          ${options}
        </select>
        <button id="regenerate" class="contex-ly-button contex-ly-button-primary" style="width: 100%; margin-top: 12px;">
          ✨ Regenerate with Selected Style
        </button>
      </div>
    `;
  }

  function closeContainer() {
    logContent('Attempting to close container...');
    const container = document.getElementById('contex-ly-result');
    if (container) {
      // Add closing animation
      container.classList.add('closing');
      container.classList.remove('active');
      
      // Remove the container from interaction
      container.style.pointerEvents = 'none';
      
      // Wait for animation to complete
      setTimeout(() => {
        container.style.display = 'none';
        container.classList.remove('closing');
        
        // Clean up event listeners
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
        
        // Clear the container content
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        
        logContent('Container closed and cleaned up successfully');
      }, 200); // Match the animation duration
    }
  }

  // Define event handlers at module scope
  const handleClickOutside = (e: MouseEvent) => {
    const container = document.getElementById('contex-ly-result');
    if (container && 
        container.style.display === 'block' && 
        !container.contains(e.target as Node)) {
      closeContainer();
    }
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeContainer();
    }
  };

  function showResult(result: string, currentText: string = '', showStyleSelector: boolean = true) {
    try {
      // Clear existing content and state
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      container.className = 'contex-ly-container';

      // Create main structure
      const contentDiv = document.createElement('div');
      contentDiv.className = 'contex-ly-content';

      // Create header
      const headerDiv = document.createElement('div');
      headerDiv.className = 'contex-ly-header';

      const title = document.createElement('h3');
      title.style.margin = '0';
      title.style.color = '#333';
      title.style.fontSize = '16px';
      title.textContent = 'Contex.ly Explanation';

      const closeButton = document.createElement('button');
      closeButton.className = 'contex-ly-close';
      closeButton.id = 'contex-ly-close';
      closeButton.setAttribute('aria-label', 'Close');
      closeButton.setAttribute('type', 'button');
      closeButton.textContent = '✕';
      
      closeButton.addEventListener('click', (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        logContent('Close button clicked');
        closeContainer();
      });

      headerDiv.appendChild(title);
      headerDiv.appendChild(closeButton);
      contentDiv.appendChild(headerDiv);

      // Create scrollable body
      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'contex-ly-body';

      // Add selected text if present
      if (currentText) {
        const selectedTextDiv = document.createElement('div');
        selectedTextDiv.innerHTML = `
          <strong>Selected Text:</strong>
          <div class="contex-ly-text-container">
            "${currentText}"
          </div>
        `;
        bodyDiv.appendChild(selectedTextDiv);
      }

      // Add explanation
      const explanationDiv = document.createElement('div');
      explanationDiv.className = 'contex-ly-explanation';
      explanationDiv.innerHTML = result;
      bodyDiv.appendChild(explanationDiv);

      contentDiv.appendChild(bodyDiv);

      // Create controls section if style selector is needed
      if (showStyleSelector) {
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'contex-ly-controls';
        
        const selectWrapper = document.createElement('div');
        selectWrapper.className = 'contex-ly-select-wrapper';
        selectWrapper.innerHTML = createStyleSelector(currentText);
        
        controlsDiv.appendChild(selectWrapper);
        contentDiv.appendChild(controlsDiv);
      }

      container.appendChild(contentDiv);

      // Show the container
      container.style.display = 'block';
      requestAnimationFrame(() => {
        container.classList.add('active');
      });

      // Position the container
      const viewportWidth = window.innerWidth;
      const containerWidth = Math.min(600, viewportWidth * 0.8);
      container.style.left = `${Math.max(0, (viewportWidth - containerWidth) / 2)}px`;
      container.style.top = '10vh';

      // Add global event listeners
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);

      logContent('Result popup displayed with fixed height and scrollable content');
    } catch (error) {
      const e = error as Error;
      logContent(`Error in showResult: ${e.message}`);
      // Try to show a fallback notification
      const errorNotification = document.createElement('div');
      errorNotification.style.cssText = `
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
      errorNotification.textContent = `Error: ${e.message}`;
      document.body.appendChild(errorNotification);
      setTimeout(() => errorNotification.remove(), 5000);
    }
  }

  // Listen for messages from the background script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    logContent(`Received message: ${JSON.stringify(request)}`);
    
    if (request.type === 'EXPLAIN_TEXT' && request.text) {
      logContent(`Processing explanation request for text: ${request.text}`);
      
      // Show loading state
      showResult(`
        <div style="text-align: center; padding: 20px;">
          <div style="margin-bottom: 12px; color: #666;">
            Generating explanation...
          </div>
          <div style="color: #666; font-size: 14px;">
            Please wait while we craft your explanation
          </div>
        </div>
      `, request.text, false);
      
      // Generate the explanation with default style
      generateExplanation(request.text, 'pop-culture').then(explanation => {
        const isError = explanation.startsWith('Error');
        showResult(`
          ${isError ? `
            <div style="color: #f44336;">
              <strong>Error:</strong><br>
              ${explanation}
            </div>
          ` : `
            <div>
              <strong>Explanation:</strong>
              <div style="margin-top: 8px; line-height: 1.6;">
                ${explanation}
              </div>
            </div>
          `}
        `, request.text);
      }).catch(error => {
        logContent(`Error in explanation promise: ${error.message}`);
        showResult(`
          <div style="color: #f44336;">
            <strong>Error:</strong><br>
            Failed to generate explanation: ${error.message}
          </div>
        `, request.text);
      });
      
      sendResponse({ status: 'success' });
    }
    
    return true;
  });

  // Update the document-level event listeners
  document.addEventListener('mousedown', (e) => {
    const container = document.getElementById('contex-ly-result');
    if (container && 
        container.style.display === 'block' && 
        !container.contains(e.target as Node)) {
      closeContainer();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const container = document.getElementById('contex-ly-result');
      if (container && container.style.display === 'block') {
        closeContainer();
      }
    }
  });

  logContent('Content script initialization complete');
} catch (error) {
  const e = error as Error;
  console.error('[Contex.ly Content] Fatal error:', e.message);
  console.error('[Contex.ly Content] Stack trace:', e.stack);
} 