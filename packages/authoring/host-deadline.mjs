export const initialHostDeadlineMs = 90000;
export const hostDeadlineBounds = Object.freeze({min: 1000, max: 120000});
export const validHostDeadline = value => Number.isInteger(value) &&
  value >= hostDeadlineBounds.min && value <= hostDeadlineBounds.max;
export const hostDeadlineInstructionRevision = (revision, milliseconds) =>
  milliseconds === undefined ? revision : revision + '-host-' + milliseconds;
