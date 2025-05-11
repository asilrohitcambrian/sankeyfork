import BuilderPage from '@/app/builder/page'
import { notFound } from 'next/navigation'

export default function BuilderWrapper({ params }: { params: { id: string } }) {
  if (!params.id) return notFound()

  return <BuilderPage diagramId={params.id} />
} 