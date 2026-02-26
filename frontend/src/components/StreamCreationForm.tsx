"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, DollarSign, User, Coins } from "lucide-react";
import { usePayrollStream } from "@/hooks/usePayrollStream";
import { StrKey } from "@stellar/stellar-sdk";

interface StreamFormData {
	recipient: string;
	token: string;
	totalAmount: string;
	startDate: string;
	startTime: string;
	endDate: string;
	endTime: string;
}

interface StreamCreationFormProps {
	onSuccess?: (streamId: string) => void;
	onError?: (error: string) => void;
}

export default function StreamCreationForm({
	onSuccess,
	onError,
}: StreamCreationFormProps) {
	const { createStream, isLoading } = usePayrollStream();
	const [formData, setFormData] = useState<StreamFormData>({
		recipient: "",
		token: "",
		totalAmount: "",
		startDate: "",
		startTime: "",
		endDate: "",
		endTime: "",
	});

	const [errors, setErrors] = useState<Partial<StreamFormData>>({});
	const [rateInfo, setRateInfo] = useState<{
		duration: number;
		ratePerSecond: number;
		ratePerMinute: number;
		ratePerHour: number;
		ratePerDay: number;
	} | null>(null);
	const [durationPreview, setDurationPreview] = useState<string>("");

	// Available tokens - in a real implementation this would come from the network
	const availableTokens = [
		{
			symbol: "USDC",
			address: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
			name: "USD Coin",
		},
		{
			symbol: "USDT",
			address: "CCZX6LM636L7QXZEK62EFWKL6DXCNSEWFW2MZNHX3LYBR6V5B7MNNRNY",
			name: "Tether USD",
		},
		{
			symbol: "XLM",
			address: "CDLZFA7IYMV2DKV2VEBZLZ6XVJDV6HJT4EHZM6LOJH6TQL6YN6MQIWCD",
			name: "Stellar Lumens",
		},
	];

	// Calculate stream rates when amount or duration changes
	useEffect(() => {
		if (
			formData.startDate &&
			formData.startTime &&
			formData.endDate &&
			formData.endTime
		) {
			const startDateTime = new Date(
				`${formData.startDate}T${formData.startTime}`,
			);
			const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

			if (endDateTime > startDateTime) {
				const durationMs = endDateTime.getTime() - startDateTime.getTime();
				setDurationPreview(formatDuration(durationMs / 1000));
			} else {
				setDurationPreview("");
			}
		} else {
			setDurationPreview("");
		}

		if (
			formData.totalAmount &&
			formData.startDate &&
			formData.startTime &&
			formData.endDate &&
			formData.endTime
		) {
			const amount = parseFloat(formData.totalAmount);
			const startDateTime = new Date(
				`${formData.startDate}T${formData.startTime}`,
			);
			const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

			if (!isNaN(amount) && amount > 0 && endDateTime > startDateTime) {
				const durationMs = endDateTime.getTime() - startDateTime.getTime();
				const durationSeconds = durationMs / 1000;

				if (durationSeconds > 0) {
					setRateInfo({
						duration: durationSeconds,
						ratePerSecond: amount / durationSeconds,
						ratePerMinute: (amount / durationSeconds) * 60,
						ratePerHour: (amount / durationSeconds) * 3600,
						ratePerDay: (amount / durationSeconds) * 86400,
					});
				} else {
					setRateInfo(null);
				}
			} else {
				setRateInfo(null);
			}
		} else {
			setRateInfo(null);
		}
	}, [
		formData.totalAmount,
		formData.startDate,
		formData.startTime,
		formData.endDate,
		formData.endTime,
	]);

	const validateForm = (): boolean => {
		const newErrors: Partial<StreamFormData> = {};

		// Validate recipient address (basic Stellar address validation)
		if (!formData.recipient) {
			newErrors.recipient = "Recipient address is required";
		} else if (!StrKey.isValidEd25519PublicKey(formData.recipient)) {
			newErrors.recipient = "Invalid Stellar address format";
		}

		// Validate token selection
		if (!formData.token) {
			newErrors.token = "Please select a token";
		}

		// Validate amount
		if (!formData.totalAmount) {
			newErrors.totalAmount = "Amount is required";
		} else if (!/^\d+(\.\d{1,7})?$/.test(formData.totalAmount)) {
			newErrors.totalAmount = "Use up to 7 decimal places";
		} else {
			const amount = parseFloat(formData.totalAmount);
			if (isNaN(amount) || amount <= 0) {
				newErrors.totalAmount = "Amount must be a positive number";
			}
		}

		// Validate start date and time
		if (!formData.startDate || !formData.startTime) {
			if (!formData.startDate) newErrors.startDate = "Start date is required";
			if (!formData.startTime) newErrors.startTime = "Start time is required";
		}

		// Validate end date and time
		if (!formData.endDate || !formData.endTime) {
			if (!formData.endDate) newErrors.endDate = "End date is required";
			if (!formData.endTime) newErrors.endTime = "End time is required";
		}

		// Validate that end time is after start time
		if (
			formData.startDate &&
			formData.startTime &&
			formData.endDate &&
			formData.endTime
		) {
			const startDateTime = new Date(
				`${formData.startDate}T${formData.startTime}`,
			);
			const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

			if (endDateTime <= startDateTime) {
				newErrors.endDate = "End time must be after start time";
			}

			// Check that start time is not in the past
			if (startDateTime < new Date()) {
				newErrors.startDate = "Start time cannot be in the past";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (field: keyof StreamFormData, value: string) => {
		const sanitizedValue =
			field === "recipient" ? value.trim().toUpperCase() : value;
		setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));
		// Clear error for this field when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (validateForm()) {
			try {
				const startDateTime = new Date(
					`${formData.startDate}T${formData.startTime}`,
				);
				const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

				const startTime = Math.floor(startDateTime.getTime() / 1000);
				const endTime = Math.floor(endDateTime.getTime() / 1000);
				const streamId = await createStream(
					formData.recipient,
					formData.token,
					formData.totalAmount,
					startTime,
					endTime,
				);

				onSuccess?.(streamId);
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : "Failed to create stream";
				onError?.(errorMessage);
			}
		}
	};

	const formatDuration = (seconds: number): string => {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		const parts = [];
		if (days > 0) parts.push(`${days}d`);
		if (hours > 0) parts.push(`${hours}h`);
		if (minutes > 0) parts.push(`${minutes}m`);

		return parts.length > 0 ? parts.join(" ") : "< 1m";
	};

	return (
		<div className="max-w-2xl mx-auto bg-gray-900 rounded-xl p-6 border border-gray-700">
			<h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
				<DollarSign className="w-6 h-6 text-green-400" />
				Create Payment Stream
			</h2>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Recipient Address */}
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
						<User className="w-4 h-4" />
						Recipient Address
					</label>
					<input
						type="text"
						value={formData.recipient}
						onChange={(e) => handleInputChange("recipient", e.target.value)}
						placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
						className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white font-mono text-sm"
					/>
					{errors.recipient && (
						<p className="mt-1 text-sm text-red-400">{errors.recipient}</p>
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
						onChange={(e) => handleInputChange("token", e.target.value)}
						className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
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

				{/* Total Amount */}
				<div>
					<label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
						<DollarSign className="w-4 h-4" />
						Total Amount
					</label>
					<input
						type="number"
						step="0.0000001"
						value={formData.totalAmount}
						onChange={(e) => handleInputChange("totalAmount", e.target.value)}
						placeholder="0.00"
						className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
					/>
					{errors.totalAmount && (
						<p className="mt-1 text-sm text-red-400">{errors.totalAmount}</p>
					)}
				</div>

				{/* Start Date and Time */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
							<Calendar className="w-4 h-4" />
							Start Date
						</label>
						<input
							type="date"
							value={formData.startDate}
							onChange={(e) => handleInputChange("startDate", e.target.value)}
							min={new Date().toISOString().split("T")[0]}
							className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
						/>
						{errors.startDate && (
							<p className="mt-1 text-sm text-red-400">{errors.startDate}</p>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
							<Clock className="w-4 h-4" />
							Start Time
						</label>
						<input
							type="time"
							value={formData.startTime}
							onChange={(e) => handleInputChange("startTime", e.target.value)}
							className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
						/>
						{errors.startTime && (
							<p className="mt-1 text-sm text-red-400">{errors.startTime}</p>
						)}
					</div>
				</div>

				{/* End Date and Time */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
							<Calendar className="w-4 h-4" />
							End Date
						</label>
						<input
							type="date"
							value={formData.endDate}
							onChange={(e) => handleInputChange("endDate", e.target.value)}
							min={formData.startDate || new Date().toISOString().split("T")[0]}
							className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
						/>
						{errors.endDate && (
							<p className="mt-1 text-sm text-red-400">{errors.endDate}</p>
						)}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
							<Clock className="w-4 h-4" />
							End Time
						</label>
						<input
							type="time"
							value={formData.endTime}
							onChange={(e) => handleInputChange("endTime", e.target.value)}
							className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
						/>
						{errors.endTime && (
							<p className="mt-1 text-sm text-red-400">{errors.endTime}</p>
						)}
					</div>
				</div>

				{durationPreview && (
					<p className="text-sm text-gray-400 -mt-2">
						Duration preview:{" "}
						<span className="text-white">{durationPreview}</span>
					</p>
				)}

				{/* Rate Information */}
				{rateInfo && (
					<div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
						<h3 className="text-sm font-medium text-gray-300 mb-3">
							Stream Details
						</h3>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
							<div>
								<p className="text-gray-400">Duration</p>
								<p className="text-white font-medium">
									{formatDuration(rateInfo.duration)}
								</p>
							</div>
							<div>
								<p className="text-gray-400">Per Second</p>
								<p className="text-white font-medium">
									{rateInfo.ratePerSecond.toFixed(7)}
								</p>
							</div>
							<div>
								<p className="text-gray-400">Per Hour</p>
								<p className="text-white font-medium">
									{rateInfo.ratePerHour.toFixed(4)}
								</p>
							</div>
							<div>
								<p className="text-gray-400">Per Day</p>
								<p className="text-white font-medium">
									{rateInfo.ratePerDay.toFixed(2)}
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Submit Button */}
				<button
					type="submit"
					disabled={isLoading}
					className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
				>
					{isLoading ? (
						<>
							<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
							Creating Stream...
						</>
					) : (
						<>
							<DollarSign className="w-4 h-4" />
							Create Payment Stream
						</>
					)}
				</button>
			</form>
		</div>
	);
}
