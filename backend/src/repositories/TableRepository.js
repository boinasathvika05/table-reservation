const Table = require('../models/Table');

class TableRepository {
  async findAll() {
    return await Table.find({}).sort({ number: 1 });
  }

  async findAvailable() {
    return await Table.find({ status: 'available' }).sort({ capacity: 1, number: 1 });
  }

  async findById(id) {
    return await Table.findById(id);
  }

  async findByNumber(number) {
    return await Table.findOne({ number });
  }

  async create(tableData) {
    const table = new Table(tableData);
    return await table.save();
  }

  async update(id, tableData) {
    return await Table.findByIdAndUpdate(id, tableData, {
      new: true,
      runValidators: true
    });
  }

  async delete(id) {
    return await Table.findByIdAndDelete(id);
  }
}

module.exports = new TableRepository();
