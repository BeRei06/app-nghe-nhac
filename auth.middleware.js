const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      include: { model: Role }
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account is suspended' });
    }
    
    if (user.status === 'deleted') {
        return res.status(401).json({ message: 'Account has been deleted' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const creatorOnly = (req, res, next) => {
    const isCreator = req.user.Roles.some(role => role.name === 'creator');
    if (!isCreator) {
        return res.status(403).json({ message: 'Access denied. Creator role required.' });
    }
    next();
};

module.exports = { protect, creatorOnly };