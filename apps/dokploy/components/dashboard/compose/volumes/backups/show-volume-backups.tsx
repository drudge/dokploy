import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { ArchiveRestore } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { ContainerModal } from "./container-modal";
import { VolumeEntry } from "./volume-entry";

export interface Volume {
	id: string;
	name: string;
	size: string;
	lastBackup?: string;
	status: "available" | "in-use" | "error";
	services?: string[];
}

interface Props {
	volumeId?: string;
}

export const ShowVolumeBackups = ({ volumeId }: Props) => {
	const [containers, setContainers] = useState<
		Array<{ id: string; name: string; status: string }>
	>([]);
	const [operation, setOperation] = useState<"backup" | "restore">("backup");
	const [modalOpen, setModalOpen] = useState(false);

	// Mock data for testing UI components
	const volumes: Volume[] = [
		{
			id: "vol_1",
			name: "postgres-data",
			size: "2.5GB",
			lastBackup: "2024-01-19 10:30:00",
			status: "in-use",
			services: ["postgresql", "kimai"],
		},
		{
			id: "vol_2",
			name: "kimai-data",
			size: "329MB",
			lastBackup: "2024-12-19 15:45:00",
			status: "available",
			services: ["kimai"],
		},
		{
			id: "vol_4",
			name: "mongodb_data",
			size: "3.8GB",
			status: "in-use",
			services: ["mongodb"],
		},
	];

	const handleBackup = (volume: Volume) => {
		setContainers([{ id: "1", name: "postgresql", status: "running" }]);
		setOperation("backup");
		setModalOpen(true);
	};

	const handleRestore = (volume: Volume) => {
		setContainers([{ id: "1", name: "postgresql", status: "running" }]);
		setOperation("restore");
		setModalOpen(true);
	};

	const handleConfirm = async () => {
		try {
			if (operation === "backup") {
				toast.success("Volume backup started");
			} else if (operation === "restore") {
				toast.success("Volume restore started");
			}
			setModalOpen(false);
		} catch (error) {
			toast.error(`Failed to ${operation} volume: ${error}`);
		}
	};

	return (
		<Card className="bg-background">
			<CardHeader className="flex flex-row justify-between gap-4 flex-wrap">
				<div className="flex flex-col gap-0.5">
					<CardTitle className="text-xl">Backups</CardTitle>
					<CardDescription>
						Backup and restore Docker volumes to different providers.
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<AlertBlock type="info">
					Volumes are automatically detected from your Compose configuration.
					Configure backup settings to enable automatic backups to S3.
				</AlertBlock>
				{volumes.length === 0 ? (
					<div className="flex w-full flex-col items-center justify-center gap-3 pt-10">
						<ArchiveRestore className="size-8 text-muted-foreground" />
						<span className="text-base text-muted-foreground">
							No volumes found
						</span>
					</div>
				) : (
					<div className="flex flex-col pt-2">
						<div className="flex flex-col gap-6">
							{volumes.map((volume) => (
								<>
									<VolumeEntry
										key={volume.id}
										volume={volume}
										onBackup={handleBackup}
										onRestore={handleRestore}
										// onConfigure={handleConfigure}
									/>
									<ContainerModal
										key={`${volume.id}-${operation}`}
										isOpen={modalOpen}
										setIsOpen={setModalOpen}
										containers={containers}
										operation={operation}
										volume={volume}
										onConfirm={handleConfirm}
									/>
								</>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
