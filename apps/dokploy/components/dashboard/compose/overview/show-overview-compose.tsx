import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusTooltip } from "../../../../components/shared/status-tooltip";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../../../../components/ui/card";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "../../../../components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../../../../components/ui/table";
import { api } from "../../../../utils/api";

type DockerContainerState =
	| "running"
	| "exited"
	| "created"
	| "restarting"
	| "removing"
	| "paused"
	| "dead";

interface ContainerHealthLog {
	Start: string;
	End: string;
	ExitCode: number;
	Output: string;
}

interface ContainerHealth {
	Status: string | undefined;
	FailingStreak: number | undefined;
	Log: Array<ContainerHealthLog> | undefined;
}

interface ContainerState {
	Health: ContainerHealth | undefined;
	StartedAt: string | undefined;
	Status: string | undefined;
	Running: boolean | undefined;
	Paused: boolean | undefined;
	Restarting: boolean | undefined;
	OOMKilled: boolean | undefined;
	Dead: boolean | undefined;
	Pid: number | undefined;
	ExitCode: number | undefined;
	Error: string | undefined;
	FinishedAt: string | undefined;
}

interface ContainerConfig {
	Id: string;
	State: ContainerState | undefined;
}

interface Container {
	containerId: string;
	name: string;
	state: string;
	health: ContainerHealth | undefined;
	startedAt: string | undefined;
}

interface Props {
	composeId: string;
	serverId: string;
	appName: string;
	appType: "docker-compose" | "stack";
}

import { ExternalLink, FileText } from "lucide-react";
import { useRouter } from "next/router";
import React, { memo } from "react";

// Separate components for better organization and hook consistency
const HealthStatusBadge = memo(({ container }: { container: Container }) => {
	// Enhanced health status processing with validation
	const healthStatus = container.health?.Status?.toLowerCase() ?? null;
	const hasHealth = !!container.health?.Status;
	const failingStreak = container.health?.FailingStreak ?? 0;
	const healthLogs = container.health?.Log ?? [];

	console.debug(`Health status for ${container.name}:`, {
		status: healthStatus,
		hasHealth,
		failingStreak,
		logCount: healthLogs.length,
		rawHealth: container.health,
		containerState: container.state,
	});

	// Determine badge variant and class based on health status
	let variant: "default" | "destructive" | "secondary" = "secondary";
	let className: string | undefined;

	if (healthStatus === "healthy") {
		variant = "default";
		className = "bg-green-500 hover:bg-green-500/90";
	} else if (healthStatus === "unhealthy") {
		variant = "destructive";
	}

	return (
		<Badge variant={variant} className={className}>
			{hasHealth && container.health?.Status
				? container.health.Status
				: "No health check"}
		</Badge>
	);
});

const UptimeDisplay = memo(({ container }: { container: Container }) => {
	try {
		if (!container?.startedAt) {
			console.debug(`No startedAt for container ${container.name}:`, {
				container,
				state: container.state,
				health: container.health?.Status,
			});
			return <>-</>;
		}

		const startDate = new Date(container.startedAt);
		if (Number.isNaN(startDate.getTime())) {
			console.warn(`Invalid startedAt date for ${container.name}:`, {
				startedAt: container.startedAt,
				container,
			});
			return <>-</>;
		}

		const now = new Date();
		if (startDate > now) {
			console.warn(`Future startedAt date for ${container.name}:`, {
				startedAt: container.startedAt,
				now: now.toISOString(),
				diff: startDate.getTime() - now.getTime(),
				container,
			});
			return <>-</>;
		}

		const uptime = formatDistanceToNow(startDate, {
			addSuffix: true,
			includeSeconds: true,
		});

		console.debug(`Uptime for ${container.name}:`, {
			startedAt: container.startedAt,
			parsedStartDate: startDate.toISOString(),
			uptime,
			now: now.toISOString(),
			container: {
				state: container.state,
				health: container.health?.Status,
			},
		});

		return <>{uptime}</>;
	} catch (error) {
		console.error(`Error formatting uptime for ${container.name}:`, {
			error,
			container,
			startedAt: container.startedAt,
		});
		return <>-</>;
	}
});

export const ShowOverviewCompose = ({
	composeId,
	serverId,
	appName,
	appType,
}: Props) => {
	const router = useRouter();

	const [containerAppName, setContainerAppName] = useState<string>();
	const [containerId, setContainerId] = useState<string>();

	// Simplified services query with better error handling
	const { data: services = [], isLoading: isLoadingServices } =
		api.compose.loadServices.useQuery(
			{
				composeId,
				type: "fetch",
			},
			{
				enabled: !!serverId && !!appName,
				refetchInterval: 5000 as const, // Refresh every 5 seconds for real-time updates
				retry: 3,
				onError: (error) => {
					console.error("Failed to fetch services:", error);
				},
			},
		);

	// Query container details with real-time updates
	// Using props directly for better type safety
	const {
		data: containerDetails = [],
		isLoading: isLoadingContainers,
		error: containerError,
	} = api.docker.getContainersByAppNameMatch.useQuery(
		{
			appName,
			appType,
			serverId,
		},
		{
			enabled: !!composeId,
			refetchInterval: 5000 as const,
			retry: 3,
			onError: (error) => {
				console.error("Failed to fetch container details:", error);
			},
		},
	);
	// Simplified query enabling - remove dependency on containerDetails.length
	// Simplified query enabling logic to match monitoring tab pattern
	// Enhanced container config query with better error handling and validation
	const {
		data: containerConfigs = [],
		error: containerConfigError,
		isLoading: isLoadingConfigs,
	} = api.docker.getContainersConfig.useQuery(
		{
			appName,
			appType,
			serverId,
			containerIds:
				containerDetails
					?.filter((c): c is NonNullable<typeof c> => !!c?.containerId)
					.map((c) => c.containerId) || [],
		},
		{
			enabled: !!serverId && !!appName,
			refetchInterval: 5000 as const,
			retry: 3,
			onError: (error) => {
				console.error("Failed to fetch container configs:", error, {
					composeId,
					serverId,
					appName,
					containerCount: containerDetails?.length,
				});
			},
			onSuccess: (data) => {
				console.debug("Successfully fetched container configs:", {
					configCount: data.length,
					containers: data.map((config) => ({
						id: config.Id,
						name: config.Name,
						state: config.State?.Status,
						health: config.State?.Health?.Status,
						startedAt: config.State?.StartedAt,
					})),
				});
			},
		},
	);

	// Combine container details with their configs
	// Helper function to find matching container with flexible name matching
	const findMatchingContainer = (
		serviceName: string,
		containers: Container[],
	) => {
		// Try exact match first
		const exactMatch = containers.find((c) => c.name === serviceName);
		if (exactMatch) return exactMatch;

		// Try matching service name within container name (for prefixed/suffixed names)
		const partialMatch = containers.find(
			(c) => c.name.includes(serviceName) || serviceName.includes(c.name),
		);

		if (partialMatch) {
			console.log(
				`Found partial match for service ${serviceName}:`,
				partialMatch.name,
			);
		} else {
			console.warn(
				`No container match found for service ${serviceName}. Available containers:`,
				containers.map((c) => c.name),
			);
		}

		return partialMatch;
	};

	// Enhanced container data processing with strict type checking and validation
	const enrichedContainers = useMemo((): Container[] => {
		// Allow processing even without configs, just with less data
		if (!containerDetails) {
			console.debug("No container details available");
			return [];
		}

		return containerDetails
			.filter((detail): detail is NonNullable<typeof detail> => {
				const isValid = !!(
					detail?.name &&
					detail?.containerId &&
					detail?.state
				);
				if (!isValid) {
					console.warn("Invalid container detail:", detail);
				}
				return isValid;
			})
			.map((detail): Container => {
				const config = containerConfigs.find(
					(c: ContainerConfig) => c.Id === detail.containerId,
				);

				console.debug(`Processing container ${detail.name}:`, {
					containerId: detail.containerId,
					hasConfig: !!config,
					startedAt: config?.State?.StartedAt,
					health: config?.State?.Health?.Status,
				});

				// Enhanced container data with strict validation
				const enrichedContainer = {
					name: detail.name,
					containerId: detail.containerId,
					state: detail.state,
					health: config?.State?.Health ?? undefined,
					startedAt: config?.State?.StartedAt ?? undefined,
				};

				// Log container enrichment for debugging
				console.debug(`Enriched container ${detail.name}:`, {
					...enrichedContainer,
					hasHealth: !!enrichedContainer.health,
					hasStartedAt: !!enrichedContainer.startedAt,
				});

				return enrichedContainer;
			});
	}, [containerDetails, containerConfigs]);

	// Simplified container selection with stable hook ordering
	useEffect(() => {
		if (!enrichedContainers.length) {
			console.debug("No containers available yet");
			return;
		}

		const selectContainer = (container: Container) => {
			console.debug("Selecting container:", {
				name: container.name,
				containerId: container.containerId,
			});

			setContainerAppName(container.name);
			setContainerId(container.containerId);

			void router.push(
				{
					pathname: router.pathname,
					query: {
						...router.query,
						containerId: container.containerId,
					},
				},
				undefined,
				{ shallow: true },
			);
		};

		// Try to select container from query ID first
		if (router.query.containerId) {
			const container = enrichedContainers.find(
				(c) => c.containerId === router.query.containerId,
			);
			if (container) {
				selectContainer(container);
				return;
			}
		}

		// Fall back to first container if no match or no query ID
		if (enrichedContainers.length > 0) {
			// Ensure container exists and has required properties
			const firstContainer = enrichedContainers[0];
			if (firstContainer?.name && firstContainer?.containerId) {
				console.debug("Selecting first container:", {
					name: firstContainer.name,
					containerId: firstContainer.containerId,
				});
				selectContainer(firstContainer);
			} else {
				console.warn(
					"First container is missing required properties:",
					firstContainer,
				);
			}
		} else {
			console.debug("No containers available for selection");
		}
	}, [enrichedContainers, router.query]);

	// Map container state and health to status with proper typing and detailed logging
	const mapContainerStateToStatus = (
		state: DockerContainerState | string,
		health?: ContainerHealth,
	): "idle" | "error" | "done" | "running" => {
		// Enhanced logging for state mapping with full context
		console.debug("Mapping container state to status:", {
			state,
			healthStatus: health?.Status,
			healthFailingStreak: health?.FailingStreak,
			hasHealthLogs: !!health?.Log?.length,
			rawHealth: health,
			rawState: state,
		});

		// Normalize and validate state with better error handling
		const normalizedState = (state || "").toLowerCase().trim();

		if (!normalizedState) {
			console.warn("Empty or invalid container state received", {
				originalState: state,
				health,
			});
			return "error";
		}

		// Prioritize health status with enhanced validation
		if (health?.Status) {
			const healthStatus = health.Status.toLowerCase();
			const failingStreak = health.FailingStreak ?? 0;
			const hasLogs = (health.Log?.length ?? 0) > 0;

			console.debug("Processing health status:", {
				status: healthStatus,
				failingStreak,
				hasLogs,
				logCount: health.Log?.length,
				lastLog: hasLogs ? health.Log?.[0] : undefined,
			});

			// Enhanced health status mapping
			switch (healthStatus) {
				case "healthy":
					return "running";
				case "unhealthy":
					// Consider failing streak for status
					return failingStreak > 3 ? "error" : "idle";
				case "starting":
					return "idle";
				case "none":
					// Fall through to container state check
					console.debug("Health status 'none', checking container state");
					break;
				default:
					console.warn(`Unknown health status: ${healthStatus}`, {
						failingStreak,
						logCount: health.Log?.length,
						lastLog: hasLogs ? health.Log?.[0] : undefined,
					});
				// Fall through to container state check
			}
		} else {
			console.debug("No health status available, using container state", {
				normalizedState,
			});
		}

		// Enhanced state mapping with validation and detailed logging
		let status: "idle" | "error" | "done" | "running";

		switch (normalizedState as DockerContainerState) {
			case "running":
				status = "running";
				break;
			case "exited":
				status = "error";
				break;
			case "created":
				status = "idle"; // New container, not yet started
				break;
			case "paused":
				status = "idle"; // Container is paused but can be resumed
				break;
			case "restarting":
				status = "idle"; // Changed from running to idle during restart
				break;
			case "removing":
				status = "error"; // Container is being removed
				break;
			case "dead":
				status = "error"; // Container is in a dead state
				break;
			default:
				console.warn(`Unknown container state: ${normalizedState}`, {
					originalState: state,
					health,
				});
				status = "error"; // Unknown states treated as errors
		}

		// Enhanced debug logging with full context
		console.debug("Final status mapping:", {
			originalState: state,
			normalizedState,
			healthStatus: health?.Status,
			healthFailingStreak: health?.FailingStreak,
			hasHealthLogs: !!health?.Log?.length,
			resultStatus: status,
		});

		return status;
	};

	return (
		<Card className="bg-background">
			<CardHeader>
				<div className="flex flex-row gap-2 justify-between flex-wrap">
					<CardTitle className="text-xl">Services Overview</CardTitle>
					<Badge>{appType === "docker-compose" ? "Compose" : "Stack"}</Badge>
				</div>
			</CardHeader>
			<CardContent>
				<div className="flex flex-row gap-4 mb-4">
					<Select
						onValueChange={(value) => {
							console.debug("Container selection changed:", { value });
							const container = enrichedContainers.find(
								(c) => c.name === value,
							);
							if (container) {
								console.debug("Found matching container:", {
									name: container.name,
									containerId: container.containerId,
								});
								setContainerAppName(value);
								setContainerId(container.containerId);
								// Preserve all query parameters when updating container
								void router.push(
									{
										query: {
											...router.query,
											containerId: container.containerId,
										},
									},
									undefined,
									{ shallow: true },
								);
							}
						}}
						value={containerAppName}
					>
						<SelectTrigger className="w-[300px]">
							{isLoadingContainers ? (
								<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground">
									<span>Loading...</span>
									<Loader2 className="animate-spin size-4" />
								</div>
							) : (
								<SelectValue placeholder="Select a container" />
							)}
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{enrichedContainers.map((container) => (
									<SelectItem
										key={container.containerId}
										value={container.name}
									>
										{container.name} ({container.containerId}) {container.state}
									</SelectItem>
								))}
								<SelectLabel>
									Containers ({enrichedContainers.length})
								</SelectLabel>
							</SelectGroup>
						</SelectContent>
					</Select>
				</div>
				<ScrollArea className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Service Name</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Health</TableHead>
								<TableHead>Uptime</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{containerError ? (
								<TableRow>
									<TableCell
										colSpan={5}
										className="h-24 text-center text-destructive"
									>
										Failed to fetch container details. Please try again.
									</TableCell>
								</TableRow>
							) : isLoadingServices ||
								isLoadingContainers ||
								isLoadingConfigs ? (
								<TableRow>
									<TableCell colSpan={5} className="h-24 text-center">
										<div className="flex flex-col items-center justify-center gap-2">
											<Loader2 className="h-6 w-6 animate-spin" />
											<div className="text-sm text-muted-foreground">
												{isLoadingServices && "Loading services..."}
												{isLoadingContainers && "Loading containers..."}
												{isLoadingConfigs && "Loading container details..."}
											</div>
										</div>
									</TableCell>
								</TableRow>
							) : enrichedContainers.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="h-24 text-center">
										No containers found
									</TableCell>
								</TableRow>
							) : (
								enrichedContainers.map((container) => {
									const isSelected = container.containerId === containerId;
									return (
										<TableRow
											key={container.containerId}
											className={isSelected ? "bg-muted/50" : ""}
										>
											<TableCell className="font-medium">
												{container.name}
											</TableCell>
											<TableCell>
												<StatusTooltip
													status={mapContainerStateToStatus(
														container.state,
														container.health,
													)}
												/>
											</TableCell>
											<TableCell>
												<HealthStatusBadge container={container} />
											</TableCell>
											<TableCell>
												<UptimeDisplay container={container} />
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															// Use the selected container from the row
															const selectedContainer = enrichedContainers.find(
																(c) => c.containerId === container.containerId
															);

															if (!selectedContainer?.containerId || !selectedContainer?.name) {
																console.warn(
																	"Invalid container for logs:",
																	selectedContainer,
																);
																return;
															}

															// Update container selection state
															setContainerAppName(selectedContainer.name);
															setContainerId(selectedContainer.containerId);

															// Preserve all existing query parameters
															const query = {
																...router.query,
																tab: "logs",
																containerId: selectedContainer.containerId,
																containerName: selectedContainer.name,
															};

															// Enhanced debug logging
															console.debug("Routing to logs:", {
																query,
																selectedContainer: {
																	id: selectedContainer.containerId,
																	name: selectedContainer.name,
																	state: selectedContainer.state,
																	health: selectedContainer.health?.Status,
																	startedAt: selectedContainer.startedAt,
																},
																currentPath: router.pathname,
																currentQuery: router.query,
															});

															// Use consistent routing with query preservation
															void router.push(
																{
																	pathname: router.pathname,
																	query,
																},
																undefined,
																{ shallow: true },
															);
														}}
													>
														<FileText className="h-4 w-4 mr-2" />
														Logs
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															// Use the selected container from the row
															const selectedContainer = enrichedContainers.find(
																(c) => c.containerId === container.containerId
															);

															if (!selectedContainer?.containerId || !selectedContainer?.name) {
																console.warn(
																	"Invalid container for monitoring:",
																	selectedContainer,
																);
																return;
															}

															// Update container selection state
															setContainerAppName(selectedContainer.name);
															setContainerId(selectedContainer.containerId);

															// Preserve all existing query parameters
															const query = {
																...router.query,
																tab: "monitoring",
																containerId: selectedContainer.containerId,
																containerName: selectedContainer.name,
															};

															// Enhanced debug logging
															console.debug("Routing to monitoring:", {
																query,
																selectedContainer: {
																	id: selectedContainer.containerId,
																	name: selectedContainer.name,
																	state: selectedContainer.state,
																	health: selectedContainer.health?.Status,
																	startedAt: selectedContainer.startedAt,
																},
																currentPath: router.pathname,
																currentQuery: router.query,
															});

															// Use consistent routing with query preservation
															void router.push(
																{
																	pathname: router.pathname,
																	query,
																},
																undefined,
																{ shallow: true },
															);
														}}
													>
														<ExternalLink className="h-4 w-4 mr-2" />
														Monitor
													</Button>
												</div>
											</TableCell>
										</TableRow>
									);
								})
							)}
						</TableBody>
					</Table>
				</ScrollArea>
			</CardContent>
		</Card>
	);
};
