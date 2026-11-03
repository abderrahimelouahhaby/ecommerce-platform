import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// No baseURL needed: the client calls /api/auth on the same address as the page,
// and the dev proxy (or the Vercel rewrite in production) forwards it to the API.
export const authClient = createAuthClient({
  plugins: [
    // Tells TypeScript about the extra "role" field we added to users on the server.
    // input: false means the client can never send it (the server refuses it too).
    inferAdditionalFields({
      user: {
        role: { type: "string", required: false, input: false },
      },
    }),
  ],
});
