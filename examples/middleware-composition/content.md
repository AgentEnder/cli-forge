## Type Definitions

Define the context types that middleware will add to args. These types flow through the middleware chain and are available in the handler with full type safety.

{{file:types.ts}}

## Timing Middleware

The timing middleware adds request tracking context. It runs first in our chain, establishing a start time that the handler can use to measure execution duration.

{{file:middleware/timing.ts}}

## Authentication Middleware

The auth middleware adds user context. Because it runs after the timing middleware, it receives args that already include `startTime` and `requestId`.

{{file:middleware/auth.ts}}

## Composing the CLI

The main CLI file imports middleware from separate modules and applies them in order. TypeScript correctly infers the accumulated type at each step of the chain.

{{file:cli.ts}}

## How Types Flow

When middleware is applied via `.middleware()`, the return type extends the args:

1. Initial args: `{ name: string }`
2. After `timingMiddleware`: `{ name: string, startTime: number, requestId: string }`
3. After `authMiddleware`: `{ name: string, startTime: number, requestId: string, user: User, authenticated: boolean }`

The handler receives the fully composed type, with autocomplete and type checking for all properties.
