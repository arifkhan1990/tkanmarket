import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Absolute http(s) URLs or `/fabrics/` relative R2 paths: set `unoptimized` on `next/image`. */
export function isRemoteImageSrc(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/fabrics/')
}

