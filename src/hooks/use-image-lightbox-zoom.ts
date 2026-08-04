'use client'

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'

const MIN_SCALE = 1
const MAX_SCALE = 4
const WHEEL_SENS = 0.0012

export type ImageLightboxPanZoom = {
  scale: number
  tx: number
  ty: number
}

type PinchStart = {
  d0: number
  s0: number
  tx0: number
  ty0: number
  mx0: number
  my0: number
}

type UseImageLightboxZoomOpts = {
  /** When false, listeners are inert and pinch effect cleans up. */
  active: boolean
  viewportRef: RefObject<HTMLElement | null>
}

export function useImageLightboxZoom(opts: UseImageLightboxZoomOpts) {
  const [{ scale, tx, ty }, setPanZoom] = useState<ImageLightboxPanZoom>({ scale: 1, tx: 0, ty: 0 })
  const panZoomRef = useRef<ImageLightboxPanZoom>({ scale, tx, ty })
  useEffect(() => {
    panZoomRef.current = { scale, tx, ty }
  }, [scale, tx, ty])

  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    origTx: number
    origTy: number
  } | null>(null)

  const reset = useCallback(() => {
    setPanZoom({ scale: 1, tx: 0, ty: 0 })
    dragRef.current = null
  }, [])

  const zoomByWheel = useCallback((deltaY: number, clientX: number, clientY: number, target: HTMLElement) => {
    const rect = target.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const mx = clientX - cx
    const my = clientY - cy
    const factor = 1 - deltaY * WHEEL_SENS
    setPanZoom(({ scale: prev, tx, ty }) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor))
      if (Math.abs(next - prev) < 1e-6) {
        return { scale: prev, tx, ty }
      }
      if (next <= MIN_SCALE) {
        return { scale: 1, tx: 0, ty: 0 }
      }
      const wx = (mx - tx) / prev
      const wy = (my - ty) / prev
      return { scale: next, tx: mx - wx * next, ty: my - wy * next }
    })
  }, [])

  const onWheel = useCallback(
    (e: React.WheelEvent<HTMLElement>) => {
      if (!opts.active) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      zoomByWheel(e.deltaY, e.clientX, e.clientY, e.currentTarget)
    },
    [opts.active, zoomByWheel]
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!opts.active || scale <= 1) {
        return
      }
      if (e.pointerType === 'mouse' && e.button !== 0) {
        return
      }
      e.currentTarget.setPointerCapture(e.pointerId)
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origTx: tx,
        origTy: ty
      }
    },
    [opts.active, scale, tx, ty]
  )

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current
    if (!d || d.pointerId !== e.pointerId) {
      return
    }
    setPanZoom((pz) => ({
      ...pz,
      tx: d.origTx + (e.clientX - d.startX),
      ty: d.origTy + (e.clientY - d.startY)
    }))
  }, [])

  const endDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current
    if (d && d.pointerId === e.pointerId) {
      dragRef.current = null
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* released */
      }
    }
  }, [])

  const zoomInStep = useCallback(() => {
    setPanZoom(({ scale: s, tx, ty }) => {
      const next = Math.min(MAX_SCALE, Number((s + 0.25).toFixed(2)))
      if (next <= s) {
        return { scale: s, tx, ty }
      }
      if (next <= MIN_SCALE) {
        return { scale: 1, tx: 0, ty: 0 }
      }
      const mx = 0
      const my = 0
      const wx = (mx - tx) / s
      const wy = (my - ty) / s
      return { scale: next, tx: mx - wx * next, ty: my - wy * next }
    })
  }, [])

  const zoomOutStep = useCallback(() => {
    setPanZoom(({ scale: s, tx, ty }) => {
      const next = Math.max(MIN_SCALE, Number((s - 0.25).toFixed(2)))
      if (next >= s) {
        return { scale: s, tx, ty }
      }
      if (next <= 1) {
        return { scale: 1, tx: 0, ty: 0 }
      }
      const mx = 0
      const my = 0
      const wx = (mx - tx) / s
      const wy = (my - ty) / s
      return { scale: next, tx: mx - wx * next, ty: my - wy * next }
    })
  }, [])

  const toggleZoomAt = useCallback((clientX: number, clientY: number, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const mx = clientX - cx
    const my = clientY - cy
    setPanZoom(({ scale: s, tx, ty }) => {
      if (s > 1) {
        return { scale: 1, tx: 0, ty: 0 }
      }
      const target = 2
      const wx = (mx - tx) / s
      const wy = (my - ty) / s
      return { scale: target, tx: mx - wx * target, ty: my - wy * target }
    })
  }, [])

  useEffect(() => {
    const el = opts.viewportRef.current
    if (!el || !opts.active) {
      return
    }

    let pinch: PinchStart | null = null

    const touchStart = (e: TouchEvent) => {
      if (e.touches.length !== 2) {
        return
      }
      const rect = el.getBoundingClientRect()
      const cxb = rect.left + rect.width / 2
      const cyb = rect.top + rect.height / 2
      const a = e.touches[0]
      const b = e.touches[1]
      if (!a || !b) {
        return
      }
      const d0 = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
      if (d0 < 8) {
        return
      }
      const mx0 = (a.clientX + b.clientX) / 2 - cxb
      const my0 = (a.clientY + b.clientY) / 2 - cyb
      const { scale: s0, tx: tx0, ty: ty0 } = panZoomRef.current
      pinch = { d0, s0, tx0, ty0, mx0, my0 }
    }

    const touchMove = (e: TouchEvent) => {
      if (!pinch || e.touches.length !== 2) {
        return
      }
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const cxb = rect.left + rect.width / 2
      const cyb = rect.top + rect.height / 2
      const a = e.touches[0]
      const b = e.touches[1]
      if (!a || !b) {
        return
      }
      const d = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY)
      const S = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinch.s0 * (d / pinch.d0)))
      if (S <= MIN_SCALE) {
        setPanZoom({ scale: 1, tx: 0, ty: 0 })
        return
      }
      const wx = (pinch.mx0 - pinch.tx0) / pinch.s0
      const wy = (pinch.my0 - pinch.ty0) / pinch.s0
      setPanZoom({
        scale: S,
        tx: pinch.mx0 - wx * S,
        ty: pinch.my0 - wy * S
      })
    }

    const touchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinch = null
      }
    }

    el.addEventListener('touchstart', touchStart, { passive: true })
    el.addEventListener('touchmove', touchMove, { passive: false })
    el.addEventListener('touchend', touchEnd)
    el.addEventListener('touchcancel', touchEnd)

    return () => {
      el.removeEventListener('touchstart', touchStart)
      el.removeEventListener('touchmove', touchMove)
      el.removeEventListener('touchend', touchEnd)
      el.removeEventListener('touchcancel', touchEnd)
    }
  }, [opts.active, opts.viewportRef])

  return {
    scale,
    tx,
    ty,
    reset,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
    zoomInStep,
    zoomOutStep,
    toggleZoomAt
  }
}
