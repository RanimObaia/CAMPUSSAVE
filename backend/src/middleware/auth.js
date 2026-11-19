const { auth } = require('../config/firebase');

// Verifies the Firebase ID token sent as "Authorization: Bearer <token>"
// and attaches { uid, email, role } to req.user.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing auth token' });

  try {
    const decoded = await auth.verifyIdToken(token);
    req.user = { uid: decoded.uid, email: decoded.email, role: decoded.role || null };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Usage: router.post('/offers', requireAuth, requireRole('merchant'), handler)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
