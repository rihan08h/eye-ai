const { getEducationalChatResponse } = require('../services/chatService');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/chat
 * Educational Eye Health Chatbot
 */
const handleChat = asyncHandler(async (req, res, next) => {
  const { message, screeningId } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return next(new ApiError(400, 'Please provide a valid question or message'));
  }

  const reply = await getEducationalChatResponse(message.trim(), screeningId, req.user._id);

  res.status(200).json({
    success: true,
    reply,
    disclaimer:
      'RetinaAI Assistant is an educational AI guide. It does not provide medical diagnoses or prescribe medications.',
  });
});

module.exports = {
  handleChat,
};
