import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Play, RotateCcw, Settings2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";

import { BackupProgress } from "./backup-progress";
import { ContainerModal } from "./container-modal";
import { type BackupFile, RestoreVolumeList } from "./show-restore-volumes";
import { UpdateBackup } from "./update-backup-config";

interface Volume {
	id: string;
	name: string;
	size?: string;
	lastBackup?: string;
}

interface Container {
	id: string;
	name: string;
	status: string;
}

interface Props {
	volume: Volume;
	containers?: Container[];
	onBackup?: (volume: Volume) => void;
	onRestore?: (volume: Volume, backupId: string) => void;
	onConfigure?: (volume: Volume) => void;
}

export const VolumeActions = ({
	volume,
	containers = [],
	onBackup,
	onRestore,
	onConfigure,
}: Props) => {
	// State management
	const [isConfigOpen, setIsConfigOpen] = useState(false);
	const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
	const [isBackupInProgress, setIsBackupInProgress] = useState(false);

	const [isRestoreListOpen, setIsRestoreListOpen] = useState(false);
	const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
	const [isRestoreInProgress, setIsRestoreInProgress] = useState(false);
	const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);
	const [backups, setBackups] = useState<BackupFile[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// ---------------------------------------
	// Backup Handlers
	// ---------------------------------------
	const handleBackupClick = () => {
		// Open the container modal to confirm stopping containers or not
		setIsBackupModalOpen(true);
	};

	const handleBackupConfirm = async (stopContainers: boolean) => {
		try {
			if (stopContainers) {
				toast.info("Stopping containers...");
				// Fake a short delay to simulate container stop
				await new Promise((resolve) => setTimeout(resolve, 1500));
			}

			setIsBackupInProgress(true);

			// Close container modal
			setIsBackupModalOpen(false);

			// Now show the progress dialog
		} catch (error) {
			toast.error("Failed to start backup");
			console.error("Backup start error:", error);
		}
	};

	const handleBackupComplete = () => {
		// Close both modals when backup completes
		setIsBackupModalOpen(false);
		setIsBackupInProgress(false);

		// Show success toast once
		toast.success("Backup Complete", {
			description: `Volume ${volume.name} has been backed up successfully.`,
		});

		// Fire your callback
		// onBackup?.(volume);
	};

	// If you’re using <Dialog> from shadcn, this is how to handle close
	const handleBackupProgressDialogClose = (open: boolean) => {
		setIsBackupInProgress(open);
	};

	// ---------------------------------------
	// Restore Handlers (unchanged)
	// ---------------------------------------
	const handleRestoreClick = () => {
		setIsRestoreListOpen(true);
	};

	const handleBackupSelect = (backup: BackupFile) => {
		setSelectedBackup(backup);
		setIsRestoreListOpen(false);
		setIsRestoreModalOpen(true);
	};

	const handleRestoreConfirm = async (stopContainers: boolean) => {
		if (selectedBackup) {
			try {
				if (stopContainers) {
					toast.info("Stopping containers...");
					// Fake a short delay to simulate container stop
					await new Promise((resolve) => setTimeout(resolve, 1500));
				}

				setIsRestoreInProgress(true);

				// Close container modal
				setIsRestoreModalOpen(false);

				setSelectedBackup(null);
			} catch (error) {
				toast.error("Failed to start backup");
				console.error("Backup start error:", error);
			}
		}
	};

	const handleDestinationChange = async (destinationId: string) => {
		setIsLoading(true);
		try {
			// Mock loading of backups
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setBackups([
				{
					id: "1",
					name: "Backup 2024-03-20",
					date: "2024-03-20 14:30",
					size: "2.5GB",
				},
				{
					id: "2",
					name: "Backup 2024-03-19",
					date: "2024-03-19 09:15",
					size: "1.1GB",
				},
			]);
		} catch (error) {
			toast.error("Failed to load backups", {
				description:
					"There was an error loading the backup list. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// We can also unify these setState calls if you prefer
	// to keep them symmetrical for closing modals:
	const handleDialogClose = (
		setter: React.Dispatch<React.SetStateAction<boolean>>,
	) => {
		return (isOpen: boolean) => {
			setter(isOpen);
			if (!isOpen) {
				// Reset states if needed
				setSelectedBackup(null);
			}
		};
	};

	// Example: If you do want some default containers list for demonstration
	containers = [{ id: "1", name: "postgresql", status: "running" }];

	function handleRestoreProgressDialogClose(open: boolean): void {
		setIsRestoreInProgress(open);
	}

	function handleRestoreComplete(): void {
		// Close both modals when backup completes
		setIsRestoreModalOpen(false);
		setIsRestoreInProgress(false);

		// Show success toast once
		toast.success("Restore Complete", {
			description: `Volume ${volume.name} has been restored successfully.`,
		});
	}

	return (
		<>
			{/* Config Dialog */}
			<Dialog
				open={isConfigOpen}
				onOpenChange={handleDialogClose(setIsConfigOpen)}
			>
				<UpdateBackup
					volume={volume}
					isOpen={isConfigOpen}
					setIsOpen={setIsConfigOpen}
					onConfigure={onConfigure}
				/>
			</Dialog>

			{/* Backup Container Modal (Stop Containers?) */}
			<ContainerModal
				isOpen={isBackupModalOpen}
				setIsOpen={handleDialogClose(setIsBackupModalOpen)}
				containers={containers}
				onConfirm={handleBackupConfirm}
				operation="backup"
				volume={volume}
			/>

			{/* Backup Progress Dialog */}
			<Dialog
				open={isBackupInProgress}
				// Important: This onOpenChange only updates isBackupInProgress.
				// We do NOT reopen the container modal or do anything else here.
				onOpenChange={handleBackupProgressDialogClose}
			>
				{/* Pass the single onComplete callback here */}
				{isBackupInProgress && (
					<BackupProgress
						operation="backup"
						volumeName={volume.name}
						onComplete={handleBackupComplete}
					/>
				)}
			</Dialog>

			{/* Restore Volume List Dialog */}
			<RestoreVolumeList
				open={isRestoreListOpen}
				volume={volume}
				backups={backups}
				onSelect={handleBackupSelect}
				onOpenChange={handleDialogClose(setIsRestoreListOpen)}
				onDestinationChange={handleDestinationChange}
				isLoading={isLoading}
			/>

			{/* Container Modal for “restore” */}
			<ContainerModal
				isOpen={isRestoreModalOpen}
				setIsOpen={handleDialogClose(setIsRestoreModalOpen)}
				containers={containers}
				onConfirm={handleRestoreConfirm}
				operation="restore"
				volume={volume}
				selectedBackup={
					selectedBackup
						? {
								name: selectedBackup.name,
								date: selectedBackup.date,
								size: selectedBackup.size,
							}
						: undefined
				}
			/>

			{/* Backup Progress Dialog */}
			<Dialog
				open={isRestoreInProgress}
				// Important: This onOpenChange only updates isBackupInProgress.
				// We do NOT reopen the container modal or do anything else here.
				onOpenChange={handleRestoreProgressDialogClose}
			>
				{/* Pass the single onComplete callback here */}
				{isRestoreInProgress && (
					<BackupProgress
						operation="restore"
						volumeName={volume.name}
						onComplete={handleRestoreComplete}
					/>
				)}
			</Dialog>

			{/* Action Buttons */}
			<div className="flex items-center gap-2">
				{/* Configure Backup */}
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								onClick={() => setIsConfigOpen(true)}
							>
								<Settings2 className="size-5 text-muted-foreground" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Configure Backup</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{/* Run Manual Backup */}
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								disabled={!onBackup}
								onClick={handleBackupClick}
							>
								<Play className="size-5 text-muted-foreground" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Run Manual Backup</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{/* Restore From Backup */}
				<TooltipProvider delayDuration={0}>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								type="button"
								variant="ghost"
								disabled={!volume.lastBackup || !onRestore}
								onClick={handleRestoreClick}
							>
								<RotateCcw className="size-5 text-muted-foreground" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Restore From Backup</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</>
	);
};
