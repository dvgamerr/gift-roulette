export type GiftHistoryEntry = {
  readonly gifter: string;
  readonly receiver: string;
};

export type ExchangeState = {
  readonly availableParticipants: readonly string[];
  readonly history: readonly GiftHistoryEntry[];
  readonly firstGifter: string | null;
  readonly currentGifter: string | null;
};

const FULL_CIRCLE = 2 * Math.PI;

const normalizeAngle = (angle: number) =>
  ((angle % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;

export const parseParticipants = (value: string) => {
  const participants: string[] = [];
  const participantNames = new Set<string>();

  for (const rawName of value.split('\n')) {
    const name = rawName.trim();
    if (name !== '' && !participantNames.has(name)) {
      participantNames.add(name);
      participants.push(name);
    }
  }

  return participants;
};

export const createExchangeState = (participants: readonly string[]): ExchangeState => ({
  availableParticipants: [...participants],
  history: [],
  firstGifter: null,
  currentGifter: null
});

export const selectParticipant = (
  state: ExchangeState,
  selectedIndex: number
): ExchangeState => {
  const selectedParticipant = state.availableParticipants[selectedIndex];
  if (selectedParticipant === undefined) {
    throw new RangeError('Selected participant index is outside the available list.');
  }

  const availableParticipants = state.availableParticipants.filter(
    (_, index) => index !== selectedIndex
  );

  if (state.currentGifter === null) {
    return {
      availableParticipants,
      history: [...state.history],
      firstGifter: selectedParticipant,
      currentGifter: selectedParticipant
    };
  }

  const history = [
    ...state.history,
    { gifter: state.currentGifter, receiver: selectedParticipant }
  ];

  if (availableParticipants.length > 0) {
    return {
      availableParticipants,
      history,
      firstGifter: state.firstGifter,
      currentGifter: selectedParticipant
    };
  }

  if (state.firstGifter === null) {
    throw new Error('Exchange state is missing the first giver.');
  }

  return {
    availableParticipants,
    history: [
      ...history,
      { gifter: selectedParticipant, receiver: state.firstGifter }
    ],
    firstGifter: null,
    currentGifter: null
  };
};

export const getSpinTargetAngle = (
  currentAngle: number,
  selectedIndex: number,
  segmentCount: number,
  fullRotations: number
) => {
  if (
    !Number.isInteger(segmentCount) ||
    segmentCount < 1 ||
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex >= segmentCount
  ) {
    throw new RangeError('Selected segment index is outside the wheel.');
  }

  if (!Number.isInteger(fullRotations) || fullRotations < 0) {
    throw new RangeError('Full rotations must be a non-negative integer.');
  }

  const angleSlice = FULL_CIRCLE / segmentCount;
  const selectedCenter = -((selectedIndex * angleSlice) + angleSlice / 2);
  const distanceToTarget = normalizeAngle(currentAngle - selectedCenter);

  return currentAngle - (fullRotations * FULL_CIRCLE) - distanceToTarget;
};

export const getSelectedIndexAtPointer = (rotationAngle: number, segmentCount: number) => {
  if (!Number.isInteger(segmentCount) || segmentCount < 1) {
    throw new RangeError('A wheel must contain at least one segment.');
  }

  const angleSlice = FULL_CIRCLE / segmentCount;
  const wheelAngleAtPointer = normalizeAngle(-rotationAngle);
  return Math.floor(wheelAngleAtPointer / angleSlice) % segmentCount;
};
