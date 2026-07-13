import { describe, expect, test } from 'bun:test';
import {
  createExchangeState,
  getSelectedIndexAtPointer,
  getSpinTargetAngle,
  parseParticipants,
  selectParticipant
} from './giftExchange';

describe('parseParticipants', () => {
  test('trims names, removes blanks, and keeps the first duplicate', () => {
    expect(parseParticipants(' Alice \n\nBob\nAlice\n Charlie ')).toEqual([
      'Alice',
      'Bob',
      'Charlie'
    ]);
  });
});

describe('gift exchange', () => {
  test('creates one closed exchange cycle without self-pairs', () => {
    for (let participantCount = 2; participantCount <= 20; participantCount += 1) {
      const participants = Array.from(
        { length: participantCount },
        (_, index) => `Participant ${index + 1}`
      );
      let state = createExchangeState(participants);

      while (state.availableParticipants.length > 0) {
        const selectedIndex = Math.floor(state.availableParticipants.length / 2);
        state = selectParticipant(state, selectedIndex);
      }

      expect(state.history).toHaveLength(participants.length);
      expect(state.history.every(({ gifter, receiver }) => gifter !== receiver)).toBe(true);
      expect(state.history.map(({ gifter }) => gifter).sort()).toEqual([...participants].sort());
      expect(state.history.map(({ receiver }) => receiver).sort()).toEqual([...participants].sort());
      expect(state.currentGifter).toBeNull();
      expect(state.firstGifter).toBeNull();
    }
  });

  test('rejects an unavailable winner index', () => {
    expect(() => selectParticipant(createExchangeState(['A', 'B']), 2)).toThrow(RangeError);
  });
});

describe('wheel targeting', () => {
  test('lands every selected segment at the pointer across repeated spins', () => {
    let currentAngle = 0;

    for (let segmentCount = 1; segmentCount <= 12; segmentCount += 1) {
      for (let selectedIndex = 0; selectedIndex < segmentCount; selectedIndex += 1) {
        const targetAngle = getSpinTargetAngle(currentAngle, selectedIndex, segmentCount, 5);

        expect(targetAngle).toBeLessThan(currentAngle);
        expect(getSelectedIndexAtPointer(targetAngle, segmentCount)).toBe(selectedIndex);
        currentAngle = targetAngle % (2 * Math.PI);
      }
    }
  });

  test('rejects fractional segment values', () => {
    expect(() => getSpinTargetAngle(0, 0.5, 3, 5)).toThrow(RangeError);
    expect(() => getSpinTargetAngle(0, 0, 3.5, 5)).toThrow(RangeError);
    expect(() => getSelectedIndexAtPointer(0, 3.5)).toThrow(RangeError);
  });
});
