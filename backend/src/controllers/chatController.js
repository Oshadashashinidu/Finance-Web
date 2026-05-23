const chatService = require("../services/chatService");

async function create(req, res, next) {
  try {
    const data = await chatService.createChatCompletion(req.body);
    res.json({
      success: true,
      message: "Chat response generated.",
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create
};
