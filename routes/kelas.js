const router = require('express').Router();
const KelasOnline = require('../model/kelasOnline');
const validate = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const schemas = require('../utils/validation');
const { createUnique } = require('../utils/createUnique');

router.get('/getKelas', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=60');
  res.json(await KelasOnline.find().select('title pathImg -_id').lean());
});

router.post(
  '/addKelas',
  requireAuth,
  requireAdmin,
  validate(schemas.kelas),
  async (req, res) => {
    const kelas = await createUnique(KelasOnline, req.body, 'Sudah ada kelas serupa');
    res.status(201).json({ kelas: kelas._id });
  },
);

module.exports = router;
