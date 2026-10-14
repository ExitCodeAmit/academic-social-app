const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.authenticateToken = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  let payload;
  try {
    payload = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: 'Your session is invalid or has expired. Please sign in again.' });
    }
    return next(error);
  }

  try {
    const result = await db.query('SELECT id, role FROM users WHERE id = $1', [payload.id]);
    if (!result.rowCount) return res.status(401).json({ message: 'Your account is no longer available.' });
    req.user = result.rows[0];
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }
  return next();
};
