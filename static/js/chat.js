/**
 * PhyChat - Chat Interface JavaScript
 * Handles all chat functionality including sending messages, 
 * displaying responses, and managing conversation history
 */

// ============================================
// Chat Application Class
// ============================================

class PhyChatApp {
    constructor() {
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendBtn = document.getElementById('send-btn');
        this.newChatBtn = document.querySelector('.new-chat-btn');
        this.conversationList = document.querySelector('.conversation-list');
        this.voiceBtn = document.getElementById('voice-btn');
        this.attachBtn = document.getElementById('attach-btn');
        
        this.conversations = [];
        this.currentConversationId = null;
        this.isProcessing = false;
        
        this.init();
    }

    init() {
        this.loadConversations();
        this.bindEvents();
        this.setupAutoResize();
        this.loadQuickPrompts();
        
        // Start new conversation if none exists
        if (this.conversations.length === 0) {
            this.createNewConversation();
        } else {
            this.loadConversation(this.conversations[0].id);
        }
    }

    // ============================================
    // Event Binding
    // ============================================

    bindEvents() {
        // Send message on button click
        this.sendBtn?.addEventListener('click', () => this.sendMessage());

        // Send message on Enter (Shift+Enter for new line)
        this.chatInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // New chat button
        this.newChatBtn?.addEventListener('click', () => this.createNewConversation());

        // Voice input
        this.voiceBtn?.addEventListener('click', () => this.startVoiceInput());

        // File attachment
        this.attachBtn?.addEventListener('click', () => this.handleFileAttachment());

        // Quick prompts
        document.querySelectorAll('.quick-prompt').forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.getAttribute('data-prompt');
                if (prompt) {
                    this.chatInput.value = prompt;
                    this.sendMessage();
                }
            });
        });
    }

    // ============================================
    // Auto-resize Textarea
    // ============================================

    setupAutoResize() {
        if (!this.chatInput) return;

        this.chatInput.addEventListener('input', () => {
            this.chatInput.style.height = 'auto';
            this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 200) + 'px';
            this.updateSendButtonState();
        });
    }

    updateSendButtonState() {
        if (this.sendBtn && this.chatInput) {
            const hasContent = this.chatInput.value.trim().length > 0;
            this.sendBtn.disabled = !hasContent || this.isProcessing;
        }
    }

    // ============================================
    // Message Handling
    // ============================================

    async sendMessage() {
        const message = this.chatInput?.value.trim();
        if (!message || this.isProcessing) return;

        // Clear input and reset height
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';
        this.updateSendButtonState();

        // Add user message to chat
        this.addMessage(message, 'user');

        // Save to current conversation
        this.saveMessageToConversation(message, 'user');

        // Show typing indicator
        this.showTypingIndicator();

        // Process and get AI response
        this.isProcessing = true;
        try {
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'assistant');
            this.saveMessageToConversation(response, 'assistant');
        } catch (error) {
            this.hideTypingIndicator();
            this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant', true);
        }
        this.isProcessing = false;
        this.updateSendButtonState();
    }

    addMessage(content, type, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message ${isError ? 'error' : ''}`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = type === 'user' 
            ? '<i class="fas fa-user"></i>' 
            : '<i class="fas fa-robot"></i>';

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        // Parse markdown-like formatting
        const formattedContent = this.formatMessage(content);
        messageContent.innerHTML = formattedContent;

        const timestamp = document.createElement('div');
        timestamp.className = 'message-timestamp';
        timestamp.textContent = this.formatTime(new Date());

        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        messageDiv.appendChild(timestamp);

        // Remove welcome screen if present
        const welcomeScreen = document.querySelector('.welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.remove();
        }

        this.chatMessages?.appendChild(messageDiv);
        this.scrollToBottom();

        // Add animation
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        requestAnimationFrame(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        });
    }

    formatMessage(content) {
        // Convert markdown-like syntax to HTML
        let formatted = content
            // Code blocks
            .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Bold
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            // Line breaks
            .replace(/\n/g, '<br>')
            // Math expressions (LaTeX-like)
            .replace(/\$([^$]+)\$/g, '<span class="math">$1</span>');

        return formatted;
    }

    formatTime(date) {
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    scrollToBottom() {
        if (this.chatMessages) {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }
    }

    // ============================================
    // Typing Indicator
    // ============================================

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message assistant-message typing-indicator-message';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        this.chatMessages?.appendChild(indicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // ============================================
    // AI Response (Simulated)
    // ============================================

    async getAIResponse(message) {
        // Simulate API delay
        await this.delay(1500 + Math.random() * 1000);

        // Physics-related responses based on keywords
        const lowerMessage = message.toLowerCase();
        
        // Response database for physics topics
        const responses = {
            'newton': `**Newton's Laws of Motion**

1. **First Law (Inertia):** An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an unbalanced force.

2. **Second Law:** The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.
   \`F = ma\`

3. **Third Law:** For every action, there is an equal and opposite reaction.

Would you like me to explain any of these laws in more detail or provide some practice problems?`,

            'quantum': `**Quantum Mechanics** is a fundamental theory in physics that describes nature at the smallest scales of energy levels of atoms and subatomic particles.

Key concepts include:
- **Wave-Particle Duality:** Particles can exhibit wave-like behavior
- **Heisenberg Uncertainty Principle:** \`Δx · Δp ≥ ℏ/2\`
- **Schrödinger's Equation:** Describes how quantum states evolve over time
- **Superposition:** Particles can exist in multiple states simultaneously

Would you like me to elaborate on any of these concepts?`,

            'thermodynamics': `**Thermodynamics** is the branch of physics that deals with heat, work, and temperature.

**The Four Laws:**

0. **Zeroth Law:** If two systems are in thermal equilibrium with a third, they are in equilibrium with each other.

1. **First Law:** Energy cannot be created or destroyed, only transformed.
   \`ΔU = Q - W\`

2. **Second Law:** Entropy of an isolated system always increases.

3. **Third Law:** As temperature approaches absolute zero, entropy approaches a constant minimum.

Need help with any specific thermodynamics problem?`,

            'electromagnetism': `**Electromagnetism** describes the interaction between electrically charged particles.

**Maxwell's Equations** form the foundation:
- **Gauss's Law:** \`∇·E = ρ/ε₀\`
- **Gauss's Law for Magnetism:** \`∇·B = 0\`
- **Faraday's Law:** \`∇×E = -∂B/∂t\`
- **Ampère's Law:** \`∇×B = μ₀J + μ₀ε₀∂E/∂t\`

These equations describe how electric and magnetic fields are generated and interact!`,

            'relativity': `**Einstein's Theory of Relativity**

**Special Relativity (1905):**
- Speed of light is constant in all reference frames
- Time dilation: \`t' = t/√(1-v²/c²)\`
- Length contraction: \`L' = L√(1-v²/c²)\`
- Mass-energy equivalence: \`E = mc²\`

**General Relativity (1915):**
- Gravity is the curvature of spacetime caused by mass
- Predicts black holes, gravitational waves, and time dilation near massive objects

What aspect would you like to explore further?`,

            'default': `That's a great physics question! Let me help you understand this concept.

Physics is all about understanding the fundamental laws that govern our universe. Whether it's the motion of planets, the behavior of atoms, or the nature of light, physics provides the framework.

Could you provide more details about what specific aspect you'd like to explore? I can help with:
- **Classical Mechanics** (motion, forces, energy)
- **Thermodynamics** (heat, entropy, temperature)
- **Electromagnetism** (electricity, magnetism, light)
- **Quantum Mechanics** (atomic and subatomic behavior)
- **Relativity** (space, time, gravity)

Feel free to ask any physics question!`
        };

        // Find matching response
        for (const [keyword, response] of Object.entries(responses)) {
            if (lowerMessage.includes(keyword)) {
                return response;
            }
        }

        return responses.default;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============================================
    // Conversation Management
    // ============================================

    loadConversations() {
        const saved = localStorage.getItem('phychat-conversations');
        this.conversations = saved ? JSON.parse(saved) : [];
        this.renderConversationList();
    }

    saveConversations() {
        localStorage.setItem('phychat-conversations', JSON.stringify(this.conversations));
    }

    createNewConversation() {
        const conversation = {
            id: Date.now().toString(),
            title: 'New Conversation',
            messages: [],
            createdAt: new Date().toISOString()
        };
        
        this.conversations.unshift(conversation);
        this.saveConversations();
        this.loadConversation(conversation.id);
        this.renderConversationList();
    }

    loadConversation(conversationId) {
        this.currentConversationId = conversationId;
        const conversation = this.conversations.find(c => c.id === conversationId);
        
        if (!conversation) return;

        // Clear chat messages
        if (this.chatMessages) {
            this.chatMessages.innerHTML = '';
        }

        // Load messages
        if (conversation.messages.length === 0) {
            this.showWelcomeScreen();
        } else {
            conversation.messages.forEach(msg => {
                this.addMessage(msg.content, msg.type);
            });
        }

        // Update active state in sidebar
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === conversationId);
        });
    }

    saveMessageToConversation(content, type) {
        const conversation = this.conversations.find(c => c.id === this.currentConversationId);
        if (conversation) {
            conversation.messages.push({
                content,
                type,
                timestamp: new Date().toISOString()
            });

            // Update title based on first user message
            if (type === 'user' && conversation.messages.filter(m => m.type === 'user').length === 1) {
                conversation.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
                this.renderConversationList();
            }

            this.saveConversations();
        }
    }

    renderConversationList() {
        if (!this.conversationList) return;

        this.conversationList.innerHTML = this.conversations.map(conv => `
            <div class="conversation-item ${conv.id === this.currentConversationId ? 'active' : ''}" 
                 data-id="${conv.id}">
                <i class="fas fa-message"></i>
                <span class="conversation-title">${conv.title}</span>
                <button class="delete-conversation" data-id="${conv.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Bind click events
        this.conversationList.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.delete-conversation')) {
                    this.loadConversation(item.dataset.id);
                }
            });
        });

        // Bind delete events
        this.conversationList.querySelectorAll('.delete-conversation').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteConversation(btn.dataset.id);
            });
        });
    }

    deleteConversation(conversationId) {
        this.conversations = this.conversations.filter(c => c.id !== conversationId);
        this.saveConversations();
        
        if (this.currentConversationId === conversationId) {
            if (this.conversations.length > 0) {
                this.loadConversation(this.conversations[0].id);
            } else {
                this.createNewConversation();
            }
        }
        
        this.renderConversationList();
    }

    // ============================================
    // Welcome Screen
    // ============================================

    showWelcomeScreen() {
        const welcomeHTML = `
            <div class="welcome-screen">
                <div class="welcome-icon">
                    <i class="fas fa-atom"></i>
                </div>
                <h2>Welcome to PhyChat!</h2>
                <p>Your AI-powered physics learning assistant</p>
                <div class="quick-prompts">
                    <button class="quick-prompt" data-prompt="Explain Newton's laws of motion">
                        <i class="fas fa-rocket"></i>
                        Newton's Laws
                    </button>
                    <button class="quick-prompt" data-prompt="What is quantum mechanics?">
                        <i class="fas fa-atom"></i>
                        Quantum Mechanics
                    </button>
                    <button class="quick-prompt" data-prompt="Explain thermodynamics">
                        <i class="fas fa-fire"></i>
                        Thermodynamics
                    </button>
                    <button class="quick-prompt" data-prompt="What is Einstein's theory of relativity?">
                        <i class="fas fa-clock"></i>
                        Relativity
                    </button>
                </div>
            </div>
        `;
        
        if (this.chatMessages) {
            this.chatMessages.innerHTML = welcomeHTML;
            
            // Re-bind quick prompt events
            document.querySelectorAll('.quick-prompt').forEach(btn => {
                btn.addEventListener('click', () => {
                    const prompt = btn.getAttribute('data-prompt');
                    if (prompt && this.chatInput) {
                        this.chatInput.value = prompt;
                        this.sendMessage();
                    }
                });
            });
        }
    }

    loadQuickPrompts() {
        // Additional quick prompts can be loaded here
    }

    // ============================================
    // Voice Input
    // ============================================

    startVoiceInput() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser.');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            this.voiceBtn?.classList.add('recording');
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            
            if (this.chatInput) {
                this.chatInput.value = transcript;
            }
        };

        recognition.onend = () => {
            this.voiceBtn?.classList.remove('recording');
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.voiceBtn?.classList.remove('recording');
        };

        recognition.start();
    }

    // ============================================
    // File Attachment
    // ============================================

    handleFileAttachment() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*,.pdf,.doc,.docx,.txt';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processAttachment(file);
            }
        };
        
        input.click();
    }

    processAttachment(file) {
        // For now, just show the file name
        const fileName = file.name;
        const fileSize = this.formatFileSize(file.size);
        
        if (this.chatInput) {
            this.chatInput.value += `\n[Attached: ${fileName} (${fileSize})]`;
            this.chatInput.focus();
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// ============================================
// Sidebar Toggle (Mobile)
// ============================================

class SidebarManager {
    constructor() {
        this.sidebar = document.querySelector('.chat-sidebar');
        this.toggleBtn = document.querySelector('.sidebar-toggle');
        this.overlay = document.querySelector('.sidebar-overlay');
        this.init();
    }

    init() {
        this.toggleBtn?.addEventListener('click', () => this.toggle());
        this.overlay?.addEventListener('click', () => this.close());

        // Close sidebar on window resize if larger than mobile
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                this.close();
            }
        });
    }

    toggle() {
        this.sidebar?.classList.toggle('active');
        this.overlay?.classList.toggle('active');
    }

    close() {
        this.sidebar?.classList.remove('active');
        this.overlay?.classList.remove('active');
    }
}

// ============================================
// Code Syntax Highlighting (Basic)
// ============================================

class CodeHighlighter {
    constructor() {
        this.init();
    }

    init() {
        // Observe for new code blocks
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) {
                        this.highlightCodeBlocks(node);
                    }
                });
            });
        });

        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
            observer.observe(chatMessages, { childList: true, subtree: true });
        }
    }

    highlightCodeBlocks(container) {
        const codeBlocks = container.querySelectorAll('pre code');
        codeBlocks.forEach(block => {
            // Add copy button
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-code-btn';
            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
            copyBtn.onclick = () => this.copyCode(block, copyBtn);
            
            const pre = block.parentElement;
            if (pre && !pre.querySelector('.copy-code-btn')) {
                pre.style.position = 'relative';
                pre.appendChild(copyBtn);
            }
        });
    }

    copyCode(block, btn) {
        navigator.clipboard.writeText(block.textContent).then(() => {
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-copy"></i>';
            }, 2000);
        });
    }
}

// ============================================
// Initialize Chat Application
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on chat page
    if (document.querySelector('.chat-container')) {
        new PhyChatApp();
        new SidebarManager();
        new CodeHighlighter();
    }
});
