// middleware/authMiddleware.js
module.exports = (req, res, next) => {
  if (req.session && req.session.user) {
    // If a session exists and has a user, proceed.
    req.user = req.session.user; // Attach user to the request object
    return next();
  } else {
    // Otherwise, deny access.
    return res.status(401).json({ message: 'Unauthorized: No active session.' });
  }
};
