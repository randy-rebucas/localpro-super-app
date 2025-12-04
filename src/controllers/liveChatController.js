const { LiveChatSession, LiveChatMessage } = require('../models/LiveChat');
const CloudinaryService = require('../services/cloudinaryService');
const liveChatWebSocketService = require('../services/liveChatWebSocketService');
const logger = require('../config/logger');

// ============================================
// PUBLIC ENDPOINTS (For Guest Users)
// ============================================

// @desc    Create new chat session
// @route   POST /api/live-chat/sessions
// @access  Public
const createSession = async (req, res) => {
  try {
    const { sessionId, user } = req.body;

    // Validate required fields
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    if (!user || !user.name || !user.email) {
      return res.status(400).json({
        success: false,
        message: 'User name and email are required'
      });
    }

    // Check if session already exists
    const existingSession = await LiveChatSession.findOne({ sessionId });
    if (existingSession) {
      return res.status(200).json({
        success: true,
        message: 'Session already exists',
        data: existingSession
      });
    }

    // Create new session
    const session = await LiveChatSession.create({
      sessionId,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        metadata: {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.connection.remoteAddress,
          referrer: req.headers.referer,
          pageUrl: req.body.pageUrl
        }
      },
      status: 'pending'
    });

    // Create welcome message
    const welcomeMessage = await LiveChatMessage.create({
      sessionId,
      type: 'system',
      content: `Welcome ${user.name}! A support agent will be with you shortly.`,
      agentName: 'System'
    });

    // Update session with first message
    await session.updateLastMessage(welcomeMessage);

    logger.info('[LiveChat] Session started:', {
      sessionId,
      user: { name: user.name, email: user.email },
      timestamp: new Date().toISOString()
    });

    // Notify admin dashboard via WebSocket
    liveChatWebSocketService.notifyNewSession(session);

    res.status(201).json({
      success: true,
      message: 'Chat session created successfully',
      data: {
        session,
        welcomeMessage
      }
    });
  } catch (error) {
    logger.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get session details
// @route   GET /api/live-chat/sessions/:sessionId
// @access  Public (with session ID)
const getSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await LiveChatSession.findOne({ sessionId })
      .populate('assignedAgent', 'firstName lastName profile.avatar');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    logger.error('Get session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send message (user)
// @route   POST /api/live-chat/sessions/:sessionId/messages
// @access  Public (with session ID)
const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    const files = req.files || [];

    // Validate: must have either content or files
    if (!content && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content or attachment is required'
      });
    }

    // Find session
    const session = await LiveChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if session is closed
    if (session.status === 'closed' || session.status === 'archived') {
      return res.status(400).json({
        success: false,
        message: 'This chat session has been closed'
      });
    }

    // Handle file uploads if any
    let attachments = [];
    if (files.length > 0) {
      // Check if files are already uploaded via CloudinaryStorage
      const firstFile = files[0];
      const hasCloudinaryInfo = firstFile.public_id || (firstFile.path && firstFile.path.includes('cloudinary.com'));

      if (hasCloudinaryInfo) {
        // Files already uploaded via CloudinaryStorage
        attachments = files.map(file => ({
          id: file.public_id || `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.originalname || file.filename || 'file',
          type: file.mimetype || 'application/octet-stream',
          size: file.bytes || file.size || 0,
          url: file.secure_url || file.url || file.path,
          publicId: file.public_id,
          previewUrl: file.mimetype?.startsWith('image/') ? (file.secure_url || file.url || file.path) : null
        }));
      } else {
        // Upload files to Cloudinary
        const uploadResult = await CloudinaryService.uploadMultipleFiles(
          files,
          'localpro/live-chat/attachments'
        );

        if (!uploadResult.success) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload files',
            error: uploadResult.errors
          });
        }

        attachments = uploadResult.data.map((uploadedFile, index) => ({
          id: uploadedFile.public_id,
          name: files[index].originalname || `file.${uploadedFile.format}`,
          type: files[index].mimetype || `image/${uploadedFile.format}`,
          size: uploadedFile.bytes || files[index].size,
          url: uploadedFile.secure_url,
          publicId: uploadedFile.public_id,
          previewUrl: uploadedFile.format ? uploadedFile.secure_url : null
        }));
      }
    }

    // Create message
    const message = await LiveChatMessage.create({
      sessionId,
      type: 'user',
      content: content || `Sent ${attachments.length} file(s)`,
      attachments
    });

    // Update session
    await session.updateLastMessage(message);

    // Notify via WebSocket (user message to admins)
    liveChatWebSocketService.notifyNewMessage(sessionId, message, true);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get messages for a session
// @route   GET /api/live-chat/sessions/:sessionId/messages
// @access  Public (with session ID)
const getMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify session exists
    const session = await LiveChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const messages = await LiveChatMessage.getSessionMessages(sessionId, Number(limit), skip);
    const total = await LiveChatMessage.countDocuments({ 
      sessionId,
      'metadata.isDeleted': { $ne: true }
    });

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: messages
    });
  } catch (error) {
    logger.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Upload attachment
// @route   POST /api/live-chat/upload
// @access  Public (with session ID in body)
const uploadAttachment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const files = req.files || (req.file ? [req.file] : []);

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files provided'
      });
    }

    // Verify session exists
    const session = await LiveChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Upload files
    let attachments = [];
    const firstFile = files[0];
    const hasCloudinaryInfo = firstFile.public_id || (firstFile.path && firstFile.path.includes('cloudinary.com'));

    if (hasCloudinaryInfo) {
      attachments = files.map(file => ({
        id: file.public_id || `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.originalname || file.filename || 'file',
        type: file.mimetype || 'application/octet-stream',
        size: file.bytes || file.size || 0,
        url: file.secure_url || file.url || file.path,
        publicId: file.public_id,
        previewUrl: file.mimetype?.startsWith('image/') ? (file.secure_url || file.url || file.path) : null
      }));
    } else {
      const uploadResult = await CloudinaryService.uploadMultipleFiles(
        files,
        'localpro/live-chat/attachments'
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload files',
          error: uploadResult.errors
        });
      }

      attachments = uploadResult.data.map((uploadedFile, index) => ({
        id: uploadedFile.public_id,
        name: files[index].originalname || `file.${uploadedFile.format}`,
        type: files[index].mimetype || `image/${uploadedFile.format}`,
        size: uploadedFile.bytes || files[index].size,
        url: uploadedFile.secure_url,
        publicId: uploadedFile.public_id,
        previewUrl: uploadedFile.format ? uploadedFile.secure_url : null
      }));
    }

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: { attachments }
    });
  } catch (error) {
    logger.error('Upload attachment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    End chat session (user initiated)
// @route   PATCH /api/live-chat/sessions/:sessionId/end
// @access  Public (with session ID)
const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, feedback } = req.body;

    const session = await LiveChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Close session
    await session.closeSession();

    // Add rating if provided
    if (rating) {
      await session.rateSession(rating, feedback);
    }

    // Create system message
    await LiveChatMessage.create({
      sessionId,
      type: 'system',
      content: 'Chat session ended by user. Thank you for chatting with us!'
    });

    logger.info('[LiveChat] Session ended by user:', { sessionId });

    res.status(200).json({
      success: true,
      message: 'Chat session ended',
      data: session
    });
  } catch (error) {
    logger.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Rate chat session
// @route   POST /api/live-chat/sessions/:sessionId/rate
// @access  Public (with session ID)
const rateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { score, feedback } = req.body;

    if (!score || score < 1 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating score must be between 1 and 5'
      });
    }

    const session = await LiveChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.rateSession(score, feedback);

    res.status(200).json({
      success: true,
      message: 'Thank you for your feedback!',
      data: { rating: session.rating }
    });
  } catch (error) {
    logger.error('Rate session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// ============================================
// ADMIN ENDPOINTS (Requires Authentication)
// ============================================

// @desc    Get all chat sessions (admin)
// @route   GET /api/admin/live-chat/sessions
// @access  Private (Admin/Support)
const getAdminSessions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      department,
      priority,
      assignedAgent,
      search 
    } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (department) {
      query.department = department;
    }

    if (priority) {
      query.priority = priority;
    }

    if (assignedAgent) {
      if (assignedAgent === 'unassigned') {
        query.assignedAgent = { $exists: false };
      } else {
        query.assignedAgent = assignedAgent;
      }
    }

    if (search) {
      query.$or = [
        { 'user.name': new RegExp(search, 'i') },
        { 'user.email': new RegExp(search, 'i') },
        { sessionId: new RegExp(search, 'i') }
      ];
    }

    const sessions = await LiveChatSession.find(query)
      .populate('assignedAgent', 'firstName lastName profile.avatar')
      .sort({ 
        // Priority: pending first, then by priority level, then by creation time
        status: 1, 
        priority: -1, 
        createdAt: -1 
      })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await LiveChatSession.countDocuments(query);

    // Get counts by status
    const statusCounts = await LiveChatSession.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      data: sessions
    });
  } catch (error) {
    logger.error('Get admin sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single session details (admin)
// @route   GET /api/admin/live-chat/sessions/:sessionId
// @access  Private (Admin/Support)
const getAdminSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await LiveChatSession.findOne({ sessionId })
      .populate('assignedAgent', 'firstName lastName profile.avatar email')
      .populate('notes.addedBy', 'firstName lastName');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Get messages
    const messages = await LiveChatMessage.find({ sessionId })
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages as read and reset unread count
    session.unreadCount = 0;
    await session.save();

    res.status(200).json({
      success: true,
      data: {
        session,
        messages
      }
    });
  } catch (error) {
    logger.error('Get admin session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send agent reply
// @route   POST /api/admin/live-chat/sessions/:sessionId/reply
// @access  Private (Admin/Support)
const sendAgentReply = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;
    const files = req.files || [];

    if (!content && files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content or attachment is required'
      });
    }

    const session = await LiveChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Handle file uploads if any
    let attachments = [];
    if (files.length > 0) {
      const firstFile = files[0];
      const hasCloudinaryInfo = firstFile.public_id || (firstFile.path && firstFile.path.includes('cloudinary.com'));

      if (hasCloudinaryInfo) {
        attachments = files.map(file => ({
          id: file.public_id || `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.originalname || file.filename || 'file',
          type: file.mimetype || 'application/octet-stream',
          size: file.bytes || file.size || 0,
          url: file.secure_url || file.url || file.path,
          publicId: file.public_id,
          previewUrl: file.mimetype?.startsWith('image/') ? (file.secure_url || file.url || file.path) : null
        }));
      } else {
        const uploadResult = await CloudinaryService.uploadMultipleFiles(
          files,
          'localpro/live-chat/attachments'
        );

        if (!uploadResult.success) {
          return res.status(500).json({
            success: false,
            message: 'Failed to upload files',
            error: uploadResult.errors
          });
        }

        attachments = uploadResult.data.map((uploadedFile, index) => ({
          id: uploadedFile.public_id,
          name: files[index].originalname || `file.${uploadedFile.format}`,
          type: files[index].mimetype || `image/${uploadedFile.format}`,
          size: uploadedFile.bytes || files[index].size,
          url: uploadedFile.secure_url,
          publicId: uploadedFile.public_id,
          previewUrl: uploadedFile.format ? uploadedFile.secure_url : null
        }));
      }
    }

    // Get agent info from authenticated user
    const agentName = `${req.user.firstName || 'Support'} ${req.user.lastName || 'Agent'}`.trim();
    const agentAvatar = req.user.profile?.avatar || agentName.charAt(0).toUpperCase();

    // Create message
    const message = await LiveChatMessage.create({
      sessionId,
      type: 'agent',
      content: content || `Sent ${attachments.length} file(s)`,
      agentName,
      agentAvatar,
      agentId: req.user.id,
      attachments
    });

    // Update session
    await session.updateLastMessage(message);

    // If this is first response, set firstResponseAt and assign agent
    if (!session.firstResponseAt) {
      session.firstResponseAt = new Date();
    }
    if (!session.assignedAgent) {
      session.assignedAgent = req.user.id;
      session.agentName = agentName;
    }
    session.status = 'active';
    await session.save();

    // Notify user via WebSocket (agent message to session)
    liveChatWebSocketService.notifyNewMessage(sessionId, message, false);

    res.status(201).json({
      success: true,
      message: 'Reply sent successfully',
      data: message
    });
  } catch (error) {
    logger.error('Send agent reply error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Assign session to agent
// @route   PATCH /api/admin/live-chat/sessions/:sessionId/assign
// @access  Private (Admin/Support)
const assignSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { agentId, agentName } = req.body;

    const session = await LiveChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    await session.assignToAgent(agentId, agentName);

    // Create system message
    const systemMessage = await LiveChatMessage.create({
      sessionId,
      type: 'system',
      content: `${agentName} has joined the chat.`
    });

    // Notify via WebSocket
    liveChatWebSocketService.notifyAgentAssignment(sessionId, { 
      id: agentId, 
      name: agentName 
    });
    liveChatWebSocketService.notifyNewMessage(sessionId, systemMessage, false);

    res.status(200).json({
      success: true,
      message: 'Session assigned successfully',
      data: session
    });
  } catch (error) {
    logger.error('Assign session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update session status
// @route   PATCH /api/admin/live-chat/sessions/:sessionId/status
// @access  Private (Admin/Support)
const updateSessionStatus = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { status, priority, department, tags } = req.body;

    const session = await LiveChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Update fields if provided
    if (status) {
      session.status = status;
      if (status === 'closed') {
        session.endedAt = new Date();
      }
    }
    if (priority) session.priority = priority;
    if (department) session.department = department;
    if (tags) session.tags = tags;

    await session.save();

    // Create system message for status change
    if (status === 'closed') {
      const systemMessage = await LiveChatMessage.create({
        sessionId,
        type: 'system',
        content: 'This chat session has been closed by support.'
      });
      liveChatWebSocketService.notifyNewMessage(sessionId, systemMessage, false);
    }

    // Notify status change via WebSocket
    liveChatWebSocketService.notifySessionStatusChange(
      sessionId, 
      session.status,
      req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System'
    );

    res.status(200).json({
      success: true,
      message: 'Session updated successfully',
      data: session
    });
  } catch (error) {
    logger.error('Update session status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Add internal note to session
// @route   POST /api/admin/live-chat/sessions/:sessionId/notes
// @access  Private (Admin/Support)
const addSessionNote = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required'
      });
    }

    const session = await LiveChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.notes.push({
      content,
      addedBy: req.user.id
    });

    await session.save();

    res.status(201).json({
      success: true,
      message: 'Note added successfully',
      data: session.notes[session.notes.length - 1]
    });
  } catch (error) {
    logger.error('Add session note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Transfer session to another agent
// @route   POST /api/admin/live-chat/sessions/:sessionId/transfer
// @access  Private (Admin/Support)
const transferSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { toAgentId, toAgentName, reason } = req.body;

    if (!toAgentId) {
      return res.status(400).json({
        success: false,
        message: 'Target agent ID is required'
      });
    }

    const session = await LiveChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const previousAgent = session.agentName || 'Previous Agent';
    await session.assignToAgent(toAgentId, toAgentName);

    // Create system message
    await LiveChatMessage.create({
      sessionId,
      type: 'system',
      content: `Chat transferred from ${previousAgent} to ${toAgentName}${reason ? ` (Reason: ${reason})` : ''}`
    });

    // Add internal note
    session.notes.push({
      content: `Transferred from ${previousAgent} to ${toAgentName}. Reason: ${reason || 'Not specified'}`,
      addedBy: req.user.id
    });
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Session transferred successfully',
      data: session
    });
  } catch (error) {
    logger.error('Transfer session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get chat analytics
// @route   GET /api/admin/live-chat/analytics
// @access  Private (Admin)
const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get basic stats
    const stats = await LiveChatSession.getAnalytics(start, end);

    // Get response time stats
    const responseTimeStats = await LiveChatSession.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          firstResponseAt: { $exists: true }
        }
      },
      {
        $project: {
          responseTime: { $subtract: ['$firstResponseAt', '$startedAt'] }
        }
      },
      {
        $group: {
          _id: null,
          avgResponseTime: { $avg: '$responseTime' },
          minResponseTime: { $min: '$responseTime' },
          maxResponseTime: { $max: '$responseTime' }
        }
      }
    ]);

    // Get sessions by day
    const sessionsByDay = await LiveChatSession.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get top agents
    const topAgents = await LiveChatSession.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          assignedAgent: { $exists: true },
          status: 'closed'
        }
      },
      {
        $group: {
          _id: '$assignedAgent',
          sessionsHandled: { $sum: 1 },
          avgRating: { $avg: '$rating.score' }
        }
      },
      { $sort: { sessionsHandled: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period: { start, end },
        overview: stats,
        responseTime: responseTimeStats[0] || null,
        sessionsByDay,
        topAgents
      }
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get customer chat history by email
// @route   GET /api/admin/live-chat/customers/:email/history
// @access  Private (Admin/Support)
const getCustomerHistory = async (req, res) => {
  try {
    const { email } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const sessions = await LiveChatSession.find({
      'user.email': email.toLowerCase()
    })
      .populate('assignedAgent', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await LiveChatSession.countDocuments({
      'user.email': email.toLowerCase()
    });

    res.status(200).json({
      success: true,
      count: sessions.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: sessions
    });
  } catch (error) {
    logger.error('Get customer history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete session (admin)
// @route   DELETE /api/admin/live-chat/sessions/:sessionId
// @access  Private (Admin)
const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await LiveChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Delete all messages for this session
    await LiveChatMessage.deleteMany({ sessionId });

    // Delete session
    await LiveChatSession.deleteOne({ sessionId });

    logger.info('[LiveChat] Session deleted:', { sessionId, deletedBy: req.user.id });

    res.status(200).json({
      success: true,
      message: 'Session and all messages deleted successfully'
    });
  } catch (error) {
    logger.error('Delete session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send typing indicator
// @route   POST /api/live-chat/sessions/:sessionId/typing
// @access  Public (with session ID) / Private (Admin)
const sendTypingIndicator = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { isTyping, isAgent } = req.body;

    // Broadcast typing indicator via WebSocket
    const event = isAgent ? 'agent_typing' : 'user_typing';
    liveChatWebSocketService.broadcastToSession(sessionId, { 
      type: event, 
      sessionId,
      isTyping,
      timestamp: new Date().toISOString()
    });

    // Also notify admins if user is typing
    if (!isAgent) {
      liveChatWebSocketService.broadcastToAdmins({
        type: 'user_typing',
        sessionId,
        isTyping,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Typing indicator sent'
    });
  } catch (error) {
    logger.error('Send typing indicator error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  // Public endpoints
  createSession,
  getSession,
  sendMessage,
  getMessages,
  uploadAttachment,
  endSession,
  rateSession,
  sendTypingIndicator,

  // Admin endpoints
  getAdminSessions,
  getAdminSession,
  sendAgentReply,
  assignSession,
  updateSessionStatus,
  addSessionNote,
  transferSession,
  getAnalytics,
  getCustomerHistory,
  deleteSession
};

