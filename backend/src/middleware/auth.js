const { auth } = require('../config/firebase');

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

async function decode(token) {
  // checkRevoked = true : refuse aussi les comptes désactivés par l'admin.
  const decoded = await auth.verifyIdToken(token, true);
  return { uid: decoded.uid, email: decoded.email, role: decoded.role || null };
}

function refuse(res, err) {
  const desactive = err?.code === 'auth/user-disabled';
  res.status(401).json({
    code: desactive ? 'COMPTE_DESACTIVE' : 'NON_AUTHENTIFIE',
    message: desactive ? 'Ce compte a été désactivé.' : 'Session invalide ou expirée.',
  });
}

// Vérifie le jeton Firebase envoyé dans "Authorization: Bearer <jeton>"
// et place { uid, email, role } dans req.user.
async function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ code: 'NON_AUTHENTIFIE', message: 'Connexion requise.' });
  }
  try {
    req.user = await decode(token);
    next();
  } catch (err) {
    refuse(res, err);
  }
}

// Comme requireAuth, mais laisse passer les visiteurs (req.user = null).
async function optionalAuth(req, res, next) {
  const token = readToken(req);
  req.user = null;
  if (!token) return next();
  try {
    req.user = await decode(token);
    next();
  } catch (err) {
    refuse(res, err);
  }
}

// Exemple : router.post('/offers', requireAuth, requireRole('merchant'), handler)
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ code: 'ACCES_REFUSE', message: 'Accès réservé.' });
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
