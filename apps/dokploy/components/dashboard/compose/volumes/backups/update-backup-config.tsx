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
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Eye, HelpCircle } from "lucide-react";
import { useEffect } from "react";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import type { Volume } from "./show-volume-backups";

const VolumeBackupConfigSchema = z.object({
	destinationId: z.string().min(1, "Destination required"),
	prefix: z.string().min(1, "Prefix required"),
	filenamePattern: z.string().min(1, "Filename pattern required"),
	scheduleType: z.enum([
		"fixed_interval",
		"hourly",
		"daily",
		"weekly",
		"monthly",
		"custom",
	]),
	schedule: z.string().min(1, "Schedule required"),
	selectedDays: z.array(z.string()).optional(),
	monthDay: z
		.string()
		.regex(/^([1-9]|[12][0-9]|3[01])$/, "Invalid day of month")
		.optional(),
	hour: z
		.string()
		.regex(/^([0-1]?[0-9]|2[0-3])$/, "Invalid hour format")
		.optional(),
	minute: z
		.string()
		.regex(/^[0-5]?[0-9]$/, "Invalid minute format")
		.optional(),
	enabled: z.boolean(),
	everyXMinutes: z
		.string()
		.regex(/^([1-9]|[1-5]\d)$/, "Invalid minute interval")
		.optional(),
});

type VolumeBackupConfig = z.infer<typeof VolumeBackupConfigSchema>;

interface UpdateBackupProps {
	volume: Volume;
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
	onConfigure?: (volume: Volume) => void;
}

export function resolveFilenamePattern(pattern: string, volume: Volume) {
	return pattern
		.replace(/{name}/g, volume.name)
		.replace(/{YYYY}/g, new Date().getFullYear().toString())
		.replace(/{MM}/g, (new Date().getMonth() + 1).toString().padStart(2, "0"))
		.replace(/{dd}/g, new Date().getDate().toString().padStart(2, "0"))
		.replace(/{HH}/g, new Date().getHours().toString().padStart(2, "0"))
		.replace(/{mm}/g, new Date().getMinutes().toString().padStart(2, "0"))
		.replace(/{ss}/g, new Date().getSeconds().toString().padStart(2, "0"))
		.replace(
			/{SSS}/g,
			new Date().getMilliseconds().toString().padStart(3, "0"),
		);
}

export const UpdateBackup = ({
	volume,
	isOpen,
	setIsOpen,
	onConfigure,
}: UpdateBackupProps) => {
	const form = useForm<VolumeBackupConfig>({
		defaultValues: {
			destinationId: "",
			prefix: "/",
			filenamePattern: "{name}-{YYYY}-{MM}-{dd}-{HH}{mm}.tgz",
			scheduleType: "daily",
			schedule: "0 0 * * *",
			selectedDays: [],
			hour: "00",
			minute: "00",
			monthDay: "01",
			enabled: true,
			everyXMinutes: "5",
		},
		resolver: zodResolver(VolumeBackupConfigSchema),
	});

	const scheduleType = form.watch("scheduleType");
	const hour = form.watch("hour");
	const minute = form.watch("minute");
	const selectedDays = form.watch("selectedDays");
	const monthDay = form.watch("monthDay");

	useEffect(() => {
		if (scheduleType === "hourly") {
			form.setValue("schedule", `0 ${minute} * * * *`);
		} else if (scheduleType === "daily") {
			form.setValue("schedule", `0 ${minute} ${hour} * * *`);
		} else if (scheduleType === "weekly") {
			const days = selectedDays?.join(",") || "*";
			form.setValue("schedule", `0 ${minute} ${hour} * * ${days}`);
		} else if (scheduleType === "monthly") {
			const day = monthDay || "1";
			form.setValue("schedule", `0 ${minute} ${hour} ${day} * *`);
		} else if (scheduleType === "fixed_interval") {
			const interval = form.getValues("everyXMinutes") || "5";
			form.setValue("schedule", `0 */${interval} * * * *`);
		}
	}, [scheduleType, hour, minute, selectedDays, monthDay, form]);

	const onSubmit = async (data: VolumeBackupConfig) => {
		try {
			// Placeholder for actual submission logic
			toast.success("Backup configuration saved");
			setIsOpen(false);
		} catch (error) {
			toast.error("Failed to save configuration");
		}
	};

	const backupVariant: "default" | "secondary" | "destructive" = (() => {
		if (!volume.lastBackup) {
			return "secondary";
		}

		const lastBackupDate = new Date(volume.lastBackup);
		const diffMs = Date.now() - lastBackupDate.getTime();
		const diffHours = diffMs / (1000 * 60 * 60);
		const diffDays = diffHours / 24;

		if (scheduleType === "daily") {
			return diffHours < 24 ? "default" : "destructive";
		}

		if (scheduleType === "monthly") {
			return diffDays < 30 ? "default" : "destructive";
		}

		return "secondary";
	})();

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						Configure Volume Backup{volume.name ? ` - ${volume.name}` : ""}
					</DialogTitle>
					<DialogDescription>
						Configure automated backups for this volume
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
											<FormLabel>Path Prefix</FormLabel>
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
																	<code>{"{YYYY}"}</code> - Year (e.g., 2024)
																</li>
																<li>
																	<code>{"{MM}"}</code> - Month (01-12)
																</li>
																<li>
																	<code>{"{dd}"}</code> - Day (01-31)
																</li>
																<li>
																	<code>{"{HH}"}</code> - Hour (00-23)
																</li>
																<li>
																	<code>{"{mm}"}</code> - Minute (00-59)
																</li>
																<li>
																	<code>{"{ss}"}</code> - Second (00-59)
																</li>
																<li>
																	<code>{"{SSS}"}</code> - Millisecond (000-999)
																</li>
															</ul>
														</div>
													</PopoverContent>
												</Popover>
											</FormLabel>
											<FormControl>
												<Input
													className="font-mono"
													placeholder="{name}-{YYYY}-{MM}-{dd}-{HH}{mm}{ss}{SSS}.tgz"
													{...field}
												/>
											</FormControl>
											<FormDescription className="flex items-center gap-1">
												<Eye className="h-4 w-4 inline-block ml-2" />
												<span className="inline-block align-middle">
													{resolveFilenamePattern(field.value, volume)}
												</span>
											</FormDescription>
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
													disabled={!form.watch("enabled")}
												>
													<SelectTrigger>
														<SelectValue placeholder="Select schedule type" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="hourly">Hourly</SelectItem>
														<SelectItem value="daily">Daily</SelectItem>
														<SelectItem value="weekly">Weekly</SelectItem>
														<SelectItem value="monthly">Monthly</SelectItem>
														<SelectItem value="fixed_interval">
															Fixed Interval
														</SelectItem>
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

								{scheduleType === "fixed_interval" && (
									<FormField
										control={form.control}
										name="everyXMinutes"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Interval</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={1}
														max={59}
														placeholder="5"
														disabled={!form.watch("enabled")}
														{...field}
													/>
												</FormControl>
												<FormDescription>
													Enter the interval in minutes (1-59)
												</FormDescription>
												<FormMessage />
											</FormItem>
										)}
									/>
								)}

								{scheduleType !== "custom" &&
									scheduleType !== "fixed_interval" && (
										<div
											className={`grid gap-2 ${
												scheduleType === "hourly"
													? "grid-cols-1"
													: scheduleType === "monthly"
														? "grid-cols-3"
														: "grid-cols-2"
											}`}
										>
											{scheduleType === "monthly" && (
												<FormField
													control={form.control}
													name="monthDay"
													render={({ field }) => (
														<FormItem>
															<FormLabel>Day of Month</FormLabel>
															<FormControl>
																<Select
																	defaultValue={field.value}
																	onValueChange={field.onChange}
																	disabled={!form.watch("enabled")}
																>
																	<SelectTrigger>
																		<SelectValue placeholder="Select day" />
																	</SelectTrigger>
																	<SelectContent>
																		{Array.from({ length: 31 }, (_, i) => (
																			<SelectItem
																				key={i + 1}
																				value={(i + 1)
																					.toString()
																					.padStart(2, "0")}
																			>
																				{(i + 1).toString().padStart(2, "0")}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
															</FormControl>
															<FormMessage />
														</FormItem>
													)}
												/>
											)}
											{scheduleType !== "hourly" && (
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
																	disabled={!form.watch("enabled")}
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
											)}
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
																disabled={!form.watch("enabled")}
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
													<div className="grid grid-cols-7 gap-1.5 w-full">
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
																disabled={!form.watch("enabled")}
																className={`w-full ${
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
														disabled={!form.watch("enabled")}
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
							<div className="w-full flex justify-between items-center">
								{volume.lastBackup ? (
									<Badge
										variant={backupVariant}
										className="flex items-center gap-1 leading-none"
									>
										{backupVariant === "destructive" && (
											<AlertTriangle className="h-4 w-4 relative" />
										)}
										Last backup:{" "}
										{formatDistanceToNow(new Date(volume.lastBackup), {
											addSuffix: true,
											includeSeconds: true,
										})}
									</Badge>
								) : (
									<Badge variant="secondary">Last backup: Never</Badge>
								)}
								<div className="flex items-center gap-2">
									<Button
										variant="outline"
										onClick={() => setIsOpen(false)}
										className="mr-2"
									>
										Cancel
									</Button>
									<Button
										type="submit"
										onClick={() => {
											toast.success("Backup configuration updated");
											setIsOpen(false);
										}}
									>
										{volume.lastBackup ? "Update" : "Save"}
									</Button>
								</div>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
