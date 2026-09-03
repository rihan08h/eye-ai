const express = require('express');
const router = express.Router();

const {
  createCamp,
  getCamps,
  getCampById,
  updateCamp,
} = require('../controllers/camp.controller');
const { protect } = require('../middleware/auth.middleware');
const { allowRoles } = require('../middleware/role.middleware');

router.use(protect);

router
  .route('/')
  .post(allowRoles('healthworker', 'admin'), createCamp)
  .get(getCamps);

router
  .route('/:id')
  .get(getCampById)
  .put(allowRoles('healthworker', 'admin'), updateCamp);

module.exports = router;
