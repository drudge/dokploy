import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle } from "lucide-react";
import type { Volume } from "./show-volume-backups";
import { VolumeActions } from "./volume-actions";

interface Props {
	volume: Volume;
	onBackup: (volume: Volume) => void;
	onRestore: (volume: Volume) => void;
}

export const VolumeEntry = ({ volume, onBackup, onRestore }: Props) => {
	const backupVariant: "default" | "secondary" | "destructive" = (() => {
		if (!volume.lastBackup) {
			return "secondary";
		}

		return "secondary";
	})();

	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 sm:gap-8">
			<div className="flex flex-col gap-1">
				<span className="font-medium">Volume Name</span>
				<span className="text-sm text-muted-foreground">{volume.name}</span>
			</div>
			<div className="flex flex-col gap-1">
				<span className="font-medium">Used By Services</span>
				<div className="flex flex-wrap gap-2">
					{volume.services?.length ? (
						volume.services.map((service: string) => (
							<Badge key={service} variant="secondary" className="text-xs">
								{service}
							</Badge>
						))
					) : (
						<span className="text-sm text-muted-foreground">No services</span>
					)}
				</div>
			</div>
			<div className="flex flex-col gap-1">
				<span className="font-medium">Current Size</span>
				<span className="text-sm text-muted-foreground">{volume.size}</span>
			</div>
			<div className="flex justify-end items-center gap-4 col-span-2">
				{volume.lastBackup ? (
					<Badge
						variant={backupVariant}
						className="inline-flex items-center gap-1 text-xs whitespace-nowrap px-2 py-0.5"
					>
						{backupVariant === "destructive" && (
							<AlertTriangle className="h-3 w-3" />
						)}
						Last backup:{" "}
						{formatDistanceToNow(new Date(volume.lastBackup), {
							addSuffix: true,
							includeSeconds: true,
						})}
					</Badge>
				) : (
					<Badge
						variant="secondary"
						className="inline-flex items-center gap-1 text-xs whitespace-nowrap px-2 py-0.5"
					>
						Last backup: Never
					</Badge>
				)}
				<VolumeActions
					volume={volume}
					onBackup={onBackup}
					onRestore={onRestore}
				/>
			</div>
		</div>
	);
};
