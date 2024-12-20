import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Check,
	Clock,
	Download,
	HardDrive,
	Loader2,
	Trash,
} from "lucide-react";
import React from "react";

export interface BackupFile {
	id: string;
	name: string;
	date: string;
	size: string;
}

interface Volume {
	name: string;
}

interface Destination {
	id: string;
	name: string;
}

interface RestoreVolumeListProps {
	backups: BackupFile[];
	volume: Volume;
	onSelect: (backup: BackupFile) => void;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	onDestinationChange: (destinationId: string) => Promise<void>;
	isLoading?: boolean;
}

const DESTINATIONS = [
	{ id: "hetzner", name: "Hetzner - Cascade" },
	{ id: "aws", name: "AWS S3" },
	{ id: "do", name: "DigitalOcean Spaces" },
];

const formatDate = (dateString: string) => {
	const date = new Date(dateString);
	return date.toLocaleString([], {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

export const RestoreVolumeList = ({
	volume,
	backups,
	onSelect,
	open = true,
	onOpenChange = () => {},
	onDestinationChange,
	isLoading = false,
}: RestoreVolumeListProps) => {
	const [selectedDestination, setSelectedDestination] =
		React.useState<string>();
	const [selectedBackupId, setSelectedBackupId] = React.useState<string>();

	const handleDestinationChange = async (destinationId: string) => {
		setSelectedDestination(destinationId);
		setSelectedBackupId(undefined);
		await onDestinationChange(destinationId);
	};

	const handleSelect = () => {
		const backup = backups.find((b) => b.id === selectedBackupId);
		if (backup) {
			onSelect(backup);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader className="space-y-4">
					<div className="flex items-center gap-2">
						<HardDrive className="h-5 w-5 text-primary" />
						<DialogTitle>Restore Volume - {volume?.name}</DialogTitle>
					</div>
					<DialogDescription className="text-sm text-muted-foreground">
						Select a backup destination and choose a backup to restore
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="destination">Backup Destination</Label>
						<Select
							value={selectedDestination}
							onValueChange={handleDestinationChange}
						>
							<SelectTrigger id="destination" className="w-full">
								<SelectValue placeholder="Select destination" />
							</SelectTrigger>
							<SelectContent>
								{DESTINATIONS.map((dest) => (
									<SelectItem key={dest.id} value={dest.id}>
										{dest.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="mt-4">
						{isLoading ? (
							<div className="flex h-[200px] flex-col items-center justify-center gap-3">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
								<span className="text-sm text-muted-foreground">
									Loading backups...
								</span>
							</div>
						) : !selectedDestination ? (
							<div className="flex h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
								<HardDrive className="h-10 w-10 text-muted-foreground/50" />
								<span className="text-sm text-muted-foreground">
									Select a destination to view available backups
								</span>
							</div>
						) : backups.length === 0 ? (
							<div className="flex h-[200px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed">
								<HardDrive className="h-10 w-10 text-muted-foreground/50" />
								<span className="text-sm text-muted-foreground">
									No backups available for this volume in the selected
									destination
								</span>
							</div>
						) : (
							<ScrollArea className="h-max[300px]">
								<RadioGroup
									className="space-y-2"
									value={selectedBackupId}
									icon={<Check />}
									onValueChange={setSelectedBackupId}
								>
									{backups.map((backup) => (
										<label
											key={backup.id}
											htmlFor={`backup-${backup.id}`}
											className="cursor-pointer border rounded-lg p-4 flex items-center justify-between hover:bg-accent transition-colors"
										>
											<div className="flex items-center gap-3">
												<div className="relative flex items-center justify-center w-4 h-4">
													<input
														type="checkbox"
														id={`backup-${backup.id}`}
														name="backup"
														value={backup.id}
														checked={selectedBackupId === backup.id}
														onChange={() => setSelectedBackupId(backup.id)}
														className="appearance-none w-4 h-4 border border-primary rounded-full checked:bg-primary checked:border-primary"
													/>
												</div>
												<div className="flex flex-col gap-1">
													<span className="font-medium text-sm">
														{backup.name}
													</span>
													<span className="text-xs text-muted-foreground flex items-center gap-1">
														<Clock className="h-4 w-4 text-muted-foreground" />
														{formatDate(backup.date)}
													</span>
												</div>
											</div>
											<div className="flex items-center gap-1">
												<span className="text-xs font-medium px-1 py-1 rounded-md bg-secondary text-secondary-foreground">
													{backup.size}
												</span>
												<Button variant="ghost" size="icon">
													<Download className="h-4 w-4 text-muted-foreground" />
												</Button>
												<Button variant="ghost" size="icon">
													<Trash className="h-4 w-4 text-muted-foreground" />
												</Button>
											</div>
										</label>
									))}
								</RadioGroup>
							</ScrollArea>
						)}
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="mr-2"
					>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={handleSelect}
						disabled={!selectedBackupId}
					>
						Select
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
