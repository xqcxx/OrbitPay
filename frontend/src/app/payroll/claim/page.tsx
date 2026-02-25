import { StreamClaimFlow } from '@/components/StreamClaimFlow'

export default function StreamClaimPage() {
    return (
        <div className="max-w-6xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">💰 Claim Your Streams</h1>
            <p className="text-gray-400 mb-8">
                View your active incoming streams and claim accrued tokens at any time.
            </p>
            <StreamClaimFlow />
        </div>
    )
}
