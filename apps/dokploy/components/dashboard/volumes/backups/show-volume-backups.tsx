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
import React from "react";
import { toast } from "sonner";
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
	// Mock data for testing UI components
	const volumes: Volume[] = [
		{
			id: "vol_1",
			name: "postgres_data",
			size: "2.5GB",
			lastBackup: "2024-01-19 10:30:00",
			status: "in-use",
			services: ["postgres", "backup-service"],
		},
		{
			id: "vol_2",
			name: "redis_data",
			size: "1.2GB",
			lastBackup: "2024-01-18 15:45:00",
			status: "available",
			services: ["redis"],
		},
		{
			id: "vol_3",
			name: "elasticsearch_data",
			size: "5.0GB",
			lastBackup: "2024-01-17 09:15:00",
			status: "in-use",
			services: ["elasticsearch", "backup-service"],
		},
		{
			id: "vol_4",
			name: "mongodb_data",
			size: "3.8GB",
			lastBackup: "2024-01-16 23:45:00",
			status: "in-use",
			services: ["mongodb"],
		},
	];

	const handleBackup = (volume: Volume) => {
		toast.info("Backup functionality coming soon");
	};

	const handleRestore = (volume: Volume) => {
		toast.info("Restore functionality coming soon");
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
					Volumes are automatically detected from your Docker Compose
					configuration. Configure backup settings to enable automatic backups
					to S3.
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
								<VolumeEntry
									key={volume.id}
									volume={volume}
									onBackup={handleBackup}
									onRestore={handleRestore}
								/>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
