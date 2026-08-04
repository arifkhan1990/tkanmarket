import { NextResponse } from 'next/server'

/**
 * Liveness/readiness probe used by the container HEALTHCHECK and GCP load
 * balancing. Returns 200 when the process is up; does NOT touch the DB so it
 * won't crash-loop Cloud Run over transient dependency blips.
 */
export function GET(): NextResponse {
  return NextResponse.json({ status: 'ok', uptime: process.uptime() })
}