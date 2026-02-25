"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Trash2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface StreamRow {
    recipient: string
    amount: string
    start: string
    end: string
    valid: boolean
    error?: string
}

function parseCSV(text: string): StreamRow[] {
    const lines = text.trim().split('\n')
    // Skip header row
    const dataLines = lines[0]?.toLowerCase().includes('recipient') ? lines.slice(1) : lines
    return dataLines
        .filter((l) => l.trim())
        .map((line) => {
            const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''))
            const [recipient = '', amount = '', start = '', end = ''] = parts
            const errors: string[] = []
            if (!recipient || recipient.length < 10) errors.push('Invalid recipient address')
            if (isNaN(Number(amount)) || Number(amount) <= 0) errors.push('Invalid amount')
            if (!start || isNaN(Date.parse(start))) errors.push('Invalid start date')
            if (!end || isNaN(Date.parse(end))) errors.push('Invalid end date')
            return { recipient, amount, start, end, valid: errors.length === 0, error: errors.join('. ') }
        })
}

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function BatchPayrollCreation() {
    const [rows, setRows] = useState<StreamRow[]>([])
    const [fileName, setFileName] = useState<string | null>(null)
    const [dragOver, setDragOver] = useState(false)
    const [status, setStatus] = useState<Status>('idle')
    const fileRef = useRef<HTMLInputElement>(null)

    const processFile = useCallback((file: File) => {
        if (!file.name.endsWith('.csv')) return
        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = (e) => {
            const text = e.target?.result as string
            setRows(parseCSV(text))
            setStatus('idle')
        }
        reader.readAsText(file)
    }, [])

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
    }

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (file) processFile(file)
    }

    const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i))

    const validRows = rows.filter((r) => r.valid)

    const handleCreateAll = async () => {
        if (!validRows.length) return
        setStatus('submitting')
        // Simulate async contract call / XDR construction
        await new Promise((res) => setTimeout(res, 1500))
        setStatus('success')
        setTimeout(() => {
            setRows([])
            setFileName(null)
            setStatus('idle')
        }, 3000)
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Upload Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed transition-colors p-10 flex flex-col items-center gap-3 ${dragOver ? 'border-stellar-primary bg-stellar-primary/10' : 'border-stellar-border bg-stellar-surface/60 hover:border-stellar-primary/60'
                    }`}
            >
                <Upload className="h-10 w-10 text-gray-400" />
                <p className="text-white font-semibold text-lg">
                    {fileName ? fileName : 'Drop your CSV file here'}
                </p>
                <p className="text-gray-500 text-sm">
                    CSV columns: <code className="text-stellar-secondary">recipient, amount, start, end</code>
                </p>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />
            </div>

            {/* Template Download Hint */}
            <div className="text-sm text-gray-500">
                Expected format:{' '}
                <code className="text-xs bg-stellar-surface border border-stellar-border rounded px-2 py-0.5">
                    recipient,amount,start,end
                </code>
                &nbsp; e.g.&nbsp;
                <code className="text-xs text-gray-400">GABC...XYZ,100,2025-01-01,2026-01-01</code>
            </div>

            {/* Preview Table */}
            {rows.length > 0 && (
                <div className="bg-stellar-surface border border-stellar-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-stellar-border">
                        <h3 className="text-white font-semibold">
                            Preview — {validRows.length}/{rows.length} valid streams
                        </h3>
                        <button
                            onClick={() => { setRows([]); setFileName(null) }}
                            className="text-gray-500 hover:text-red-400 transition-colors text-xs flex items-center gap-1"
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Clear
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-stellar-border bg-[#0D1117]">
                                    <th className="text-left px-4 py-2 text-gray-400 font-medium">Recipient</th>
                                    <th className="text-left px-4 py-2 text-gray-400 font-medium">Amount</th>
                                    <th className="text-left px-4 py-2 text-gray-400 font-medium">Start</th>
                                    <th className="text-left px-4 py-2 text-gray-400 font-medium">End</th>
                                    <th className="text-left px-4 py-2 text-gray-400 font-medium">Status</th>
                                    <th className="px-4 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr key={i} className="border-b border-stellar-border/50 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-2 font-mono text-xs text-gray-300 max-w-[160px] truncate">{row.recipient || '—'}</td>
                                        <td className="px-4 py-2 text-white">{row.amount || '—'}</td>
                                        <td className="px-4 py-2 text-gray-300 text-xs">{row.start || '—'}</td>
                                        <td className="px-4 py-2 text-gray-300 text-xs">{row.end || '—'}</td>
                                        <td className="px-4 py-2">
                                            {row.valid ? (
                                                <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-400 text-xs" title={row.error}>
                                                    <AlertCircle className="h-3.5 w-3.5" /> {row.error}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <button onClick={() => removeRow(i)} className="text-gray-600 hover:text-red-400 transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Create All */}
                    <div className="flex items-center justify-between px-4 py-4 border-t border-stellar-border">
                        {status === 'success' ? (
                            <span className="flex items-center gap-2 text-green-400 font-semibold">
                                <CheckCircle2 className="h-5 w-5" /> {validRows.length} streams created!
                            </span>
                        ) : (
                            <span className="text-gray-500 text-sm">{validRows.length} streams will be submitted</span>
                        )}
                        <button
                            onClick={handleCreateAll}
                            disabled={!validRows.length || status === 'submitting' || status === 'success'}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stellar-primary text-white font-semibold text-sm transition-opacity disabled:opacity-50 hover:opacity-90"
                        >
                            {status === 'submitting' ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                            ) : (
                                <>Create All {validRows.length > 0 ? `(${validRows.length})` : ''}</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
