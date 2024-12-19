import React from "react";
import { VolumeActions } from "./volume-actions";

interface Volume {
	id: string;
	name: string;
	size: string;
	lastBackup?: string;
	status: "available" | "in-use" | "error";
}

interface Props {
	volume: Volume;
	onBackup?: (volume: Volume) => void;
	onRestore?: (volume: Volume) => void;
}

export const VolumeEntry = ({ volume, onBackup, onRestore }: Props) => {
	return (
		<div className="flex w-full flex-col md:flex-row md:items-center justify-between gap-4 md:gap-10 border rounded-lg p-4">
			<div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 flex-col gap-8">
				<div className="flex flex-col gap-1">
					<span className="font-medium">Volume</span>
					<span className="text-sm text-muted-foreground">{volume.name}</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="font-medium">Size</span>
					<span className="text-sm text-muted-foreground">{volume.size}</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="font-medium">Last Backup</span>
					<span className="text-sm text-muted-foreground">
						{volume.lastBackup || "Never"}
					</span>
				</div>
				<div className="flex flex-col gap-1">
					<span className="font-medium">Status</span>
					<span className="text-sm text-muted-foreground">{volume.status}</span>
				</div>
			</div>
			<VolumeActions
				volume={volume}
				onBackup={onBackup}
				onRestore={onRestore}
			/>
		</div>
	);
};
