import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
	FormMessage,
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
	onConfigure?: (volume: Volume) => void;
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
	onConfigure,
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
		<DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
			<DialogHeader>
				<DialogTitle>Configure Volume Backup</DialogTitle>
				<DialogDescription>
					Configure automated backups for this volume
				</DialogDescription>
			</DialogHeader>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<Card className="p-4 space-y-4">
						<h3 className="text-sm font-medium">Destination Settings</h3>
						<FormField
							control={form.control}
							name="destinationId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Destination</FormLabel>
									<FormControl>
										<Select
											defaultValue={field.value}
											onValueChange={field.onChange}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select destination" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="hetzner">Hetzner - Cascade</SelectItem>
												<SelectItem value="aws">AWS S3</SelectItem>
												<SelectItem value="do">DigitalOcean Spaces</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="prefix"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Prefix</FormLabel>
									<FormControl>
										<Input
											placeholder="backups/volumes/my-volume"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="filenamePattern"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Filename Pattern</FormLabel>
									<FormControl>
										<Input
											className="font-mono"
											placeholder="{{name}}-{{YYYYMMDD}}-{{HHmmss}}.tgz"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</Card>

					<Card className="p-4 space-y-4">
						<h3 className="text-sm font-medium">Schedule Settings</h3>
						<FormField
							control={form.control}
							name="scheduleType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Schedule Type</FormLabel>
									<FormControl>
										<Select
											defaultValue={field.value}
											onValueChange={field.onChange}
										>
												<SelectTrigger>
												<SelectValue placeholder="Select frequency" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="hourly">Hourly</SelectItem>
												<SelectItem value="daily">Daily</SelectItem>
												<SelectItem value="weekly">Weekly</SelectItem>
												<SelectItem value="monthly">Monthly</SelectItem>
												<SelectItem value="custom">Custom (cron)</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						{/* Time selection for non-custom schedules */}
						{form.watch("scheduleType") !== "custom" && (
							<div className="grid grid-cols-2 gap-2">
								<FormField
									control={form.control}
									name="hour"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Hour</FormLabel>
											<FormControl>
												<Select
													defaultValue={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select hour" />
													</SelectTrigger>
													<SelectContent>
														{Array.from({ length: 24 }).map((_, i) => (
															<SelectItem
																key={i}
																value={i.toString().padStart(2, "0")}
															>
																{i.toString().padStart(2, "0")}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="minute"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Minute</FormLabel>
											<FormControl>
												<Select
													defaultValue={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select minute" />
													</SelectTrigger>
													<SelectContent>
														{Array.from({ length: 60 }).map((_, i) => (
															<SelectItem
																key={i}
																value={i.toString().padStart(2, "0")}
															>
																{i.toString().padStart(2, "0")}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}
						{form.watch("scheduleType") === "weekly" && (
							<FormField
								control={form.control}
								name="selectedDays"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Days</FormLabel>
										<FormControl>
											<Select
												defaultValue={field.value?.[0]}
												onValueChange={(value) => field.onChange([value])}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select days" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="0">Sunday</SelectItem>
													<SelectItem value="1">Monday</SelectItem>
													<SelectItem value="2">Tuesday</SelectItem>
													<SelectItem value="3">Wednesday</SelectItem>
													<SelectItem value="4">Thursday</SelectItem>
													<SelectItem value="5">Friday</SelectItem>
													<SelectItem value="6">Saturday</SelectItem>
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
						{form.watch("scheduleType") === "custom" && (
							<FormField
								control={form.control}
								name="schedule"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Cron Expression</FormLabel>
										<FormControl>
											<Input
												className="mt-1.5 font-mono"
												placeholder="0 0 * * *"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Use cron syntax (e.g., "0 0 * * *" for daily at midnight)
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<FormField
							control={form.control}
							name="enabled"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
									<div className="space-y-0.5">
										<FormLabel>Schedule Active</FormLabel>
										<FormDescription>
											Turn scheduled backups on or off
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>
					</Card>

					<DialogFooter>
						<Button type="submit">
							{volume.lastBackup ? "Update" : "Save"} Configuration
						</Button>
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
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<ConfigurationDialog
					volume={volume}
					isOpen={isOpen}
					setIsOpen={setIsOpen}
					onConfigure={onConfigure}
				/>
			</Dialog>
			<div className="flex items-center gap-2">
				<Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
					<Settings2 className="h-4 w-4" />
					Configure
				</Button>
				{/* PLACEHOLDER: backup and restore buttons */}
			</div>
		</>
	);
};
