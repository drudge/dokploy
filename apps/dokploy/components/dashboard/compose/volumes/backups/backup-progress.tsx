import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { DialogDescription } from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface BackupProgressProps {
	onComplete: () => void;
	onError?: () => void;
	volumeName?: string;
	operation?: "backup" | "restore";
}

const BACKUP_PHASES = [
	{ progress: 0, message: "Initializing backup..." },
	{ progress: 15, message: "Scanning volume contents..." },
	{ progress: 35, message: "Compressing data..." },
	{ progress: 65, message: "Transferring backup..." },
	{ progress: 85, message: "Verifying backup integrity..." },
	{ progress: 100, message: "Finishing up..." },
];

const RESTORE_PHASES = [
	{ progress: 0, message: "Initializing restore..." },
	{ progress: 15, message: "Scanning backup contents..." },
	{ progress: 35, message: "Restoring data..." },
	{ progress: 65, message: "Verifying restore integrity..." },
	{ progress: 85, message: "Finishing up..." },
];

const PHASE_DURATION = 800;
const PHASE_DURATION_RESTORE = 1200;

export const BackupProgress = ({
	onComplete,
	onError,
	volumeName,
	operation = "backup",
}: BackupProgressProps) => {
	const duration =
		operation === "backup" ? PHASE_DURATION : PHASE_DURATION_RESTORE;
	const phases = operation === "backup" ? BACKUP_PHASES : RESTORE_PHASES;
	const [progress, setProgress] = useState(0);
	const [message, setMessage] = useState(phases?.[0]?.message);
	const [currentPhase, setCurrentPhase] = useState(0);
	const [error, setError] = useState<string | null>(null);

	const handleComplete = useCallback(() => {
		setTimeout(() => {
			onComplete();
		}, duration);
	}, [onComplete, duration]);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout | undefined;

		const processPhase = () => {
			try {
				if (currentPhase >= phases.length) {
					return;
				}

				const phase = phases[currentPhase];
				if (phase) {
					setMessage(phase.message);
					setProgress(phase.progress);
				}

				if (currentPhase === phases.length - 1) {
					handleComplete();
				} else {
					timeoutId = setTimeout(() => {
						setCurrentPhase((prev) => prev + 1);
					}, duration);
				}
			} catch (err) {
				console.error("Error in backup phase:", err);
				setError("An error occurred during backup. Please try again.");
				onError?.();
			}
		};

		setTimeout(processPhase, duration);

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [currentPhase, handleComplete, onError]);

	if (error) {
		return (
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						Backup Failed{volumeName ? ` - ${volumeName}` : ""}
					</DialogTitle>
				</DialogHeader>
				<div className="py-6">
					<AlertBlock type="error">{error}</AlertBlock>
					<div className="flex justify-end mt-4">
						<Button onClick={onError} variant="ghost">
							<X className="mr-2 size-4" />
							Close
						</Button>
					</div>
				</div>
			</DialogContent>
		);
	}

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>
					{operation === "backup" ? "Backup Volume" : "Restore Volume"}
					{volumeName ? ` - ${volumeName}` : ""}
				</DialogTitle>
				<DialogDescription className="text-sm text-muted-foreground">
					{message}
				</DialogDescription>
			</DialogHeader>
			<div className="py-6">
				<Progress value={progress} />
				<div className="flex flex-col gap-2 mt-2">
					<p className="text-sm text-muted-foreground text-center">
						{progress.toFixed(0)}% Complete
					</p>
				</div>
			</div>
		</DialogContent>
	);
};
