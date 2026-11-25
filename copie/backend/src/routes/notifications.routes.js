const { Router } = require('express');
const { requireAuth } = require('../middleware/auth');
const c = require('../controllers/notifications.controller');

const router = Router();
router.use(requireAuth);
router.get('/', c.lister);
router.post('/tout-lu', c.toutLu);
router.patch('/:id/lu', c.marquerLue);

module.exports = router;
