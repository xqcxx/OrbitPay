'use client'

import { useState } from 'react'
import { usePayrollStream, Stream } from '@/hooks/usePayrollStream'
import StreamCard from './StreamCard'
import { Filter } from 'lucide-react'

export default function ActiveStreamsList() {
    const { streams, isLoading } = usePayrollStream()
    const [filter, setFilter] = useState<'sent' | 'received'>('sent')

    // In a real app, this would use the connected wallet address
    // Using 'me' to match our mock data sender/recipient definitions
    const MY_ADDRESS = 'me'

    const filteredStreams = streams.filter((stream: Stream) => {
        if (filter === 'sent') return stream.sender === MY_ADDRESS
        if (filter === 'received') return stream.recipient === MY_ADDRESS
        return true
    })

    if (isLoading) {
        return (
            <div className="animate-pulse flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 bg-gray-800/40 rounded-2xl w-full" />
                ))}
            </div>
        )
    }

    if (streams.length === 0) {
        return (
            <div className="border border-dashed border-gray-600 rounded-xl p-12 text-center text-gray-500">
                No active streams found. Create one to get started.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    Active Streams
                </h2>
                <div className="flex bg-gray-900/50 p-1 rounded-lg border border-gray-800">
                    <button
                        onClick={() => setFilter('sent')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'sent'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        Sent by me
                    </button>
                    <button
                        onClick={() => setFilter('received')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${filter === 'received'
                                ? 'bg-green-500/10 text-green-400'
                                : 'text-gray-400 hover:text-gray-200'
                            }`}
                    >
                        Received by me
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStreams.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} />
                ))}
                {filteredStreams.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-900/20 rounded-xl border border-dashed border-gray-800">
                        No streams match the "{filter === 'sent' ? 'Sent by me' : 'Received by me'}" filter.
                    </div>
                )}
            </div>
        </div>
    )
}
