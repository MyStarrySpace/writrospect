import "server-only";

import { StackServerApp } from "@stackframe/stack";

const oauthCallbackUrl =
  process.env.NEXT_PUBLIC_STACK_OAUTH_CALLBACK ||
  "https://api.stack-auth.com/api/v1/auth/oauth/callback/github";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  urls: {
    oauthCallback: oauthCallbackUrl,
  },
});
