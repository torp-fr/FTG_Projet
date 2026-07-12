import type { Config } from "tailwindcss";
import uiKitPreset from "../../packages/ui-kit/tailwind.preset";

export default {
  presets: [uiKitPreset as Partial<Config>],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "../../packages/ui-kit/src/**/*.{ts,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
