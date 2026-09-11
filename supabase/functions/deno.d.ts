// Supabase Edge Functions / Deno Environment Type Declarations
// Permite que o TypeScript e a IDE reconheçam URLs remotas e o namespace global Deno.

declare module 'https://deno.land/std@0.168.0/http/server.ts' {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module 'https://deno.land/*' {
  export function serve(handler: (req: Request) => Promise<Response> | Response): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@*' {
  export * from '@supabase/supabase-js';
}

declare module 'https://esm.sh/@supabase/supabase-js@2.39.8' {
  export * from '@supabase/supabase-js';
}

declare module 'https://esm.sh/@supabase/supabase-js@2.39.0' {
  export * from '@supabase/supabase-js';
}

declare module 'https://esm.sh/*' {
  export * from '@supabase/supabase-js';
}

declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): Record<string, string>;
  }

  export const env: Env;
}
