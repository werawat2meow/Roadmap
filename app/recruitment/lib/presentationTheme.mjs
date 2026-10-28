const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const DEFAULT_PRESENTATION_THEME = {
  presentation_text_color: "#13294B",
  presentation_muted_text_color: "#718096",
};

function resolveHexColor(value, fallback) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return HEX_COLOR_PATTERN.test(normalized) ? normalized : fallback;
}

export function resolvePresentationTheme(branch = {}) {
  return {
    presentation_text_color: resolveHexColor(
      branch?.presentation_text_color,
      DEFAULT_PRESENTATION_THEME.presentation_text_color,
    ),
    presentation_muted_text_color: resolveHexColor(
      branch?.presentation_muted_text_color,
      DEFAULT_PRESENTATION_THEME.presentation_muted_text_color,
    ),
  };
}
