import UploadWizard from '@/components/upload/UploadWizard'

const PARAMS = [
  { key: 'squat', label: 'Squat (kg)' },
  { key: 'deadlift', label: 'Peso Muerto (kg)' },
  { key: 'bench', label: 'Banca (kg)' },
  { key: 'power_clean', label: 'Power Clean (kg)' },
  { key: 'tonnage', label: 'Tonelaje (kg)' },
  { key: 'notas', label: 'Notas' },
]

export default function UploadTrainingPage() {
  return (
    <UploadWizard
      title="Cargar Rendimiento"
      subtitle="Importa datos de fuerza y rendimiento por jugador"
      params={PARAMS}
      templateBase="training"
      uploadEndpoint="/api/upload/training"
      createdLabel="registros creados"
    />
  )
}
