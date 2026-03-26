import { createClient } from '@/lib/supabase/server'
import TrialButton from '@/components/billing/TrialButton'

const PLANS = [
  { key: 'free',  name: 'Free',  price: '$0',       period: 'para siempre', players: 5,    clubs: 1,  excel: false },
  { key: 'pro',   name: 'Pro',   price: '$14.990',   period: 'CLP/mes',      players: 30,   clubs: 3,  excel: true  },
  { key: 'club',  name: 'Club',  price: '$44.990',   period: 'CLP/mes',      players: 9999, clubs: 99, excel: true  },
] as const

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subResult = await (supabase as any)
    .from('subscriptions')
    .select('*')
    .eq('payer_id', user!.id)
    .eq('billing_type', 'personal')
    .single() as { data: { plan: string; active_players_count: number; status: string; current_period_end: string | null; payment_provider: string | null } | null }
  const sub = subResult.data

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orgs } = await (supabase as any)
    .from('organizations')
    .select('*, subscriptions(*)')
    .eq('owner_id', user!.id) as { data: { id: string; name: string; subscriptions: { plan: string }[] }[] | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: effectivePlanData } = await (supabase as any)
    .rpc('get_effective_plan', { p_user_id: user!.id })

  const currentPlan = (sub?.plan ?? 'free') as 'free' | 'pro' | 'club'
  const effectivePlan = (effectivePlanData ?? 'free') as string
  const planDetails = PLANS.find(p => p.key === currentPlan) ?? PLANS[0]!
  const activePlayers = sub?.active_players_count ?? 0
  const playerLimit = planDetails.players

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#001e40]">Suscripción</h1>
        <p className="text-gray-500 text-sm mt-1">Gestiona tu plan y los métodos de pago</p>
      </div>

      {/* Plan actual */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Plan actual</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-[#001e40] capitalize">{currentPlan}</span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                sub?.status === 'active' ? 'bg-green-50 text-green-700' :
                sub?.status === 'past_due' ? 'bg-yellow-50 text-yellow-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {sub?.status === 'active' ? 'Activo' : sub?.status === 'past_due' ? 'Pago pendiente' : 'Free'}
              </span>
            </div>
            {sub?.current_period_end && (
              <p className="text-xs text-gray-400 mt-1">
                Próxima renovación: {new Date(sub.current_period_end).toLocaleDateString('es-CL')}
              </p>
            )}
          </div>
          {currentPlan !== 'free' && sub?.payment_provider && (
            <div className="text-right">
              <p className="text-xs text-gray-400">Proveedor</p>
              <p className="text-sm font-medium text-[#001e40] capitalize">{sub.payment_provider}</p>
            </div>
          )}
        </div>

        {/* Uso de jugadores */}
        <div className="mt-5">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-gray-600">Jugadores activos</span>
            <span className="font-semibold text-[#001e40]">
              {activePlayers} / {playerLimit === 9999 ? '∞' : playerLimit}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                activePlayers / playerLimit > 0.8 ? 'bg-yellow-400' : 'bg-[#0058bc]'
              }`}
              style={{ width: `${Math.min(100, (activePlayers / Math.min(playerLimit, 9999)) * 100)}%` }}
            />
          </div>
          {activePlayers / playerLimit >= 0.8 && playerLimit !== 9999 && (
            <p className="text-xs text-yellow-600 mt-1.5">
              ⚠️ Te quedan {playerLimit - activePlayers} jugadores disponibles. Considera upgradear tu plan.
            </p>
          )}
        </div>
      </div>

      {/* Planes */}
      <h2 className="font-semibold text-[#001e40] mb-4">Cambiar plan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {PLANS.map(plan => {
          const isCurrent = plan.key === currentPlan
          return (
            <div
              key={plan.key}
              className={`rounded-2xl border p-5 ${isCurrent ? 'border-[#0058bc] bg-blue-50/40' : 'border-gray-100 bg-white hover:shadow-sm transition'}`}
            >
              {isCurrent && (
                <span className="inline-block bg-[#0058bc] text-white text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3">
                  Plan actual
                </span>
              )}
              <h3 className="font-bold text-[#001e40] mb-1">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-2xl font-bold text-[#001e40]">{plan.price}</span>
                <span className="text-xs text-gray-400 ml-1">{plan.period}</span>
              </div>
              <ul className="space-y-1.5 mb-5 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-[#83fc8e] font-bold">✓</span> {plan.players === 9999 ? 'Jugadores ilimitados' : `Hasta ${plan.players} jugadores`}</li>
                <li className="flex gap-2"><span className="text-[#83fc8e] font-bold">✓</span> {plan.clubs === 99 ? 'Clubes ilimitados' : `${plan.clubs} club${plan.clubs > 1 ? 'es' : ''}`}</li>
                <li className="flex gap-2">
                  <span className={plan.excel ? 'text-[#83fc8e] font-bold' : 'text-gray-300'}>✓</span>
                  <span className={plan.excel ? '' : 'text-gray-300'}>Carga Excel</span>
                </li>
              </ul>
              {!isCurrent && plan.key !== 'free' && (
                <TrialButton plan={plan.key as 'pro' | 'club'} label={`Probar ${plan.name} gratis 30 días`} />
              )}
              {!isCurrent && plan.key === 'free' && (
                <p className="text-xs text-gray-400 text-center">Cancela tu suscripción para volver al plan free</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Plan del Club */}
      {orgs && orgs.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-[#001e40] mb-1">Plan del Club</h2>
          <p className="text-gray-400 text-sm mb-5">
            Activa un plan para toda la organización. Todos los jugadores y entrenadores quedan cubiertos automáticamente.
          </p>
          {orgs.map(org => {
            const orgSub = (org.subscriptions as unknown as { plan: string; status: string }[] | null)?.[0]
            return (
              <div key={org.id} className="flex items-center justify-between bg-[#f8f9fa] rounded-xl px-5 py-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#001e40] rounded-lg flex items-center justify-center">
                    <span className="text-[#83fc8e] font-bold text-sm">{org.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#001e40] text-sm">{org.name}</p>
                    {orgSub ? (
                      <p className="text-xs text-green-600">Plan {orgSub.plan} activo — todos los miembros cubiertos</p>
                    ) : (
                      <p className="text-xs text-gray-400">Sin plan de club</p>
                    )}
                  </div>
                </div>
                {!orgSub && (
                  <div className="flex gap-2">
                    <TrialButton
                      plan="pro"
                      billingType="organization"
                      orgId={org.id}
                      label="Probar Pro"
                      className="text-xs bg-[#83fc8e] text-[#001e40] px-3 py-1.5 rounded-lg font-bold hover:opacity-90 transition disabled:opacity-50"
                    />
                    <TrialButton
                      plan="club"
                      billingType="organization"
                      orgId={org.id}
                      label="Probar Club"
                      className="text-xs bg-[#001e40] text-white px-3 py-1.5 rounded-lg font-bold hover:bg-[#003366] transition disabled:opacity-50"
                    />
                  </div>
                )}
                {orgSub && (
                  <span className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium capitalize">{orgSub.plan}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
