// ─────────────────────────────────────────────────────────────────────────────
// NIMIPIKO Design System — Phase 2
// Semantic theme interface + HP implementation
//
// Usage:
//   import { hpTheme, DS_VARS, useDesignTokens } from "@/lib/design-system/theme"
//
// Phases:
//   Phase 2 (this file) — define tokens, wire CSS vars, keep HP classes intact
//   Phase 3             — migrate components from hp-* classes to var(--ds-*)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Theme interface — all values are raw CSS strings
// ─────────────────────────────────────────────────────────────────────────────

export interface Theme {
  id:   string;
  name: string;

  /** Background / surface colors */
  surface: {
    page:       string;  // full-page app background
    card:       string;  // card / panel background
    cardHover:  string;  // card on mouse-over
    cardActive: string;  // card pressed / selected
    input:      string;  // form field background
    nav:        string;  // navigation bar background
    overlay:    string;  // modal backdrop (semi-transparent dark)
    tooltip:    string;  // tooltip / popover background
  };

  /** Text colors */
  text: {
    primary:   string;  // headings, body copy
    secondary: string;  // labels, captions, supporting text
    tertiary:  string;  // faint / disabled / placeholder
    inverse:   string;  // text on colored or dark surfaces
    brand:     string;  // brand-accented inline text / icon color
  };

  /** Border colors */
  border: {
    primary: string;  // default card / input outline
    strong:  string;  // emphasis border
    brand:   string;  // brand-colored border (selected / active state)
  };

  /** Brand / interactive */
  brand: {
    primary: string;  // primary CTA button fill
    hover:   string;  // primary CTA hover
    pressed: string;  // primary CTA pressed / active
    soft:    string;  // translucent brand wash (icon badges, soft highlights)
    subtle:  string;  // very-light brand-tinted surface (e.g. green-50)
  };

  /** Navigation */
  nav: {
    bg:           string;  // nav bar background
    activeBg:     string;  // active nav item background
    activeText:   string;  // active nav item text / icon color
    inactiveText: string;  // idle nav item text
    inactiveIcon: string;  // idle nav item icon
    border:       string;  // nav bottom border / section divider
  };

  /** Elevation */
  shadow: {
    card:  string;  // default card drop-shadow
    nav:   string;  // navigation bar shadow
    hover: string;  // elevated / hovered card shadow
    cta:   string;  // CTA button brand-tinted glow
  };

  /** Progress indicators */
  progress: {
    track: string;  // empty rail color
    fill:  string;  // filled portion color
  };

  /** Semantic state */
  state: {
    success: string;  // confirmation / correct
    error:   string;  // destructive / incorrect
    warning: string;  // caution
    focus:   string;  // keyboard focus ring
  };

  // Semantic gradients — Tailwind color-stop strings (from-X via-Y to-Z).
  // Spread into className: `bg-gradient-to-r ${theme.gradients.hero}`
  // Direction (bg-gradient-to-{b,br,...}) is always chosen at the call site.
  gradients: {
    hero:              string;  // hero / header section gradient
    progress:          string;  // progress bar fill gradient
    badge:             string;  // achievement badge gradient
    card:              string;  // accent card gradient (sparse use)
    // ── Page & large-section backgrounds ──────────────────────────────────
    pageBg:            string;  // full-page tinted background (WhoIsPlaying, LogoutModal)
    chatBg:            string;  // NimiChat full-screen overlay background
    storyReader:       string;  // dark immersive reader body (StoryFlipBook)
    storyReaderHeader: string;  // dark reader top bar (StoryFlipBook header)
    storyHeader:       string;  // story section hero (StoryHero base layer)
  };

  // Per-theme interaction feel — drives whileHover/whileTap targets and CSS transition bundles.
  // HP = bouncy/snappy; Ocean = fluid/smooth.
  motion: {
    // Tailwind transition class bundles — spread into className
    transitionFast:   string;  // micro-feedback (150ms HP / 200ms Ocean)
    transitionNormal: string;  // standard UI transition (200ms HP / 300ms Ocean)
    transitionSlow:   string;  // deliberate reveal (300ms HP / 500ms Ocean)
    // Framer-motion whileHover / whileTap values
    hoverScale:       number;  // scale on hover (1.04 HP / 1.02 Ocean)
    hoverLift:        number;  // translateY in px on hover, negative = up (-4 HP / -2 Ocean)
    tapScale:         number;  // scale on tap/press (0.97 HP / 0.98 Ocean)
    // Spring feel (used by useThemeMotion() for modal / card entrances)
    springStiffness:  number;  // 260 HP / 160 Ocean
    springDamping:    number;  // 18 HP  / 22 Ocean
    // Glow multiplier — 0–1 opacity factor applied to shadow / ring glows
    glowIntensity:    number;  // 0.35 HP / 0.25 Ocean
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CSS Custom Property Names
// Use these constants instead of bare strings when setting/reading --ds-* vars.
// ─────────────────────────────────────────────────────────────────────────────

export const DS_VARS = {
  surface: {
    page:       "--ds-surface-page",
    card:       "--ds-surface-card",
    cardHover:  "--ds-surface-card-hover",
    cardActive: "--ds-surface-card-active",
    input:      "--ds-surface-input",
    nav:        "--ds-surface-nav",
    overlay:    "--ds-surface-overlay",
    tooltip:    "--ds-surface-tooltip",
  },
  text: {
    primary:   "--ds-text-primary",
    secondary: "--ds-text-secondary",
    tertiary:  "--ds-text-tertiary",
    inverse:   "--ds-text-inverse",
    brand:     "--ds-text-brand",
  },
  border: {
    primary: "--ds-border-primary",
    strong:  "--ds-border-strong",
    brand:   "--ds-border-brand",
  },
  brand: {
    primary: "--ds-brand-primary",
    hover:   "--ds-brand-hover",
    pressed: "--ds-brand-pressed",
    soft:    "--ds-brand-soft",
    subtle:  "--ds-brand-subtle",
  },
  nav: {
    bg:           "--ds-nav-bg",
    activeBg:     "--ds-nav-active-bg",
    activeText:   "--ds-nav-active-text",
    inactiveText: "--ds-nav-inactive-text",
    inactiveIcon: "--ds-nav-inactive-icon",
    border:       "--ds-nav-border",
  },
  shadow: {
    card:  "--ds-shadow-card",
    nav:   "--ds-shadow-nav",
    hover: "--ds-shadow-hover",
    cta:   "--ds-shadow-cta",
  },
  progress: {
    track: "--ds-progress-track",
    fill:  "--ds-progress-fill",
  },
  state: {
    success: "--ds-state-success",
    error:   "--ds-state-error",
    warning: "--ds-state-warning",
    focus:   "--ds-state-focus",
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// applyThemeVars — writes a Theme object to the DOM as --ds-* CSS properties
// ─────────────────────────────────────────────────────────────────────────────

export function applyThemeVars(tokens: Theme, root = document.documentElement): void {
  const s = root.style;

  s.setProperty(DS_VARS.surface.page,       tokens.surface.page);
  s.setProperty(DS_VARS.surface.card,       tokens.surface.card);
  s.setProperty(DS_VARS.surface.cardHover,  tokens.surface.cardHover);
  s.setProperty(DS_VARS.surface.cardActive, tokens.surface.cardActive);
  s.setProperty(DS_VARS.surface.input,      tokens.surface.input);
  s.setProperty(DS_VARS.surface.nav,        tokens.surface.nav);
  s.setProperty(DS_VARS.surface.overlay,    tokens.surface.overlay);
  s.setProperty(DS_VARS.surface.tooltip,    tokens.surface.tooltip);

  s.setProperty(DS_VARS.text.primary,   tokens.text.primary);
  s.setProperty(DS_VARS.text.secondary, tokens.text.secondary);
  s.setProperty(DS_VARS.text.tertiary,  tokens.text.tertiary);
  s.setProperty(DS_VARS.text.inverse,   tokens.text.inverse);
  s.setProperty(DS_VARS.text.brand,     tokens.text.brand);

  s.setProperty(DS_VARS.border.primary, tokens.border.primary);
  s.setProperty(DS_VARS.border.strong,  tokens.border.strong);
  s.setProperty(DS_VARS.border.brand,   tokens.border.brand);

  s.setProperty(DS_VARS.brand.primary, tokens.brand.primary);
  s.setProperty(DS_VARS.brand.hover,   tokens.brand.hover);
  s.setProperty(DS_VARS.brand.pressed, tokens.brand.pressed);
  s.setProperty(DS_VARS.brand.soft,    tokens.brand.soft);
  s.setProperty(DS_VARS.brand.subtle,  tokens.brand.subtle);

  s.setProperty(DS_VARS.nav.bg,           tokens.nav.bg);
  s.setProperty(DS_VARS.nav.activeBg,     tokens.nav.activeBg);
  s.setProperty(DS_VARS.nav.activeText,   tokens.nav.activeText);
  s.setProperty(DS_VARS.nav.inactiveText, tokens.nav.inactiveText);
  s.setProperty(DS_VARS.nav.inactiveIcon, tokens.nav.inactiveIcon);
  s.setProperty(DS_VARS.nav.border,       tokens.nav.border);

  s.setProperty(DS_VARS.shadow.card,  tokens.shadow.card);
  s.setProperty(DS_VARS.shadow.nav,   tokens.shadow.nav);
  s.setProperty(DS_VARS.shadow.hover, tokens.shadow.hover);
  s.setProperty(DS_VARS.shadow.cta,   tokens.shadow.cta);

  s.setProperty(DS_VARS.progress.track, tokens.progress.track);
  s.setProperty(DS_VARS.progress.fill,  tokens.progress.fill);

  s.setProperty(DS_VARS.state.success, tokens.state.success);
  s.setProperty(DS_VARS.state.error,   tokens.state.error);
  s.setProperty(DS_VARS.state.warning, tokens.state.warning);
  s.setProperty(DS_VARS.state.focus,   tokens.state.focus);
  // gradients are Tailwind class strings — not CSS properties, skip setProperty
}

// ─────────────────────────────────────────────────────────────────────────────
// Default (Nimipiko World) theme — garden/nature aesthetic, green brand
// ─────────────────────────────────────────────────────────────────────────────

export const defaultTheme: Theme = {
  id:   "default",
  name: "Nimipiko World",

  surface: {
    page:       "#F9FAFB",
    card:       "#FFFFFF",
    cardHover:  "#F9FAFB",
    cardActive: "#F3F4F6",
    input:      "#F9FAFB",
    nav:        "#FFFFFF",
    overlay:    "rgba(0,0,0,0.50)",
    tooltip:    "#111827",
  },

  text: {
    primary:   "#111827",
    secondary: "#6B7280",
    tertiary:  "rgba(107,114,128,0.45)",
    inverse:   "#FFFFFF",
    brand:     "#16A34A",
  },

  border: {
    primary: "#E5E7EB",
    strong:  "rgba(156,163,175,0.80)",
    brand:   "#16A34A",
  },

  brand: {
    primary: "#16A34A",
    hover:   "#15803D",
    pressed: "#166534",
    soft:    "rgba(22,163,74,0.10)",
    subtle:  "#F0FDF4",
  },

  nav: {
    bg:           "#FFFFFF",
    activeBg:     "#F0FDF4",
    activeText:   "#16A34A",
    inactiveText: "#374151",
    inactiveIcon: "#6B7280",
    border:       "#E5E7EB",
  },

  shadow: {
    card:  "0 4px 16px rgba(0,0,0,0.08)",
    nav:   "0 2px 8px rgba(0,0,0,0.06)",
    hover: "0 8px 28px rgba(0,0,0,0.14)",
    cta:   "0 4px 12px rgba(22,163,74,0.35)",
  },

  progress: {
    track: "#E5E7EB",
    fill:  "#16A34A",
  },

  state: {
    success: "#16A34A",
    error:   "#DC2626",
    warning: "#D97706",
    focus:   "#16A34A",
  },

  gradients: {
    hero:              "from-green-500 to-emerald-600",
    progress:          "from-green-400 via-emerald-400 to-green-500",
    badge:             "from-green-400 to-emerald-500",
    card:              "from-green-50 to-emerald-50",
    pageBg:            "from-green-50 via-white to-emerald-50",
    chatBg:            "from-green-100 to-yellow-100",
    storyReader:       "from-green-950 via-gray-900 to-gray-950",
    storyReaderHeader: "from-green-900/70 via-gray-900/60 to-emerald-900/70",
    // No colour tint — garden art is vivid, let it show through fully
    storyHeader:       "from-transparent to-transparent",
  },

  motion: {
    transitionFast:   "transition-all duration-150 ease-out",
    transitionNormal: "transition-all duration-200 ease-in-out",
    transitionSlow:   "transition-all duration-300 ease-in-out",
    hoverScale:       1.04,
    hoverLift:        -4,
    tapScale:         0.97,
    springStiffness:  260,
    springDamping:    18,
    glowIntensity:    0.35,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// App-level theme registry
// ─────────────────────────────────────────────────────────────────────────────

export type AppThemeId = "default";

export const APP_THEMES: Record<AppThemeId, Theme> = {
  default: defaultTheme,
};

export function getAppTheme(id: AppThemeId): Theme {
  return APP_THEMES[id] ?? defaultTheme;
}
