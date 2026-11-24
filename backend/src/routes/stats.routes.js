const { Router } = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const c = require('../controllers/stats.controller');

const router = Router();

// Chiffres des trois tableaux de bord (montants en millimes).
router.get('/student', requireAuth, requireRole(ROLES.STUDENT), c.etudiant);
router.get('/merchant', requireAuth, requireRole(ROLES.MERCHANT), c.commercant);
router.get('/admin', requireAuth, requireRole(ROLES.ADMIN), c.admin);

module.exports = router;