import { createTheme } from "@mui/material/styles";
import type { ThemeOptions } from "@mui/material/styles";
import { tokens } from "./tokens";

const base: ThemeOptions = {
  cssVariables: true,
  palette: {
    primary: {
      main: tokens.color.blue,
      light: tokens.color.electric,
      dark: tokens.color.deepBlue,
      contrastText: tokens.color.surface,
    },
    secondary: {
      main: tokens.color.charcoal,
      contrastText: tokens.color.surface,
    },
    background: { default: tokens.color.canvas, paper: tokens.color.surface },
    text: { primary: tokens.color.ink, secondary: tokens.color.muted },
    divider: tokens.color.border,
    success: { main: tokens.color.success },
    warning: { main: tokens.color.warning },
    error: { main: tokens.color.error },
  },
  typography: {
    fontFamily: tokens.typography.family,
    h1: {
      fontSize: "clamp(2rem, 4.5vw, 3.6rem)",
      fontWeight: 700,
      lineHeight: 1.15,
      letterSpacing: "-0.045em",
    },
    h2: {
      fontSize: "clamp(1.5rem, 3vw, 2rem)",
      fontWeight: 700,
      letterSpacing: "-0.035em",
    },
    h3: { fontSize: "1.25rem", fontWeight: 600 },
    h4: { fontSize: "1.125rem", fontWeight: 600 },
    body1: { fontSize: "1rem", lineHeight: 1.7 },
    body2: { fontSize: ".875rem", lineHeight: 1.65 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: tokens.radius.medium },
  spacing: tokens.spacing.unit,
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { minHeight: 44, paddingInline: 20 } },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { outlined: { borderColor: tokens.color.border } },
    },
    MuiCard: {
      styleOverrides: { root: { border: `1px solid ${tokens.color.border}` } },
    },
    MuiTextField: { defaultProps: { fullWidth: true } },
    MuiTableCell: {
      styleOverrides: {
        head: { fontWeight: 600, background: tokens.color.canvas },
        root: { borderColor: tokens.color.border },
      },
    },
    MuiLink: { defaultProps: { underline: "hover" } },
    MuiCssBaseline: {
      styleOverrides: {
        body: { margin: 0 },
        "*": { boxSizing: "border-box" },
        ":focus-visible": {
          outline: `3px solid ${tokens.color.blue}`,
          outlineOffset: 3,
        },
        "::selection": { background: tokens.color.blueTint },
        a: { color: "inherit" },
        html: { scrollPaddingTop: 100 },
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animationDuration: "0.01ms !important",
            transitionDuration: "0.01ms !important",
            scrollBehavior: "auto !important",
          },
        },
      },
    },
  },
};
export const storefrontTheme = createTheme(base);
export const backofficeTheme = createTheme(base, {
  components: {
    MuiTableCell: { styleOverrides: { root: { padding: "14px 16px" } } },
    MuiCard: {
      styleOverrides: { root: { borderRadius: tokens.radius.medium } },
    },
  },
});
