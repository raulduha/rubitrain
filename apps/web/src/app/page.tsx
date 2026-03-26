import Link from 'next/link'

const FEATURES = [
  {
    icon: '📊',
    title: 'Control de rendimiento',
    desc: 'Registra squat, deadlift, bench press y métricas GPS de cada jugador. Sube datos desde Excel con un clic.',
  },
  {
    icon: '📋',
    title: 'Planificación de sesiones',
    desc: 'Diseña sesiones de fuerza, velocidad y técnica. Asigna ejercicios por grupos (forwards/backs) con carga y series.',
  },
  {
    icon: '🏃',
    title: 'Análisis de partidos',
    desc: 'Visualiza distancia total, velocidad máxima, sprints y HSR de cada jugador. Detecta fatiga antes de que sea problema.',
  },
  {
    icon: '🩺',
    title: 'Estado físico del plantel',
    desc: 'Seguimiento de lesiones, áreas afectadas y fechas de retorno. Ten el plantel disponible siempre actualizado.',
  },
  {
    icon: '📧',
    title: 'Invitaciones por email',
    desc: 'Invita jugadores y entrenadores directamente a tu equipo. Ellos se registran con Google o email en segundos.',
  },
  {
    icon: '🏟️',
    title: 'Multi-equipo y multi-club',
    desc: 'Gestiona Primera División, M18, M16 y más desde un solo panel. El club puede pagar y cubrir a todos sus miembros.',
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'para siempre',
    features: ['Hasta 5 jugadores', '1 club', 'Dashboard básico'],
    cta: 'Empezar gratis',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$14.990',
    period: 'CLP / mes',
    features: ['Hasta 30 jugadores', '3 clubes', 'Carga Excel', 'Análisis completo'],
    cta: 'Empezar Pro',
    highlight: true,
  },
  {
    name: 'Club',
    price: '$44.990',
    period: 'CLP / mes',
    features: ['Jugadores ilimitados', 'Clubes ilimitados', 'Todo incluido', 'Plan cubre a todos los miembros'],
    cta: 'Empezar Club',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* NAV */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#001e40] rounded-lg flex items-center justify-center">
              <span className="text-[#83fc8e] font-bold text-sm">R</span>
            </div>
            <span className="font-bold text-[#001e40] text-lg">RubiTrain</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-[#001e40] font-medium px-4 py-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm bg-[#001e40] text-white font-semibold px-5 py-2 rounded-xl hover:bg-[#003366] transition"
            >
              Crear cuenta gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="bg-[#001e40] text-white">
        <div className="max-w-6xl mx-auto px-6 py-24 text-center">
          <span className="inline-block bg-[#0058bc] text-[#83fc8e] text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide uppercase">
            Plataforma de gestión deportiva
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6 max-w-3xl mx-auto">
            El rendimiento de tu equipo, en un solo lugar
          </h1>
          <p className="text-white/60 text-lg max-w-xl mx-auto mb-10">
            Diseñado para preparadores físicos y entrenadores de rugby. Controla métricas,
            planifica sesiones y lleva el estado de cada jugador sin hojas de cálculo dispersas.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="bg-[#83fc8e] text-[#001e40] font-bold px-8 py-4 rounded-xl hover:bg-[#6fe87a] transition text-base"
            >
              Empezar gratis — sin tarjeta
            </Link>
            <Link
              href="/login"
              className="border border-white/20 text-white font-medium px-8 py-4 rounded-xl hover:bg-white/10 transition text-base"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* STRIP */}
      <div className="bg-[#0058bc] text-white/80 text-sm text-center py-3">
        Usado por preparadores físicos de rugby en Chile · Datos seguros con Supabase · Pagos con MercadoPago y WebPay
      </div>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-[#001e40] mb-3">Todo lo que necesitas para gestionar tu plantel</h2>
          <p className="text-gray-500">Desde la primera sesión hasta el análisis de partido, sin salir de la plataforma.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-[#f8f9fa] rounded-2xl p-6 hover:shadow-sm transition">
              <span className="text-3xl mb-4 block">{f.icon}</span>
              <h3 className="font-semibold text-[#001e40] mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="bg-[#f8f9fa] py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#001e40] mb-3">Empezá en 3 pasos</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Crea tu club', desc: 'Registrate como preparador físico, crea tu club y agrega tus categorías (Primera, M18, M16).' },
              { step: '02', title: 'Invita a tu plantel', desc: 'Manda invitaciones por email. Los jugadores y entrenadores se unen con un clic.' },
              { step: '03', title: 'Carga y analiza', desc: 'Sube métricas desde Excel o manualmente. Visualiza el progreso de cada jugador.' },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-[#001e40] text-[#83fc8e] rounded-2xl flex items-center justify-center font-bold text-xl mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-semibold text-[#001e40] mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-[#001e40] mb-3">Planes simples, sin sorpresas</h2>
          <p className="text-gray-500">Pagás con MercadoPago o WebPay. Cancelás cuando quieras.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {PLANS.map(p => (
            <div
              key={p.name}
              className={`rounded-2xl p-8 border ${
                p.highlight
                  ? 'bg-[#001e40] text-white border-[#001e40]'
                  : 'bg-white border-gray-100'
              }`}
            >
              {p.highlight && (
                <span className="inline-block bg-[#83fc8e] text-[#001e40] text-xs font-bold px-3 py-1 rounded-full mb-4">
                  Más popular
                </span>
              )}
              <h3 className={`font-bold text-xl mb-1 ${p.highlight ? 'text-white' : 'text-[#001e40]'}`}>{p.name}</h3>
              <div className="mb-6">
                <span className={`text-3xl font-bold ${p.highlight ? 'text-white' : 'text-[#001e40]'}`}>{p.price}</span>
                <span className={`text-sm ml-1 ${p.highlight ? 'text-white/50' : 'text-gray-400'}`}>{p.period}</span>
              </div>
              <ul className="space-y-2 mb-8">
                {p.features.map(f => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${p.highlight ? 'text-white/80' : 'text-gray-600'}`}>
                    <span className="text-[#83fc8e]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`block text-center font-semibold py-3 rounded-xl transition text-sm ${
                  p.highlight
                    ? 'bg-[#83fc8e] text-[#001e40] hover:bg-[#6fe87a]'
                    : 'bg-[#f8f9fa] text-[#001e40] hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="bg-[#001e40] text-white py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">¿Listo para profesionalizar tu gestión deportiva?</h2>
          <p className="text-white/60 mb-8">Empieza gratis hoy. No necesitas tarjeta de crédito.</p>
          <Link
            href="/register"
            className="inline-block bg-[#83fc8e] text-[#001e40] font-bold px-10 py-4 rounded-xl hover:bg-[#6fe87a] transition text-base"
          >
            Crear cuenta gratis
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-[#001e40] rounded-md flex items-center justify-center">
              <span className="text-[#83fc8e] font-bold text-xs">R</span>
            </div>
            <span className="font-semibold text-[#001e40] text-sm">RubiTrain</span>
          </div>
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} CDUC Rugby · Todos los derechos reservados</p>
          <div className="flex gap-4 text-sm text-gray-400">
            <Link href="/login" className="hover:text-[#001e40]">Iniciar sesión</Link>
            <Link href="/register" className="hover:text-[#001e40]">Registrarse</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
