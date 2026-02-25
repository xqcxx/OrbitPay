import { BatchPayrollCreation } from '@/components/BatchPayrollCreation'
import { PayrollAnalytics } from '@/components/PayrollAnalytics'
import ActiveStreamsList from '@/components/ActiveStreamsList'

export default function PayrollPage() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">💸 Payroll Streams</h1>
      <p className="text-gray-400 mb-8">
        Create and manage continuous payment streams to your team members.
      </p>

      <h2 className="text-2xl font-bold mb-2 text-white">📤 Batch Payroll Creation</h2>
      <p className="text-gray-400 mb-6">Upload a CSV file to create multiple payroll streams at once.</p>
      <BatchPayrollCreation />
      <PayrollAnalytics />
      <div className="mt-12">
        <ActiveStreamsList />
      </div>
    </div>
  )
}
