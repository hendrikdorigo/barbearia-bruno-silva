/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // Sem ignoreBuildErrors: os erros de "never" vinham de @supabase/ssr 0.5.2
  // (assinatura antiga do SupabaseClient) brigando com o supabase-js novo que
  // vinha instalado junto. Com as duas versões alinhadas o build valida tipo
  // de novo - e é isso que segura bug antes de ir pro ar.
  env: {
    // Fallback placeholders so build-time static prerendering of Server
    // Components (which call createClient()) doesn't throw when the real
    // Supabase env vars haven't been configured yet in Vercel Project
    // Settings. Once NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
    // are set there, they take precedence over these fallbacks.
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://itlrvprbrmqdcvmcsiow.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0bHJ2cHJicm1xZGN2bWNzaW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4NjM4NjIsImV4cCI6MjEwMTQzOTg2Mn0.9OkNWQeEdGzxB45gY0DPT4xr29UeOeowF5B5jqbpbSc',
  },
};

export default nextConfig;
