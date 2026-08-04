import { NextResponse, type NextRequest } from 'next/server'

import { findDisabledFeatureForApi } from '@/lib/features'

type RouteHandler = (req: NextRequest, ctx: unknown) => Promise<Response> | Response

export function withFeatureGuard(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    const disabled = findDisabledFeatureForApi(req.nextUrl.pathname)
    if (disabled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: `Feature "${disabled.id}" is currently disabled`,
            statusCode: 404
          }
        },
        { status: 404 }
      )
    }
    return handler(req, ctx)
  }
}
