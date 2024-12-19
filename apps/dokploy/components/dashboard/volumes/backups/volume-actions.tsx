import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { toast } from "sonner";
import { ContainerModal } from "./container-modal";

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

export const VolumeActions = ({ volume, onBackup, onRestore }: Props) => {
	const [modalOpen, setModalOpen] = useState(false);
	const [operation, setOperation] = useState<"backup" | "restore">("backup");
	const [containers, setContainers] = useState<
		Array<{ id: string; name: string; status: string }>
	>([]);

	const handleBackup = async () => {
		// Will fetch containers using this volume later
		setContainers([
			{ id: "1", name: "container-1", status: "running" },
			{ id: "2", name: "container-2", status: "running" },
		]);
		setOperation("backup");
		setModalOpen(true);
	};

	const handleRestore = async () => {
		// Will fetch containers using this volume later
		setContainers([
			{ id: "1", name: "container-1", status: "running" },
			{ id: "2", name: "container-2", status: "running" },
		]);
		setOperation("restore");
		setModalOpen(true);
	};

	const handleConfirm = async () => {
		try {
			if (operation === "backup" && onBackup) {
				await onBackup(volume);
				toast.success("Volume backup started");
			} else if (operation === "restore" && onRestore) {
				await onRestore(volume);
				toast.success("Volume restore started");
			}
			setModalOpen(false);
		} catch (error) {
			toast.error(`Failed to ${operation} volume: ${error}`);
		}
	};

	return (
		<>
			<div className="flex flex-row gap-4">
				<Button onClick={handleBackup}>Backup</Button>
				<Button variant="outline" onClick={handleRestore}>
					Restore
				</Button>
			</div>
			<ContainerModal
				isOpen={modalOpen}
				setIsOpen={setModalOpen}
				containers={containers}
				onConfirm={handleConfirm}
				operation={operation}
			/>
		</>
	);
};
