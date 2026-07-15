// Thắt chặt bảo mật: Chỉ cho phép các tham số tạo/chia sẻ bài viết hợp lệ trong group đi qua
const noChatPolicy = (req, res, next) => {
  const allowedFields = ['post_id', 'caption', 'shared_by']; 
  const incomingFields = Object.keys(req.body);
  
  const hasInvalidField = incomingFields.some(field => !allowedFields.includes(field));
  if (hasInvalidField) {
    return res.status(400).json({ 
      success: false, 
      message: 'Yêu cầu không hợp lệ. Groups chỉ hỗ trợ chia sẻ nhạc/bài viết, không hỗ trợ tính năng chat text.' 
    });
  }
  next();
};

module.exports = { noChatPolicy };