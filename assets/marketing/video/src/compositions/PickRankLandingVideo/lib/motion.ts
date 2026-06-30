import { Easing, interpolate } from "remotion";

export const entrance = (frame: number, duration: number) =>
  interpolate(frame, [0, duration], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const fadeOut = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [1, 0], {
    easing: Easing.in(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const rise = (progress: number, distance = 32) =>
  interpolate(progress, [0, 1], [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const slideX = (progress: number, distance = 60) =>
  interpolate(progress, [0, 1], [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const scaleIn = (progress: number) =>
  interpolate(progress, [0, 1], [0.94, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const popIn = (
  progress: number,
  from = 0.9,
  peak = 1.035,
  settleAt = 0.72,
) => {
  if (progress <= settleAt) {
    return interpolate(progress, [0, settleAt], [from, peak], {
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  return interpolate(progress, [settleAt, 1], [peak, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

export const drift = (frame: number, distance: number, speed = 120) =>
  Math.sin(frame / speed) * distance;

export const bob = (frame: number, distance = 10, speed = 24) =>
  Math.sin(frame / speed) * distance;

export const shimmer = (frame: number, min = 0.65, max = 1, speed = 18) =>
  interpolate(Math.sin(frame / speed), [-1, 1], [min, max]);

export const pulse = (frame: number, min = 0.96, max = 1.04, speed = 16) =>
  interpolate(Math.sin(frame / speed), [-1, 1], [min, max]);

export const widthReveal = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const blurIn = (progress: number, maxBlur = 18) =>
  interpolate(progress, [0, 1], [maxBlur, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

export const clipReveal = (progress: number) =>
  interpolate(progress, [0, 1], [100, 0], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
