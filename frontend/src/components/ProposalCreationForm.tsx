'use client'

import { useState } from 'react'
import { FileText, Coins, User, DollarSign, Eye, Send, Loader2 } from 'lucide-react'
import { useGovernance } from '@/hooks/useGovernance'
import { StrKey } from '@stellar/stellar-sdk'

interface ProposalFormData {
  title: string
  token: string
  amount: string
  recipient: string
  justification: string
}

interface ProposalCreationFormProps {
  onSuccess?: (proposalId: number) => void
  onError?: (error: string) => void
}

export default function ProposalCreationForm({
  onSuccess,
  onError,
}: ProposalCreationFormProps) {
  const { createProposal, isLoading, isConnected } = useGovernance()
  const [formData, setFormData] = useState<ProposalFormData>({
    title: '',
    token: '',
    amount: '',
    recipient: '',
    justification: '',
  })

  const [errors, setErrors] = useState<Partial<ProposalFormData>>({})
  const [showPreview, setShowPreview] = useState(false)

  // Available tokens - matches the governance contract expectations
  const availableTokens = [
    {
      symbol: 'USDC',
      address: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA',
      name: 'USD Coin',
    },
    {
      symbol: 'USDT',
      address: 'CCZX6LM636L7QXZEK62EFWKL6DXCNSEWFW2MZNHX3LYBR6V5B7MNNRNY',
      name: 'Tether USD',
    },
    {
      symbol: 'XLM',
      address: 'CDLZFA7IYMV2DKV2VEBZLZ6XVJDV6HJT4EHZM6LOJH6TQL6YN6MQIWCD',
      name: 'Stellar Lumens',
    },
  ]

  const validateForm = (): boolean => {
    const newErrors: Partial<ProposalFormData> = {}

    // Validate title (must be valid Symbol - max 32 chars, alphanumeric + underscore)
    if (!formData.title) {
      newErrors.title = 'Title is required'
    } else if (formData.title.length > 32) {
      newErrors.title = 'Title must be 32 characters or less'
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.title)) {
      newErrors.title = 'Title can only contain letters, numbers, and underscores'
    }

    // Validate token selection
    if (!formData.token) {
      newErrors.token = 'Please select a token'
    }

    // Validate amount
    if (!formData.amount) {
      newErrors.amount = 'Amount is required'
    } else if (!/^\d+(\.\d{1,7})?$/.test(formData.amount)) {
      newErrors.amount = 'Use up to 7 decimal places'
    } else {
      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be a positive number'
      }
    }

    // Validate recipient address
    if (!formData.recipient) {
      newErrors.recipient = 'Recipient address is required'
    } else if (!StrKey.isValidEd25519PublicKey(formData.recipient)) {
      newErrors.recipient = 'Invalid Stellar address format'
    }

    // Justification is optional but validate length if provided
    if (formData.justification && formData.justification.length > 1000) {
      newErrors.justification = 'Justification must be 1000 characters or less'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (
    field: keyof ProposalFormData,
    value: string
  ) => {
    const sanitizedValue =
      field === 'recipient' ? value.trim().toUpperCase() : value
    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      // Convert amount to stroops (7 decimals)
      const amountInStroops = Math.floor(
        parseFloat(formData.amount) * 10_000_000
      )

      const proposalId = await createProposal(
        formData.title,
        formData.token,
        amountInStroops,
        formData.recipient
      )

      // Store justification off-chain (in localStorage for now)
      // In production, this would be sent to a backend API
      if (formData.justification) {
        const justifications = JSON.parse(
          localStorage.getItem('proposal_justifications') || '{}'
        )
        justifications[proposalId] = formData.justification
        localStorage.setItem(
          'proposal_justifications',
          JSON.stringify(justifications)
        )
      }

      onSuccess?.(proposalId)

      // Reset form
      setFormData({
        title: '',
        token: '',
        amount: '',
        recipient: '',
        justification: '',
      })
      setShowPreview(false)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create proposal'
      onError?.(errorMessage)
    }
  }

  const selectedToken = availableTokens.find((t) => t.address === formData.token)

  return (
    <div className="max-w-2xl mx-auto bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6 text-sky-400" />
        Create Budget Proposal
      </h2>

      {!isConnected && (
        <div className="mb-6 p-4 bg-yellow-900/40 border border-yellow-700/50 rounded-xl text-yellow-300 text-sm">
          Connect your wallet to create a proposal
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Proposal Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="budget_q1_2024"
            maxLength={32}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white"
          />
          <p className="mt-1 text-xs text-gray-500">
            Max 32 characters, letters, numbers, and underscores only
          </p>
          {errors.title && (
            <p className="mt-1 text-sm text-red-400">{errors.title}</p>
          )}
        </div>

        {/* Token Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Token
          </label>
          <select
            value={formData.token}
            onChange={(e) => handleInputChange('token', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white"
          >
            <option value="">Select a token</option>
            {availableTokens.map((token) => (
              <option key={token.address} value={token.address}>
                {token.symbol} - {token.name}
              </option>
            ))}
          </select>
          {errors.token && (
            <p className="mt-1 text-sm text-red-400">{errors.token}</p>
          )}
        </div>

        {/* Amount Requested */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Amount Requested
          </label>
          <input
            type="number"
            step="0.0000001"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white"
          />
          {selectedToken && formData.amount && (
            <p className="mt-1 text-xs text-gray-400">
              {parseFloat(formData.amount).toLocaleString()} {selectedToken.symbol}
            </p>
          )}
          {errors.amount && (
            <p className="mt-1 text-sm text-red-400">{errors.amount}</p>
          )}
        </div>

        {/* Recipient Address */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <User className="w-4 h-4" />
            Recipient Address
          </label>
          <input
            type="text"
            value={formData.recipient}
            onChange={(e) => handleInputChange('recipient', e.target.value)}
            placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white font-mono text-sm"
          />
          {errors.recipient && (
            <p className="mt-1 text-sm text-red-400">{errors.recipient}</p>
          )}
        </div>

        {/* Justification Text Area */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Justification (Optional)
          </label>
          <textarea
            value={formData.justification}
            onChange={(e) => handleInputChange('justification', e.target.value)}
            placeholder="Explain why this budget proposal should be approved..."
            rows={4}
            maxLength={1000}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-white resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            {formData.justification.length}/1000 characters (stored off-chain)
          </p>
          {errors.justification && (
            <p className="mt-1 text-sm text-red-400">{errors.justification}</p>
          )}
        </div>

        {/* Preview Toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg text-gray-300 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? 'Hide Preview' : 'Preview Proposal'}
        </button>

        {/* Preview Section */}
        {showPreview && (
          <div className="bg-gray-900/60 border border-gray-600 rounded-lg p-5 space-y-3">
            <h3 className="text-lg font-bold text-white mb-3">Proposal Preview</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Title:</span>
                <span className="text-white font-medium">
                  {formData.title || '(not set)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Token:</span>
                <span className="text-white font-medium">
                  {selectedToken?.symbol || '(not selected)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-medium">
                  {formData.amount
                    ? `${parseFloat(formData.amount).toLocaleString()} ${
                        selectedToken?.symbol || ''
                      }`
                    : '(not set)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Recipient:</span>
                <span className="text-white font-mono text-xs">
                  {formData.recipient
                    ? `${formData.recipient.slice(0, 8)}...${formData.recipient.slice(-8)}`
                    : '(not set)'}
                </span>
              </div>
              {formData.justification && (
                <div className="pt-2 border-t border-gray-700">
                  <span className="text-gray-400 block mb-1">Justification:</span>
                  <p className="text-white text-xs leading-relaxed">
                    {formData.justification}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !isConnected}
          className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating Proposal...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Proposal
            </>
          )}
        </button>
      </form>
    </div>
  )
}
