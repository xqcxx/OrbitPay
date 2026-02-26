"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, DollarSign, User, Coins, Zap, Timer, ArrowRight } from "lucide-react";
import { usePayrollStream } from "@/hooks/usePayrollStream";
import { StrKey } from "@stellar/stellar-sdk";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

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

	// Available tokens - in a real implementation this would come from the network
	const availableTokens = [
		{
			symbol: "USDC",
			address: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
			name: "USD Coin",
		},
		{
			symbol: "XLM",
			address: "CDLZFA7IYMV2DKV2VEBZLZ6XVJDV6HJT4EHZM6LOJH6TQL6YN6MQIWCD",
			name: "Stellar Lumens",
		}
	];

	useEffect(() => {
		if (
			formData.totalAmount &&
			formData.startDate &&
			formData.startTime &&
			formData.endDate &&
			formData.endTime
		) {
			const amount = parseFloat(formData.totalAmount);
			const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
			const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

			if (!isNaN(amount) && amount > 0 && endDateTime > startDateTime) {
				const durationSeconds = (endDateTime.getTime() - startDateTime.getTime()) / 1000;

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
	}, [formData]);

	const validateForm = (): boolean => {
		const newErrors: Partial<StreamFormData> = {};

		if (!formData.recipient) {
			newErrors.recipient = "Recipient address is required";
		} else if (!StrKey.isValidEd25519PublicKey(formData.recipient)) {
			newErrors.recipient = "Invalid Stellar address";
		}

		if (!formData.token) newErrors.token = "Select a token";

		if (!formData.totalAmount) {
			newErrors.totalAmount = "Amount is required";
		} else if (parseFloat(formData.totalAmount) <= 0) {
			newErrors.totalAmount = "Must be > 0";
		}

		if (!formData.startDate || !formData.startTime) {
			newErrors.startDate = "Required";
		}

		if (!formData.endDate || !formData.endTime) {
			newErrors.endDate = "Required";
		}

		const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
		const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

		if (endDateTime <= startDateTime) {
			newErrors.endDate = "Must be after start";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!validateForm()) return;

		try {
			const startTime = Math.floor(new Date(`${formData.startDate}T${formData.startTime}`).getTime() / 1000);
			const endTime = Math.floor(new Date(`${formData.endDate}T${formData.endTime}`).getTime() / 1000);
			
			const streamId = await createStream(
				formData.recipient,
				formData.token,
				formData.totalAmount,
				startTime,
				endTime,
			);

			onSuccess?.(streamId);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Failed to create stream";
			onError?.(errorMessage);
		}
	};

	const formatDuration = (seconds: number): string => {
		const days = Math.floor(seconds / 86400);
		const hours = Math.floor((seconds % 86400) / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		return [days && `${days}d`, hours && `${hours}h`, minutes && `${minutes}m`].filter(Boolean).join(" ") || "< 1m";
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-4">
					<div className="space-y-2">
						<label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
							<User size={12} className="text-gray-400" />
							Recipient Address
						</label>
						<input
							type="text"
							value={formData.recipient}
							onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value.toUpperCase() }))}
							placeholder="G..."
							className={cn(
								"w-full bg-gray-900/50 border rounded-2xl px-4 py-3 text-sm focus:border-blue-500 transition-all outline-none font-mono",
								errors.recipient ? "border-red-500/50" : "border-gray-800"
							)}
						/>
						{errors.recipient && <p className="text-[10px] text-red-400 font-bold">{errors.recipient}</p>}
					</div>

					<div className="space-y-2">
						<label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
							<Coins size={12} className="text-gray-400" />
							Token Asset
						</label>
						<select
							value={formData.token}
							onChange={(e) => setFormData(prev => ({ ...prev, token: e.target.value }))}
							className={cn(
								"w-full bg-gray-900/50 border rounded-2xl px-4 py-3 text-sm focus:border-blue-500 transition-all outline-none appearance-none",
								errors.token ? "border-red-500/50" : "border-gray-800"
							)}
						>
							<option value="">Select Asset</option>
							{availableTokens.map((t) => (
								<option key={t.address} value={t.address}>{t.symbol} — {t.name}</option>
							))}
						</select>
					</div>

					<div className="space-y-2">
						<label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
							<DollarSign size={12} className="text-gray-400" />
							Total Amount
						</label>
						<input
							type="number"
							value={formData.totalAmount}
							onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
							placeholder="0.00"
							className={cn(
								"w-full bg-gray-900/50 border rounded-2xl px-4 py-3 text-sm focus:border-blue-500 transition-all outline-none font-bold",
								errors.totalAmount ? "border-red-500/50" : "border-gray-800"
							)}
						/>
					</div>
				</div>

				<div className="space-y-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
								<Calendar size={12} />
								Start Date
							</label>
							<input
								type="date"
								value={formData.startDate}
								onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
								className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
								<Clock size={12} />
								Time
							</label>
							<input
								type="time"
								value={formData.startTime}
								onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
								className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
								<Calendar size={12} />
								End Date
							</label>
							<input
								type="date"
								value={formData.endDate}
								onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
								className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
							/>
						</div>
						<div className="space-y-2">
							<label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
								<Clock size={12} />
								Time
							</label>
							<input
								type="time"
								value={formData.endTime}
								onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
								className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-blue-500"
							/>
						</div>
					</div>

					{rateInfo && (
						<Card className="bg-blue-600/10 border-blue-500/20 shadow-none">
							<CardContent className="p-4 space-y-4">
								<div className="flex items-center justify-between">
									<span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Stream Velocity</span>
									<Zap size={14} className="text-blue-400 animate-pulse" />
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">Per Hour</p>
										<p className="text-sm font-black text-white">{rateInfo.ratePerHour.toFixed(4)}</p>
									</div>
									<div>
										<p className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">Per Day</p>
										<p className="text-sm font-black text-white">{rateInfo.ratePerDay.toFixed(2)}</p>
									</div>
								</div>
								<div className="pt-2 border-t border-blue-500/10 flex items-center justify-between">
									<span className="text-[9px] text-gray-500 font-bold">Total Duration</span>
									<span className="text-[11px] text-blue-300 font-black">{formatDuration(rateInfo.duration)}</span>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>

			<Button 
				type="submit" 
				className="w-full rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-900/20"
				disabled={isLoading}
			>
				{isLoading ? (
                    <div className="flex items-center gap-2">
					    <div className="w-4 h-4 border-2 border-white border-t-white/30 rounded-full animate-spin" />
                        Initializing...
                    </div>
				) : (
					<div className="flex items-center gap-2">
						Launch Continuous Stream
						<ArrowRight size={16} />
					</div>
				)}
			</Button>
		</form>
	);
}
