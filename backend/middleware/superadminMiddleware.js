// backend/middleware/superadminMiddleware.js

const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ 
      message: 'Access denied. Super admin privileges required.' 
    });
  }
};

module.exports = { requireSuperAdmin };
