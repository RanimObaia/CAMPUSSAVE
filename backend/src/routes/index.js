const { Router } = require('express');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'campussave-api', time: new Date().toISOString() });
});

// Feature routers are mounted here as they are built:
// router.use('/auth', require('./auth.routes'));
// router.use('/users', require('./users.routes'));
// router.use('/shops', require('./shops.routes'));
// router.use('/offers', require('./offers.routes'));
// router.use('/orders', require('./orders.routes'));
// router.use('/payments', require('./payments.routes'));
// router.use('/stats', require('./stats.routes'));

module.exports = router;
