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
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="grid w-full gap-8"
				>
					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
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
													<SelectItem value="hetzner">
														Hetzner - Cascade
													</SelectItem>
													<SelectItem value="aws">AWS S3</SelectItem>
													<SelectItem value="do">
														DigitalOcean Spaces
													</SelectItem>
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
										<FormLabel>Prefix Destination</FormLabel>
										<FormControl>
											<Input
												placeholder="backups/volumes/my-volume"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Use if you want to storage in a specific path of your
											destination/bucket
										</FormDescription>
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
										<FormDescription>
											<span className="italic">
												{volume.name}-{new Date().getFullYear()}
												{new Date().getMonth()}
												{new Date().getDate()}-{new Date().getHours()}
												{new Date().getMinutes()}
												{new Date().getSeconds()}.tgz
											</span>
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</div>

					<div className="flex flex-col gap-4">
						<div className="flex flex-col gap-2">
							<FormField
								control={form.control}
								name="scheduleType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Frequency</FormLabel>
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
												<div className="flex flex-wrap gap-2">
													{[
														{ value: "0", label: "Sun" },
														{ value: "1", label: "Mon" },
														{ value: "2", label: "Tue" },
														{ value: "3", label: "Wed" },
														{ value: "4", label: "Thu" },
														{ value: "5", label: "Fri" },
														{ value: "6", label: "Sat" },
													].map(({ value, label }) => (
														<Button
															key={value}
															type="button"
															size="sm"
															variant={
																field.value?.includes(value)
																	? "default"
																	: "outline"
															}
															className="min-w-[3rem]"
															onClick={() => {
																const current = field.value || [];
																const updated = current.includes(value)
																	? current.filter((v) => v !== value)
																	: [...current, value];
																field.onChange(updated);
															}}
														>
															{label}
														</Button>
													))}
												</div>
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
													className="font-mono"
													placeholder="0 0 * * *"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Use cron syntax (e.g., "0 0 * * *" for daily at
												midnight)
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</div>
					</div>

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

					<DialogFooter>
						<Button type="submit">
							{volume.lastBackup ? "Update" : "Save"}
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
