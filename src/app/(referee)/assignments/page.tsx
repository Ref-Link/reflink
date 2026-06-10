import { AssignmentsView } from '@/components/assignments/AssignmentsView'

export default function AssignmentsPage({
  searchParams,
}: {
  searchParams: { tab?: string }
}) {
  return <AssignmentsView tabParam={searchParams.tab ?? null} />
}
