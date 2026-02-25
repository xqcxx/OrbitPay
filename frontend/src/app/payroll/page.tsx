import { useState } from "react";
import StreamCreationForm from "@/components/StreamCreationForm";

export default function PayrollPage() {
	const [successMessage, setSuccessMessage] = useState<string>("");
	const [errorMessage, setErrorMessage] = useState<string>("");

	const handleStreamCreated = (streamId: number) => {
		setSuccessMessage(`Stream created successfully! Stream ID: ${streamId}`);
		setErrorMessage("");
	};

	const handleError = (error: string) => {
		setErrorMessage(error);
		setSuccessMessage("");
	};

	return (
		<div className="max-w-6xl mx-auto p-8">
			<h1 className="text-3xl font-bold mb-6">💸 Payroll Streams</h1>
			<p className="text-gray-400 mb-8">
				Create and manage continuous payment streams to your team members.
			</p>

			{successMessage && (
				<div className="mb-6 p-4 bg-green-900 border border-green-700 rounded-lg text-green-200">
					{successMessage}
				</div>
			)}

			{errorMessage && (
				<div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg text-red-200">
					{errorMessage}
				</div>
			)}

			<div className="mb-8">
				<StreamCreationForm
					onSuccess={handleStreamCreated}
					onError={handleError}
				/>
			</div>

			{/* TODO: Implement Payroll Dashboard (see FE-11 to FE-15) */}
			<div className="border border-dashed border-gray-600 rounded-xl p-12 text-center text-gray-500">
				Payroll dashboard coming soon. See ISSUES-FRONTEND.md for contribution
				tasks.
			</div>
		</div>
	);
}
