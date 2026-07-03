const { allocateTables, calculateEndTime, isOverlapping } = require('../utils/reservationEngine');

describe('Reservation Allocation Engine Tests', () => {
  let mockSettings;
  let mockTables;

  beforeEach(() => {
    mockSettings = {
      reservationDuration: 120, // 2 hours
      bufferTimeMinutes: 15,
      openingHour: '11:00',
      closingHour: '23:00'
    };

    mockTables = [
      { _id: 't2', number: 'T2', capacity: 2, status: 'available' },
      { _id: 't4', number: 'T4', capacity: 4, status: 'available' },
      { _id: 't6', number: 'T6', capacity: 6, status: 'available' },
      { _id: 't8', number: 'T8', capacity: 8, status: 'available' },
      { _id: 't10', number: 'T10', capacity: 10, status: 'available' },
      { _id: 'tMaint', number: 'T14', capacity: 10, status: 'maintenance' }
    ];
  });

  test('should calculate correct end times', () => {
    expect(calculateEndTime('18:00', 120)).toBe('20:00');
    expect(calculateEndTime('22:00', 90)).toBe('23:30');
    expect(calculateEndTime('23:00', 120)).toBe('01:00'); // Handles wraps
  });

  test('should correctly identify overlapping slots', () => {
    // Overlapping: Slot 1: 18:00 - 20:00, Slot 2: 19:00 - 21:00
    expect(isOverlapping('18:00', '20:00', '19:00', '21:00')).toBe(true);
    // Overlapping: Slot 1: 18:00 - 20:00, Slot 2: 17:30 - 18:30
    expect(isOverlapping('18:00', '20:00', '17:30', '18:30')).toBe(true);
    // Overlapping: Slot 1: 18:00 - 20:00, Slot 2: 18:00 - 20:00 (exact)
    expect(isOverlapping('18:00', '20:00', '18:00', '20:00')).toBe(true);
    
    // Non-overlapping (adjacent slots)
    expect(isOverlapping('18:00', '20:00', '20:00', '22:00')).toBe(false);
    expect(isOverlapping('18:00', '20:00', '16:00', '18:00')).toBe(false);
    expect(isOverlapping('18:00', '20:00', '21:00', '23:00')).toBe(false);
  });

  test('should reject reservation request outside operational hours', () => {
    try {
      allocateTables({
        guests: 4,
        date: '2026-07-02',
        startTime: '10:00', // Opens at 11:00
        allTables: mockTables,
        activeReservations: [],
        settings: mockSettings
      });
      fail('Should have thrown OUT_OF_HOURS');
    } catch (e) {
      expect(e.code).toBe('OUT_OF_HOURS');
    }

    try {
      allocateTables({
        guests: 4,
        date: '2026-07-02',
        startTime: '22:00', // Duration 2h -> Ends at 00:00 (Closes at 23:00)
        allTables: mockTables,
        activeReservations: [],
        settings: mockSettings
      });
      fail('Should have thrown OUT_OF_HOURS');
    } catch (e) {
      expect(e.code).toBe('OUT_OF_HOURS');
    }
  });

  test('should assign the smallest suitable table first (Maximizing utilization)', () => {
    // 5 guests should get Table 6 (capacity 6), not Table 8 or Table 10
    const allocation = allocateTables({
      guests: 5,
      date: '2026-07-02',
      startTime: '18:00',
      allTables: mockTables,
      activeReservations: [],
      settings: mockSettings
    });

    expect(allocation.tables).toHaveLength(1);
    expect(allocation.tables[0]._id).toBe('t6');
    expect(allocation.joined).toBe(false);
    expect(allocation.endTime).toBe('20:00');
  });

  test('should reject assignment if table is already booked in that slot', () => {
    const activeReservations = [
      {
        tables: ['t6'],
        date: '2026-07-02',
        startTime: '17:00',
        endTime: '19:15' // 17:00 to 19:00 + 15 min buffer
      }
    ];

    // Table 6 is occupied, so a booking for 5 guests should fallback to Table 8 (since Table 6 is busy)
    const allocation = allocateTables({
      guests: 5,
      date: '2026-07-02',
      startTime: '18:00',
      allTables: mockTables,
      activeReservations,
      settings: mockSettings
    });

    expect(allocation.tables).toHaveLength(1);
    expect(allocation.tables[0]._id).toBe('t8');
    expect(allocation.joined).toBe(false);
  });

  test('should perform table joining when no single table is big enough', () => {
    // Request for 13 guests. Max single table capacity is 10.
    // The engine should find a combination of available tables (e.g. Table 6 and Table 8 = combined capacity 14)
    const allocation = allocateTables({
      guests: 13,
      date: '2026-07-02',
      startTime: '18:00',
      allTables: mockTables,
      activeReservations: [],
      settings: mockSettings
    });

    expect(allocation.joined).toBe(true);
    // Combine Table 6 and Table 8
    const assignedIds = allocation.tables.map(t => t._id);
    expect(assignedIds).toContain('t6');
    expect(assignedIds).toContain('t8');
    expect(allocation.tables).toHaveLength(2);
  });

  test('should throw TABLE_UNAVAILABLE if capacity is exceeded', () => {
    try {
      allocateTables({
        guests: 100, // Beyond total combined capacity
        date: '2026-07-02',
        startTime: '18:00',
        allTables: mockTables,
        activeReservations: [],
        settings: mockSettings
      });
      fail('Should have thrown TABLE_UNAVAILABLE');
    } catch (e) {
      expect(e.code).toBe('TABLE_UNAVAILABLE');
    }
  });
});
