const logger = require('../config/logger');

/**
 * Live Chat WebSocket Service
 * Manages real-time communication for live chat sessions
 */
class LiveChatWebSocketService {
  constructor() {
    this.wss = null;
    this.sessions = new Map(); // sessionId -> Set of client connections
    this.admins = new Set(); // Set of admin connections
    this.clientInfo = new Map(); // ws -> { sessionId, isAdmin, userId }
  }

  /**
   * Initialize WebSocket server
   * @param {WebSocket.Server} wss - WebSocket server instance
   */
  initialize(wss) {
    this.wss = wss;
    
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    logger.info('[LiveChat WebSocket] Service initialized');
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    // Parse connection parameters from URL
    const url = new URL(req.url, `ws://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    const isAdmin = url.searchParams.get('admin') === 'true';
    const userId = url.searchParams.get('userId');

    // Store client info
    this.clientInfo.set(ws, { sessionId, isAdmin, userId });

    if (isAdmin) {
      // Admin connection
      this.admins.add(ws);
      logger.info('[LiveChat WebSocket] Admin connected', { userId });
    } else if (sessionId) {
      // User session connection
      if (!this.sessions.has(sessionId)) {
        this.sessions.set(sessionId, new Set());
      }
      this.sessions.get(sessionId).add(ws);
      logger.info('[LiveChat WebSocket] User connected to session', { sessionId });
    }

    // Send connection acknowledgment
    this.sendToClient(ws, {
      type: 'connection_established',
      timestamp: new Date().toISOString()
    });

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(ws, message);
      } catch (error) {
        logger.error('[LiveChat WebSocket] Error parsing message:', error);
        this.sendToClient(ws, {
          type: 'error',
          message: 'Invalid message format'
        });
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('[LiveChat WebSocket] Connection error:', error);
      this.handleDisconnection(ws);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(ws, message) {
    const clientInfo = this.clientInfo.get(ws);
    
    switch (message.type) {
      case 'typing':
        this.handleTyping(clientInfo, message);
        break;

      case 'read_receipt':
        this.handleReadReceipt(clientInfo, message);
        break;

      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      case 'subscribe_session':
        // Admin subscribing to a specific session
        if (clientInfo.isAdmin && message.sessionId) {
          if (!this.sessions.has(message.sessionId)) {
            this.sessions.set(message.sessionId, new Set());
          }
          this.sessions.get(message.sessionId).add(ws);
          this.sendToClient(ws, { 
            type: 'subscribed', 
            sessionId: message.sessionId 
          });
        }
        break;

      case 'unsubscribe_session':
        // Admin unsubscribing from a session
        if (clientInfo.isAdmin && message.sessionId) {
          const sessionClients = this.sessions.get(message.sessionId);
          if (sessionClients) {
            sessionClients.delete(ws);
          }
          this.sendToClient(ws, { 
            type: 'unsubscribed', 
            sessionId: message.sessionId 
          });
        }
        break;

      default:
        logger.warn('[LiveChat WebSocket] Unknown message type:', message.type);
    }
  }

  /**
   * Handle typing indicator
   */
  handleTyping(clientInfo, message) {
    const { sessionId, isAdmin } = clientInfo;
    const targetSessionId = message.sessionId || sessionId;

    if (!targetSessionId) return;

    const event = {
      type: isAdmin ? 'agent_typing' : 'user_typing',
      sessionId: targetSessionId,
      isTyping: message.isTyping,
      timestamp: new Date().toISOString()
    };

    // Broadcast to session participants (excluding sender)
    this.broadcastToSession(targetSessionId, event, clientInfo);

    // If user is typing, notify admins
    if (!isAdmin) {
      this.broadcastToAdmins(event);
    }
  }

  /**
   * Handle read receipt
   */
  handleReadReceipt(clientInfo, message) {
    const { sessionId, isAdmin } = clientInfo;
    const targetSessionId = message.sessionId || sessionId;

    if (!targetSessionId) return;

    const event = {
      type: 'read_receipt',
      sessionId: targetSessionId,
      messageId: message.messageId,
      readBy: isAdmin ? 'agent' : 'user',
      timestamp: new Date().toISOString()
    };

    this.broadcastToSession(targetSessionId, event, clientInfo);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnection(ws) {
    const clientInfo = this.clientInfo.get(ws);
    
    if (clientInfo) {
      if (clientInfo.isAdmin) {
        this.admins.delete(ws);
        logger.info('[LiveChat WebSocket] Admin disconnected', { userId: clientInfo.userId });
      } else if (clientInfo.sessionId) {
        const sessionClients = this.sessions.get(clientInfo.sessionId);
        if (sessionClients) {
          sessionClients.delete(ws);
          if (sessionClients.size === 0) {
            this.sessions.delete(clientInfo.sessionId);
          }
        }
        logger.info('[LiveChat WebSocket] User disconnected from session', { 
          sessionId: clientInfo.sessionId 
        });
      }
      this.clientInfo.delete(ws);
    }
  }

  /**
   * Send message to a specific client
   */
  sendToClient(ws, data) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast message to all participants in a session
   * @param {string} sessionId - Session ID
   * @param {object} data - Data to send
   * @param {object} excludeClient - Client info to exclude from broadcast
   */
  broadcastToSession(sessionId, data, excludeClient = null) {
    const sessionClients = this.sessions.get(sessionId);
    
    if (sessionClients) {
      sessionClients.forEach((client) => {
        const clientInfo = this.clientInfo.get(client);
        
        // Exclude sender if specified
        if (excludeClient && 
            clientInfo.sessionId === excludeClient.sessionId && 
            clientInfo.isAdmin === excludeClient.isAdmin) {
          return;
        }

        this.sendToClient(client, data);
      });
    }
  }

  /**
   * Broadcast message to all admins
   */
  broadcastToAdmins(data) {
    this.admins.forEach((admin) => {
      this.sendToClient(admin, data);
    });
  }

  /**
   * Notify about new chat session
   */
  notifyNewSession(session) {
    this.broadcastToAdmins({
      type: 'new_session',
      session,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Notify about new message in a session
   */
  notifyNewMessage(sessionId, message, fromUser = true) {
    const data = {
      type: fromUser ? 'user_message' : 'agent_message',
      sessionId,
      message,
      timestamp: new Date().toISOString()
    };

    // Broadcast to session
    this.broadcastToSession(sessionId, data);

    // If from user, also notify all admins
    if (fromUser) {
      this.broadcastToAdmins(data);
    }
  }

  /**
   * Notify about session status change
   */
  notifySessionStatusChange(sessionId, status, updatedBy) {
    const data = {
      type: 'session_status_changed',
      sessionId,
      status,
      updatedBy,
      timestamp: new Date().toISOString()
    };

    this.broadcastToSession(sessionId, data);
    this.broadcastToAdmins(data);
  }

  /**
   * Notify about agent assignment
   */
  notifyAgentAssignment(sessionId, agent) {
    const data = {
      type: 'agent_assigned',
      sessionId,
      agent: {
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar
      },
      timestamp: new Date().toISOString()
    };

    this.broadcastToSession(sessionId, data);
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      connectedAdmins: this.admins.size,
      totalConnections: this.clientInfo.size
    };
  }
}

// Create singleton instance
const liveChatWebSocketService = new LiveChatWebSocketService();

module.exports = liveChatWebSocketService;

