const TableRepository = require('../repositories/TableRepository');
const Reservation = require('../models/Reservation');
const logger = require('../config/logger');

class TableService {
  async getAllTables() {
    return await TableRepository.findAll();
  }

  async getAvailableTables() {
    return await TableRepository.findAvailable();
  }

  async createTable(tableData) {
    const existing = await TableRepository.findByNumber(tableData.number);
    if (existing) {
      const error = new Error(`Table number ${tableData.number} already exists`);
      error.code = 'TABLE_NUMBER_EXISTS';
      throw error;
    }

    const table = await TableRepository.create(tableData);
    logger.info(`TableService: Created table ${table.number} (capacity: ${table.capacity})`);
    return table;
  }

  async updateTable(id, tableData) {
    // Check if table exists
    const table = await TableRepository.findById(id);
    if (!table) {
      const error = new Error('Table not found');
      error.code = 'TABLE_NOT_FOUND';
      throw error;
    }

    // Check if changing table number to one that already exists
    if (tableData.number && tableData.number !== table.number) {
      const existing = await TableRepository.findByNumber(tableData.number);
      if (existing) {
        const error = new Error(`Table number ${tableData.number} already exists`);
        error.code = 'TABLE_NUMBER_EXISTS';
        throw error;
      }
    }

    const updatedTable = await TableRepository.update(id, tableData);
    logger.info(`TableService: Updated table ${updatedTable.number}`);
    return updatedTable;
  }

  async deleteTable(id) {
    const table = await TableRepository.findById(id);
    if (!table) {
      const error = new Error('Table not found');
      error.code = 'TABLE_NOT_FOUND';
      throw error;
    }

    // Check if the table has active/future reservations before deleting
    const today = new Date().toISOString().split('T')[0];
    const activeReservations = await Reservation.find({
      tables: id,
      date: { $gte: today },
      status: { $in: ['pending', 'confirmed', 'checked_in'] }
    });

    if (activeReservations.length > 0) {
      const error = new Error('Cannot delete table with active or future reservations');
      error.code = 'TABLE_HAS_RESERVATIONS';
      throw error;
    }

    await TableRepository.delete(id);
    logger.info(`TableService: Deleted table ${table.number}`);
    return table;
  }
}

module.exports = new TableService();
