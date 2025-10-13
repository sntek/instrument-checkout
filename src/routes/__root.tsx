import { Outlet, createRootRoute } from '@tanstack/react-router'

import ClerkProvider from '../integrations/clerk/provider'

export const Route = createRootRoute({
  component: () => (
    <>
      <ClerkProvider>
        <div className="h-screen flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </ClerkProvider>
    </>
  ),
})
