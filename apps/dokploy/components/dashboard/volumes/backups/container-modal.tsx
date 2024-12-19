import { AlertBlock } from "@/components/shared/alert-block";
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
}

export const ContainerModal = ({
	isOpen,
	setIsOpen,
	containers,
	onConfirm,
	operation,
}: Props) => {
	const [stopContainers, setStopContainers] = useState(true);
	const buttonText = `${operation.charAt(0).toUpperCase()}${operation.slice(1)} Volume${stopContainers ? " & Manage Containers" : ""}`;

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Running Containers</DialogTitle>
					<DialogDescription>
						The following containers are using volumes that will be {operation}d
					</DialogDescription>
				</DialogHeader>
				<div className="py-4">
					<AlertBlock type="warning">
						It is recommended to stop containers during volume {operation}s to avoid data corruption or conflicts due to concurrent access.
					</AlertBlock>
					<div className="flex flex-col gap-4 mt-4">
						<div className="flex items-center justify-between space-x-2">
							<Label htmlFor="stop-containers">Stop and restart containers</Label>
							<Switch
								id="stop-containers"
								checked={stopContainers}
								onCheckedChange={setStopContainers}
							/>
						</div>
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
					<Button onClick={() => onConfirm(stopContainers)}>{buttonText}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
