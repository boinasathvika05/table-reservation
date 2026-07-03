const express = require('express');
const { getTables, createTable, updateTable, deleteTable } = require('../controllers/tableController');
const { tableValidator } = require('../validators/requestValidators');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getTables);
router.post('/', protect, adminOnly, tableValidator, createTable);
router.put('/:id', protect, adminOnly, tableValidator, updateTable);
router.delete('/:id', protect, adminOnly, deleteTable);

module.exports = router;
