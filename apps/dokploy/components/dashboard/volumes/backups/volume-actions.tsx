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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { HelpCircle, Settings2 } from "lucide-react";
import { useEffect } from "react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ContainerModal } from "./container-modal";

const VolumeBackupConfigSchema = z.object({
	destinationId: z.string().min(1, "Destination required"),
	prefix: z.string().min(1, "Prefix required"),
	filenamePattern: z.string().min(1, "Filename pattern required"),
	scheduleType: z.enum(["daily", "weekly", "monthly", "custom"]),
	schedule: z.string().min(1, "Schedule required"),
	selectedDays: z.array(z.string()).optional(),
	hour: z
		.string()
		.regex(/^([0-1]?[0-9]|2[0-3])$/, "Invalid hour format")
		.optional(),
	minute: z
		.string()
		.regex(/^[0-5]?[0-9]$/, "Invalid minute format")
		.optional(),
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
			filenamePattern: "backup-{name}-{year}-{month}-{day}",
			scheduleType: "daily",
			schedule: "0 0 * * *",
			selectedDays: [],
			hour: "00",
			minute: "00",
			enabled: true,
		},
		resolver: zodResolver(VolumeBackupConfigSchema),
	});

	const scheduleType = form.watch("scheduleType");
	const hour = form.watch("hour");
	const minute = form.watch("minute");
	const selectedDays = form.watch("selectedDays");

	useEffect(() => {
		if (scheduleType === "daily") {
			form.setValue("schedule", `0 ${minute} ${hour} * * *`);
		} else if (scheduleType === "weekly") {
			const days = selectedDays?.join(",") || "*";
			form.setValue("schedule", `0 ${minute} ${hour} * * ${days}`);
		} else if (scheduleType === "monthly") {
			form.setValue("schedule", `0 ${minute} ${hour} 1 * *`);
		}
	}, [scheduleType, hour, minute, selectedDays]);

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
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Configure Volume Backup</DialogTitle>
					<DialogDescription>
						Configure automated backups for this volume
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-2">
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
											<FormLabel>Prefix</FormLabel>
											<FormControl>
												<Input
													placeholder="backups/volumes/my-volume"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												Use if you want to store in a specific path of your
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
											<FormLabel className="flex items-center gap-2">
												Filename Pattern
												<Popover>
													<PopoverTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-4 w-4 p-0"
														>
															<HelpCircle className="h-4 w-4" />
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-80">
														<div className="space-y-2">
															<h4 className="font-medium">Format Variables</h4>
															<p className="text-sm text-muted-foreground">
																Available variables for filename pattern:
															</p>
															<ul className="text-sm text-muted-foreground space-y-1">
																<li>
																	<code>{"{name}"}</code> - Volume name
																</li>
																<li>
																	<code>{"{year}"}</code> - Year (e.g., 2024)
																</li>
																<li>
																	<code>{"{month}"}</code> - Month (01-12)
																</li>
																<li>
																	<code>{"{day}"}</code> - Day (01-31)
																</li>
																<li>
																	<code>{"{hour}"}</code> - Hour (00-23)
																</li>
																<li>
																	<code>{"{minute}"}</code> - Minute (00-59)
																</li>
																<li>
																	<code>{"{second}"}</code> - Second (00-59)
																</li>
															</ul>
														</div>
													</PopoverContent>
												</Popover>
											</FormLabel>
											<FormControl>
												<Input
													className="font-mono"
													placeholder="backup-{'{year}'}-{'{month}'}-{'{day}'}"
													{...field}
												/>
											</FormControl>
											<FormDescription>
												<span className="italic">
													Example: {volume.name}-
													{`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`}
													.tgz
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
								<h3 className="text-sm font-medium">Schedule Settings</h3>
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
														<SelectValue placeholder="Select schedule type" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="daily">Daily</SelectItem>
														<SelectItem value="weekly">Weekly</SelectItem>
														<SelectItem value="monthly">Monthly</SelectItem>
														<SelectItem value="custom">
															Custom (cron)
														</SelectItem>
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{scheduleType !== "custom" && (
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
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
									</div>
								)}

								{scheduleType === "weekly" && (
									<FormField
										control={form.control}
										name="selectedDays"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Days</FormLabel>
												<FormControl>
													<div className="grid grid-cols-4 gap-2">
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
																type="button"
																className={`${
																	field.value?.includes(day.value)
																		? "bg-primary text-primary-foreground"
																		: ""
																}`}
																onClick={() => {
																	const newValue = field.value || [];
																	const index = newValue.indexOf(day.value);
																	if (index === -1) {
																		field.onChange([...newValue, day.value]);
																	} else {
																		field.onChange(
																			newValue.filter((d) => d !== day.value),
																		);
																	}
																}}
															>
																{day.label}
															</Button>
														))}
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								{scheduleType === "custom" && (
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
													Enter a custom cron expression for more specific
													scheduling needs
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
		</Dialog>
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
