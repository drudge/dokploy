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

interface Volume {
	id: string;
	name: string;
	size: string;
	lastBackup?: string;
	status: "available" | "in-use" | "error";
}

interface Props {
	volumeId?: string;
}

export const ShowVolumeBackups = ({ volumeId }: Props) => {
	// Will implement data fetching later
	const volumes: Volume[] = [];

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
