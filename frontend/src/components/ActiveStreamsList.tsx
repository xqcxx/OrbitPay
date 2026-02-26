'use client'

import { useState } from 'react'
import { usePayrollStream, Stream } from '@/hooks/usePayrollStream'
import StreamCard from './StreamCard'
import { Filter, Search, SortAsc, LayoutGrid, List as ListIcon } from 'lucide-react'
import { Button } from "@/components/ui/Button"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"

interface ActiveStreamsListProps {
    view?: 'grid' | 'list'
}

export default function ActiveStreamsList({ view = 'grid' }: ActiveStreamsListProps) {
    const { streams, isLoading } = usePayrollStream()
    const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all')
    const [searchTerm, setSearchTerm] = useState('')

    const filteredStreams = streams.filter((stream: Stream) => {
        const matchesSearch = stream.recipient.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             stream.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             stream.id.toLowerCase().includes(searchTerm.toLowerCase())
        
        if (!matchesSearch) return false
        
        if (filter === 'sent') return true // Assuming current wallet is sender for now
        if (filter === 'received') return false // Need real wallet check
        return true
    })

    if (isLoading && streams.length === 0) {
        return (
            <div className={cn(
                "gap-6",
                view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
            )}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className={cn("rounded-3xl", view === 'grid' ? "h-64" : "h-24")} />
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/40 p-4 rounded-3xl border border-gray-800">
                <div className="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-2xl px-4 py-2 w-full md:w-80 transition-all focus-within:border-blue-500/50">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input 
                        type="text" 
                        placeholder="Search address or ID..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none text-xs text-white outline-none w-full"
                    />
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Button 
                        variant={filter === 'all' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setFilter('all')}
                        className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest px-4"
                    >
                        All Streams
                    </Button>
                    <Button 
                        variant={filter === 'sent' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setFilter('sent')}
                        className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest px-4"
                    >
                        Sent
                    </Button>
                    <Button 
                        variant={filter === 'received' ? 'secondary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setFilter('received')}
                        className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest px-4"
                    >
                        Received
                    </Button>
                </div>
            </div>

            {filteredStreams.length === 0 ? (
                <div className="text-center py-32 bg-gray-900/20 border border-dashed border-gray-800 rounded-3xl">
                    <div className="bg-gray-800/50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-white font-bold mb-1">No streams found</h3>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">Try adjusting your filters or search terms to find what you&apos;re looking for.</p>
                </div>
            ) : (
                <div className={cn(
                    "gap-6",
                    view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col"
                )}>
                    {filteredStreams.map((stream) => (
                        <StreamCard key={stream.id} stream={stream} view={view} />
                    ))}
                </div>
            )}
        </div>
    )
}
