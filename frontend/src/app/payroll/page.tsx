import { PayrollAnalytics } from '@/components/PayrollAnalytics'

export default function PayrollPage() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">💸 Payroll Streams</h1>
      <p className="text-gray-400 mb-8">
        Create and manage continuous payment streams to your team members.
      </p>

      <PayrollAnalytics />
    </div>
  )
}
