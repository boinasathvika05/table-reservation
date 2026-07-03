const logger = require('../config/logger');

/**
 * Calculates end time based on start time and duration (in minutes).
 * @param {string} startTime - format "HH:MM"
 * @param {number} durationMinutes
 * @returns {string} - format "HH:MM"
 */
const calculateEndTime = (startTime, durationMinutes) => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
};

/**
 * Checks if two time slots overlap.
 * @param {string} start1 - "HH:MM"
 * @param {string} end1 - "HH:MM"
 * @param {string} start2 - "HH:MM"
 * @param {string} end2 - "HH:MM"
 * @returns {boolean}
 */
const isOverlapping = (start1, end1, start2, end2) => {
  return start1 < end2 && start2 < end1;
};

/**
 * Finds the optimal set of tables for a given guest count.
 * Backtracking algorithm to minimize capacity waste and tables joined.
 * @param {Array} freeTables - List of currently unoccupied Table documents
 * @param {number} targetGuests - Required capacity
 * @returns {Array|null} - Array of Table documents or null
 */
const findOptimalCombination = (freeTables, targetGuests) => {
  let bestCombination = null;
  let minCapacity = Infinity;
  let minTableCount = Infinity;

  // Sort tables by capacity descending to find a potential match quickly (helps with pruning)
  const sortedTables = [...freeTables].sort((a, b) => b.capacity - a.capacity);

  // Backtracking helper
  const backtrack = (index, currentCombo, currentCapacity) => {
    // If we meet the target capacity
    if (currentCapacity >= targetGuests) {
      const currentTableCount = currentCombo.length;
      const currentMaxTable = Math.max(...currentCombo.map(t => t.capacity));
      const bestMaxTable = bestCombination ? Math.max(...bestCombination.map(t => t.capacity)) : Infinity;
      
      // We want to minimize total capacity (minimize waste)
      // If capacity is equal, minimize the number of tables joined
      // If table count is equal, prefer the combination that uses smaller maximum tables
      if (
        currentCapacity < minCapacity ||
        (currentCapacity === minCapacity && currentTableCount < minTableCount) ||
        (currentCapacity === minCapacity && currentTableCount === minTableCount && currentMaxTable < bestMaxTable)
      ) {
        minCapacity = currentCapacity;
        minTableCount = currentTableCount;
        bestCombination = [...currentCombo];
      }
      return;
    }

    if (index >= sortedTables.length) {
      return;
    }

    // Pruning: if current capacity is already worse than the best capacity we found, stop
    if (currentCapacity >= minCapacity) {
      return;
    }

    // Option 1: Include sortedTables[index]
    currentCombo.push(sortedTables[index]);
    backtrack(index + 1, currentCombo, currentCapacity + sortedTables[index].capacity);
    currentCombo.pop();

    // Option 2: Exclude sortedTables[index]
    backtrack(index + 1, currentCombo, currentCapacity);
  };

  backtrack(0, [], 0);
  return bestCombination;
};

/**
 * Core engine method to allocate tables.
 * @param {Object} params
 * @param {number} params.guests - Guest count
 * @param {string} params.date - Date in YYYY-MM-DD
 * @param {string} params.startTime - Time in HH:MM
 * @param {Array} params.allTables - All tables in the database
 * @param {Array} params.activeReservations - All reservations for the given date (excluding cancelled/no-show)
 * @param {Object} params.settings - Active restaurant settings
 * @returns {Object} - { tables: Array, joined: boolean, endTime: string }
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

const allocateTables = ({ guests, date, startTime, allTables, activeReservations, settings }) => {
  const { reservationDuration, bufferTimeMinutes, openingHour, closingHour } = settings;

  // Validate operational hours using minutes from midnight
  const startMins = timeToMinutes(startTime);
  const durationMins = reservationDuration;
  const endMins = startMins + durationMins;

  const openMins = timeToMinutes(openingHour);
  let closeMins = timeToMinutes(closingHour);

  // If closingHour is past midnight (e.g. 01:00 AM)
  if (closeMins < openMins) {
    closeMins += 24 * 60;
  }

  // If reservation wraps past midnight
  let adjustedEndMins = endMins;
  if (adjustedEndMins < startMins) {
    adjustedEndMins += 24 * 60;
  }

  if (startMins < openMins || adjustedEndMins > closeMins) {
    const err = new Error(`The requested time is outside our operational hours (${settings.openingHour} - ${settings.closingHour}). Please select a different time.`);
    err.code = 'OUT_OF_HOURS';
    err.statusCode = 400;
    throw err;
  }

  const endTime = calculateEndTime(startTime, reservationDuration);
  const endWithBuffer = calculateEndTime(startTime, reservationDuration + bufferTimeMinutes);

  // 1. Identify which tables are free during the requested slot
  const freeTables = allTables.filter(table => {
    // If the table is not available (e.g. in maintenance), exclude it
    if (table.status !== 'available') return false;

    // Check if there are overlapping reservations using this table
    const tableReservations = activeReservations.filter(res => 
      res.tables.some(tId => tId.toString() === table._id.toString())
    );

    const hasOverlap = tableReservations.some(res => 
      isOverlapping(startTime, endWithBuffer, res.startTime, res.endTime)
    );

    return !hasOverlap;
  });

  // 2. Try single table match (no joining)
  const singleTableCandidates = freeTables
    .filter(table => table.capacity >= guests)
    .sort((a, b) => a.capacity - b.capacity || a.number.localeCompare(b.number)); // Prefer smallest capacity, then alphabetically by table number

  if (singleTableCandidates.length > 0) {
    const selectedTable = singleTableCandidates[0];
    logger.info(`Engine: Allocated single table ${selectedTable.number} (capacity ${selectedTable.capacity}) for ${guests} guests.`);
    return {
      tables: [selectedTable],
      joined: false,
      endTime: calculateEndTime(startTime, reservationDuration) // Reservation duration without buffer is the public end time
    };
  }

  // 3. Try table joining combination search
  const optimalCombination = findOptimalCombination(freeTables, guests);
  if (optimalCombination && optimalCombination.length > 0) {
    const tableNumbers = optimalCombination.map(t => t.number).join(', ');
    logger.info(`Engine: Allocated joined tables [${tableNumbers}] (combined capacity ${optimalCombination.reduce((acc, t) => acc + t.capacity, 0)}) for ${guests} guests.`);
    return {
      tables: optimalCombination,
      joined: true,
      endTime: calculateEndTime(startTime, reservationDuration)
    };
  }

  // 4. No tables fit
  logger.warn(`Engine: Allocation failed for ${guests} guests on ${date} at ${startTime}. Available tables were insufficient.`);
  const err = new Error(`Cannot accommodate ${guests} guests at ${startTime}. The remaining available tables do not have enough combined capacity. Please try a different time or reduce the party size.`);
  err.code = 'TABLE_UNAVAILABLE';
  err.statusCode = 400;
  throw err;
};

module.exports = {
  allocateTables,
  calculateEndTime,
  isOverlapping
};
