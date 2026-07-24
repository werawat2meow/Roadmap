export const COMPENSATION_ROUNDING_METHOD = {
  NONE: "none",

  UP: "up",

  DOWN: "down",

  NEAREST: "nearest",
};

export const COMPENSATION_ROUNDING_METHOD_OPTIONS = [
  {
    label: "None",
    value: COMPENSATION_ROUNDING_METHOD.NONE,
  },
  {
    label: "Round Up",
    value: COMPENSATION_ROUNDING_METHOD.UP,
  },
  {
    label: "Round Down",
    value: COMPENSATION_ROUNDING_METHOD.DOWN,
  },
  {
    label: "Nearest",
    value: COMPENSATION_ROUNDING_METHOD.NEAREST,
  },
];