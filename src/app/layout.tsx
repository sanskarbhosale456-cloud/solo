import type { Metadata } from 'next'
import { Orbitron, IBM_Plex_Sans, Rajdhani, Cinzel } from 'next/font/google'
import './globals.css'
import { QueryProvider } from '@/lib/query-provider'
import { GameEventsProvider } from '@/hooks/useGameEvents'
import { Toaster } from '@/components/ui/Toaster'
import { GlobalClickSound } from '@/components/audio/GlobalClickSound'

const orbitron = Orbitron({
  subsets: ['latin'],
  variable: '--font-orbitron',
  display: 'swap',
})

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex',
  display: 'swap',
})

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-cinzel',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://life-rpg.vercel.app'),
  title: 'Life RPG — The System',
  description:
    'Transform your real-world tasks into an RPG progression system. Level up in real life. Track quests, earn XP, build your shadow army.',
  keywords: ['productivity', 'RPG', 'gamification', 'habit tracker', 'life RPG', 'quests'],
  openGraph: {
    title: 'Life RPG — The System',
    description:
      'Transform your real-world tasks into an RPG progression system. Level up in real life.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Life RPG — The System' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Life RPG — The System',
    description: 'Transform your real-world tasks into an RPG progression system.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${orbitron.variable} ${ibmPlexSans.variable} ${rajdhani.variable} ${cinzel.variable}`}
    >
      <body className="bg-void text-white font-body antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-glow focus:text-white focus:rounded focus:font-medium"
        >
          Skip to main content
        </a>
        <QueryProvider>
          <GameEventsProvider>
            {children}
            <Toaster />
            <GlobalClickSound />
          </GameEventsProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
