import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings2 } from "lucide-react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ContainerModal } from "./container-modal";

const VolumeBackupConfigSchema = z.object({
	destinationId: z.string().min(1, "Destination required"),
	prefix: z.string().min(1, "Prefix required"),
	filenamePattern: z.string().min(1, "Filename pattern required"),
	scheduleType: z.enum(["hourly", "daily", "weekly", "monthly", "custom"]),
	schedule: z.string().min(1, "Schedule required"),
	selectedDays: z.array(z.string()).optional(),
	hour: z.string().optional(),
	minute: z.string().optional(),
	enabled: z.boolean(),
});

type VolumeBackupConfig = z.infer<typeof VolumeBackupConfigSchema>;

interface Volume {
	id: string;
	name: string;
	size: string;
	lastBackup?: string;
	status: "available" | "in-use" | "error";
}

interface ConfigurationDialogProps {
	volume: Volume;
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
}

interface Props {
	volume: Volume;
	onBackup?: (volume: Volume) => void;
	onRestore?: (volume: Volume) => void;
	onConfigure?: (volume: Volume) => void;
}

export const ConfigurationDialog = ({
	volume,
	isOpen,
	setIsOpen,
}: ConfigurationDialogProps) => {
	const form = useForm<VolumeBackupConfig>({
		defaultValues: {
			destinationId: "",
			prefix: "/",
			filenamePattern: "{{name}}-{{YYYYMMDD}}-{{HHmmss}}.tgz",
			scheduleType: "daily",
			schedule: "0 0 * * *",
			selectedDays: [],
			hour: "00",
			minute: "00",
			enabled: true,
		},
		resolver: zodResolver(VolumeBackupConfigSchema),
	});

	const onSubmit = async (data: VolumeBackupConfig) => {
		try {
			// Placeholder for actual submission logic
			toast.success("Configuration saved");
			setIsOpen(false);
		} catch (error) {
			toast.error("Failed to save configuration");
		}
	};

	return (
		<DialogContent className="sm:max-w-md">
			<DialogHeader>
				<DialogTitle>Configure Volume Backup</DialogTitle>
			</DialogHeader>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<div className="space-y-6">
						<div>
							<h3 className="text-sm font-medium mb-2">Destination Settings</h3>
							<Card>
								<div className="p-4 space-y-4">
									<FormField
										control={form.control}
										name="destinationId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Destination</FormLabel>
												<Select
													defaultValue={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger className="mt-1.5">
														<SelectValue placeholder="Select destination" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="hetzner">
															Hetzner - Cascade
														</SelectItem>
														<SelectItem value="aws">AWS S3</SelectItem>
														<SelectItem value="do">
															DigitalOcean Spaces
														</SelectItem>
													</SelectContent>
												</Select>
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="prefix"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Prefix Destination</FormLabel>
												<Input
													className="mt-1.5"
													placeholder="backups/volumes/my-volume"
													{...field}
												/>
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="filenamePattern"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Filename Pattern</FormLabel>
												<Input
													className="mt-1.5 font-mono"
													placeholder="{{name}}-{{YYYYMMDD}}-{{HHmmss}}.tgz"
													{...field}
												/>
											</FormItem>
										)}
									/>
								</div>
							</Card>
						</div>
						<div>
							<h3 className="text-sm font-medium mb-2">Schedule Settings</h3>
							<Card>
								<div className="p-4 space-y-4">
									<FormField
										control={form.control}
										name="scheduleType"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Backup Schedule</FormLabel>
												<Select
													defaultValue={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger className="mt-1.5">
														<SelectValue placeholder="Select frequency" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="hourly">Hourly</SelectItem>
														<SelectItem value="daily">Daily</SelectItem>
														<SelectItem value="weekly">Weekly</SelectItem>
														<SelectItem value="monthly">Monthly</SelectItem>
														<SelectItem value="custom">
															Custom (cron)
														</SelectItem>
													</SelectContent>
												</Select>
											</FormItem>
										)}
									/>
									{form.watch("scheduleType") !== "custom" && (
										<div>
											<FormLabel>Time</FormLabel>
											<div className="grid grid-cols-2 gap-2 mt-1.5">
												<FormField
													control={form.control}
													name="hour"
													render={({ field }) => (
														<Select
															defaultValue={field.value}
															onValueChange={field.onChange}
														>
															<SelectTrigger className="mt-1.5">
																<SelectValue placeholder="Hour" />
															</SelectTrigger>
															<SelectContent>
																{Array.from({ length: 24 }, (_, i) => (
																	<SelectItem
																		key={i}
																		value={i.toString().padStart(2, "0")}
																	>
																		{i.toString().padStart(2, "0")}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													)}
												/>
												<FormField
													control={form.control}
													name="minute"
													render={({ field }) => (
														<Select
															defaultValue={field.value}
															onValueChange={field.onChange}
														>
															<SelectTrigger className="mt-1.5">
																<SelectValue placeholder="Minute" />
															</SelectTrigger>
															<SelectContent>
																{Array.from({ length: 60 }, (_, i) => (
																	<SelectItem
																		key={i}
																		value={i.toString().padStart(2, "0")}
																	>
																		{i.toString().padStart(2, "0")}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
													)}
												/>
											</div>
										</div>
									)}
									{form.watch("scheduleType") === "weekly" && (
										<div>
											<FormLabel>Days</FormLabel>
											<div className="grid grid-cols-4 gap-2 mt-1.5">
												{[
													{ value: "1", label: "Mon" },
													{ value: "2", label: "Tue" },
													{ value: "3", label: "Wed" },
													{ value: "4", label: "Thu" },
													{ value: "5", label: "Fri" },
													{ value: "6", label: "Sat" },
													{ value: "0", label: "Sun" },
												].map((day) => (
													<Button
														key={day.value}
														variant="outline"
														size="sm"
														className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
														data-state={
															form.watch("selectedDays")?.includes(day.value)
																? "on"
																: "off"
														}
														onClick={() => {
															const currentDays =
																form.watch("selectedDays") || [];
															const newSelectedDays = new Set(currentDays);
															if (newSelectedDays.has(day.value)) {
																newSelectedDays.delete(day.value);
															} else {
																newSelectedDays.add(day.value);
															}
															form.setValue(
																"selectedDays",
																Array.from(newSelectedDays),
															);
														}}
													>
														{day.label}
													</Button>
												))}
											</div>
										</div>
									)}
									{form.watch("scheduleType") === "custom" && (
										<FormField
											control={form.control}
											name="schedule"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Cron Expression</FormLabel>
													<Input
														className="mt-1.5 font-mono"
														placeholder="0 0 * * *"
														{...field}
													/>
												</FormItem>
											)}
										/>
									)}
									<FormField
										control={form.control}
										name="enabled"
										render={({ field }) => (
											<FormItem className="flex items-center justify-between pt-2">
												<div>
													<FormLabel>Schedule Active</FormLabel>
													<p className="text-sm text-muted-foreground">
														Turn scheduled backups on or off
													</p>
												</div>
												<Switch
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormItem>
										)}
									/>
								</div>
							</Card>
						</div>
					</div>
					<DialogFooter>
						<Button type="submit">Save Configuration</Button>
					</DialogFooter>
				</form>
			</Form>
		</DialogContent>
	);
};

export const VolumeActions = ({
	volume,
	onBackup,
	onRestore,
	onConfigure,
}: Props) => {
	const [modalOpen, setModalOpen] = useState(false);
	const [configureOpen, setConfigureOpen] = useState(false);
	const [operation, setOperation] = useState<"backup" | "restore">("backup");
	const [containers, setContainers] = useState<
		Array<{ id: string; name: string; status: string }>
	>([]);

	const handleBackup = async () => {
		// Will fetch containers using this volume later
		setContainers([{ id: "1", name: "postgresql", status: "running" }]);
		setOperation("backup");
		setModalOpen(true);
	};

	const handleRestore = async () => {
		// Will fetch containers using this volume later
		setContainers([{ id: "1", name: "postgresql", status: "running" }]);
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
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setConfigureOpen(true)}
				>
					<Settings2 className="h-4 w-4" />
				</Button>
			</div>
			<ContainerModal
				isOpen={modalOpen}
				setIsOpen={setModalOpen}
				containers={containers}
				onConfirm={handleConfirm}
				operation={operation}
				volumeName={volume.name}
				volumeSize={volume.size}
			/>
			<Dialog open={configureOpen} onOpenChange={setConfigureOpen}>
				<ConfigurationDialog
					volume={volume}
					isOpen={configureOpen}
					setIsOpen={setConfigureOpen}
				/>
			</Dialog>
		</>
	);
};
