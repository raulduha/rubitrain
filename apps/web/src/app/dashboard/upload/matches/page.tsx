import UploadWizard from '@/components/upload/UploadWizard'

const PARAMS = [
  { key: 'vel_max', label: 'Velocidad Máxima (km/h)' },
  { key: 'metros', label: 'Metros Totales' },
  { key: 'sprints', label: 'Sprints' },
  { key: 'hsr', label: 'Metros HSR' },
  { key: 'estado', label: 'Estado (optimal/fatigue/alert)' },
]

export default function UploadMatchesPage() {
  return (
    <UploadWizard
      title="Cargar Métricas de Partido"
      subtitle="Importa datos GPS y físicos de partido por jugador"
      params={PARAMS}
      templateBase="matches"
      uploadEndpoint="/api/upload/matches"
      createdLabel="registros creados"
    />
  )
}
