/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Startbildschirm-Profil des C64: authentic | neutral | eigene ID (siehe src/c64/boot.ts) */
  readonly VITE_C64_BOOT_PROFILE?: string;
}
