import { Tv } from 'lucide-react'

export default function LiveTv() {
  return (
    <main className="main max-w-[1600px] mx-auto px-4 md:px-8 py-16 flex flex-col items-center justify-center text-center">
      <div className="bg-surface-2 p-8 rounded-2xl border border-line flex flex-col items-center max-w-lg w-full shadow-2xl">
        <Tv size={64} className="text-accent mb-6 animate-pulse" />
        <h1 className="text-3xl md:text-4xl font-bold mb-4">TV en Vivo</h1>
        <p className="text-text-soft text-lg mb-8">
          Estamos trabajando para traerte los mejores canales en vivo y en directo. 
          ¡Muy pronto podrás disfrutar de televisión gratuita desde AkashiVerse!
        </p>
        <div className="inline-block px-4 py-2 bg-accent/20 text-accent font-bold rounded-lg uppercase tracking-widest text-sm border border-accent/30">
          Próximamente
        </div>
      </div>
    </main>
  )
}
