const TableService = require('../services/TableService');

/**
 * @swagger
 * /tables:
 *   get:
 *     summary: Retrieve all tables
 *     tags: [Tables]
 *     responses:
 *       200:
 *         description: List of tables
 */
const getTables = async (req, res, next) => {
  try {
    const tables = await TableService.getAllTables();
    res.status(200).json({
      success: true,
      message: 'Tables retrieved successfully',
      data: { tables }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /tables:
 *   post:
 *     summary: Add a new table (Admin only)
 *     tags: [Tables]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - number
 *               - capacity
 *             properties:
 *               number:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [available, maintenance]
 *     responses:
 *       210:
 *         description: Table added
 */
const createTable = async (req, res, next) => {
  try {
    const { number, capacity, status } = req.body;
    const table = await TableService.createTable({ number, capacity, status });
    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: { table }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /tables/{id}:
 *   put:
 *     summary: Edit a table (Admin only)
 *     tags: [Tables]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Table updated
 */
const updateTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { number, capacity, status } = req.body;
    const table = await TableService.updateTable(id, { number, capacity, status });
    res.status(200).json({
      success: true,
      message: 'Table updated successfully',
      data: { table }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /tables/{id}:
 *   delete:
 *     summary: Remove a table (Admin only)
 *     tags: [Tables]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Table deleted
 */
const deleteTable = async (req, res, next) => {
  try {
    const { id } = req.params;
    await TableService.deleteTable(id);
    res.status(200).json({
      success: true,
      message: 'Table deleted successfully',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTables,
  createTable,
  updateTable,
  deleteTable
};
