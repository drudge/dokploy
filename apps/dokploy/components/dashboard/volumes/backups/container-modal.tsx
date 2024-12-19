import { AlertBlock } from "@/components/shared/alert-block";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import React, { useState } from "react";

interface Container {
	id: string;
	name: string;
	status: string;
}

interface Props {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	containers: Container[];
	onConfirm: (stopContainers: boolean) => void;
	operation: "backup" | "restore";
	volumeName: string;
	volumeSize: string;
}

export const ContainerModal = ({
	isOpen,
	setIsOpen,
	containers,
	onConfirm,
	operation,
	volumeName,
	volumeSize,
}: Props) => {
	const [stopContainers, setStopContainers] = useState(true);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent>
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle>
							{operation.charAt(0).toUpperCase()}
							{operation.slice(1)} Volume - {volumeName}
						</DialogTitle>
						<Badge variant="secondary">{volumeSize}</Badge>
					</div>
					<DialogDescription>
						The following containers are using volumes that will be {operation}d
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<AlertBlock type="warning">
						We recommend stopping containers during {operation} to prevent data corruption.
					</AlertBlock>
					<div className="flex flex-col gap-4 mt-4">
						<div className="flex flex-col gap-2">
							{containers.map((container) => (
								<div
									key={container.id}
									className="flex items-center justify-between border rounded-md p-3"
								>
									<span className="font-medium">{container.name}</span>
									<span className="text-sm text-muted-foreground">
										{container.status}
									</span>
								</div>
							))}
						</div>
						<div className="flex flex-col gap-2 border-t pt-4">
							<div className="flex items-center justify-between space-x-2">
								<div className="space-y-1">
									<Label htmlFor="stop-containers">Stop for backup</Label>
									<p className="text-sm text-muted-foreground">
										Containers will automatically restart when backup completes
									</p>
								</div>
								<Switch
									id="stop-containers"
									checked={stopContainers}
									onCheckedChange={setStopContainers}
								/>
							</div>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setIsOpen(false)}
						className="mr-2"
					>
						Cancel
					</Button>
					<Button onClick={() => onConfirm(stopContainers)}>
						Start {operation.charAt(0).toUpperCase()}
						{operation.slice(1)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
