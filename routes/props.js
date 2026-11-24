const router = require('express').Router();
const Paket = require('../model/paket');
const Konselor = require('../model/konselor');
const Testi = require('../model/testi');
const validate = require('../middleware/validate');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const schemas = require('../utils/validation');
const { createUnique } = require('../utils/createUnique');

const asCard = ({ pathImg, ...rest }) => ({ img: pathImg, ...rest });

router.get('/getProps', async (req, res) => {
  const [paket, testi, konselor] = await Promise.all([
    Paket.find().select('pathImg pic title desc price isFav -_id').lean(),
    Testi.find().select('pathImg name desc role -_id').lean(),
    Konselor.find().select('pathImg name desc role -_id').lean(),
  ]);
  res.set('Cache-Control', 'public, max-age=60');
  res.json({
    props: {
      paket: paket.map(asCard),
      testi: testi.map(asCard),
      konselor: konselor.map(asCard),
    },
  });
});

const admin = [requireAuth, requireAdmin];

router.post('/addPaket', admin, validate(schemas.paket), async (req, res) => {
  const doc = await createUnique(Paket, req.body, 'Sudah ada paket serupa');
  res.status(201).json({ paket: doc._id });
});

router.post('/addTesti', admin, validate(schemas.person), async (req, res) => {
  const doc = await createUnique(Testi, req.body, 'Sudah ada testi serupa');
  res.status(201).json({ testi: doc._id });
});

router.post('/addKonselor', admin, validate(schemas.person), async (req, res) => {
  const doc = await createUnique(Konselor, req.body, 'Sudah ada nama dan role serupa');
  res.status(201).json({ konselor: doc._id });
});

module.exports = router;
