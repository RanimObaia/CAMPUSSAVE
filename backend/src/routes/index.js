const { Router } = require("express");

const { limiteSensible } = require("../middleware/limiteur");
const router = Router();

router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "campussave-api",
    time: new Date().toISOString(),
  });
});

router.use("/auth", limiteSensible, require("./auth.routes"));
router.use("/users", require("./users.routes"));
router.use("/shops", require("./shops.routes"));
router.use("/admin", require("./admin.routes"));
router.use("/offers", require("./offers.routes"));

// À brancher au fur et à mesure :
router.use("/orders", require("./orders.routes"));
router.use("/payments", require("./payments.routes"));
router.use("/stats", require("./stats.routes"));
router.use("/notifications", require("./notifications.routes"));
router.use("/reports", require("./reports.routes"));
router.use("/contact", limiteSensible, require("./contact.routes"));

module.exports = router;

