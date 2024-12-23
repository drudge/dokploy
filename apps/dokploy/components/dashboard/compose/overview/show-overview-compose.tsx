import { StatusTooltip } from "@/components/shared/status-tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { api } from "@/utils/api";
import type { RouterInputs, RouterOutputs } from "@/utils/api";
import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

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

import { TRPCClientError } from "@trpc/client";
import { ExternalLink, FileText } from "lucide-react";
import { useRouter } from "next/router";
import type React from "react";
import { memo } from "react";

// Separate components for better organization and hook consistency
interface HealthStatusProps {
	health: ContainerHealth | undefined;
	name: string;
	state: string;
}

const HealthStatusBadge = memo(({ health, name, state }: HealthStatusProps): JSX.Element => {
	type BadgeVariant =
		| "default"
		| "destructive"
		| "secondary"
		| "red"
		| "yellow"
		| "orange"
		| "green"
		| "blue"
		| "blank"
		| "outline";

	interface BadgeInfo {
		variant: BadgeVariant;
		className: string | undefined;
		label: string;
		tooltip: string;
	}

	const badgeInfo = useMemo((): BadgeInfo => {
		// Enhanced health status processing with validation
		const healthStatus = health?.Status?.toLowerCase() ?? null;
		const hasHealth = !!health?.Status;
		const failingStreak = health?.FailingStreak ?? 0;
		const healthLogs = health?.Log ?? [];
		const lastLog = healthLogs[0];

		console.debug(`Health status for ${name}:`, {
			status: healthStatus,
			hasHealth,
			failingStreak,
			logCount: healthLogs.length,
			rawHealth: health,
			containerState: state,
		});

		// Build detailed tooltip information
		const tooltipParts: string[] = [];
		if (hasHealth) {
			tooltipParts.push(`Status: ${health?.Status}`);
			if (failingStreak > 0) {
				tooltipParts.push(`Failing Streak: ${failingStreak}`);
			}
			if (lastLog) {
				tooltipParts.push(
					`Last Check: ${new Date(lastLog.Start).toLocaleString()}`,
					`Exit Code: ${lastLog.ExitCode}`,
					`Output: ${lastLog.Output}`,
				);
			}
		} else {
			tooltipParts.push("No health check configured");
		}

		// Determine badge variant and class based on health status
		let variant:
			| "default"
			| "destructive"
			| "secondary"
			| "red"
			| "yellow"
			| "orange"
			| "green"
			| "blue"
			| "blank"
			| "outline" = "secondary";
		let className: string | undefined;
		// Initialize displayLabel with a default value
		let displayLabel: string = "No health check";
		let currentVariant: BadgeVariant = "secondary";
		let currentClassName: string | undefined = undefined;

		if (hasHealth && health?.Status) {
			displayLabel = health.Status;

			if (healthStatus === "healthy") {
				currentVariant = "green";
			} else if (healthStatus === "unhealthy") {
				currentVariant = "red";
				if (failingStreak > 0) {
					displayLabel = `Unhealthy (${failingStreak} fails)`;
				}
			} else if (healthStatus === "starting") {
				currentVariant = "yellow";
				displayLabel = "Starting";
			}
		}

		// Ensure all returned values are properly typed
		const result: BadgeInfo = {
			variant: currentVariant,
			className: currentClassName,
			label: displayLabel,
			tooltip: tooltipParts.join("\n"),
		};

		return result;
	}, [health, name, state]);

	const { variant, className, label, tooltip } = badgeInfo;

	return (
		<Badge variant={variant} className={className} title={tooltip}>
			{label}
		</Badge>
	);
});

interface UptimeDisplayProps {
	startedAt: string | undefined;
	name: string;
	state: string;
	health: ContainerHealth | undefined;
}

const UptimeDisplay = memo(({ startedAt, name, state, health }: UptimeDisplayProps) => {
	const { displayText, tooltip } = useMemo(() => {
		try {
			if (!startedAt) {
				console.debug(`No startedAt for container ${name}:`, {
					state,
					health: health?.Status,
				});
				return { displayText: "-", tooltip: "No start time available" };
			}

			const startDate = new Date(startedAt);
			if (Number.isNaN(startDate.getTime())) {
				console.warn(`Invalid startedAt date for ${name}:`, {
					startedAt,
					state,
					health: health?.Status,
				});
				return { displayText: "-", tooltip: "Invalid start time" };
			}

			const now = new Date();
			if (startDate > now) {
				console.warn(`Future startedAt date for ${name}:`, {
					startedAt,
					now: now.toISOString(),
					diff: startDate.getTime() - now.getTime(),
					state,
					health: health?.Status,
				});
				return { displayText: "-", tooltip: "Invalid future start time" };
			}

			const formattedUptime = formatDistanceToNow(startDate, {
				addSuffix: true,
				includeSeconds: true,
			});

			// Enhanced state-aware uptime display
			const normalizedState = state?.toLowerCase();
			const isRunning = normalizedState === "running";
			const displayUptime = isRunning
				? formattedUptime
				: `${normalizedState?.charAt(0).toUpperCase()}${normalizedState?.slice(1)} ${formattedUptime}`;

			const tooltipInfo = [
				`Started: ${startDate.toLocaleString()}`,
				`State: ${state}`,
				health?.Status
					? `Health: ${health.Status}`
					: "No health check",
			].join("\n");

			console.debug(`Uptime for ${name}:`, {
				startedAt,
				parsedStartDate: startDate.toISOString(),
				uptime: formattedUptime,
				displayUptime,
				now: now.toISOString(),
				state,
				health: health?.Status,
			});

			return { displayText: displayUptime, tooltip: tooltipInfo };
		} catch (error) {
			console.error(`Error formatting uptime for ${name}:`, {
				error,
				startedAt,
				state,
				health: health?.Status,
			});
			return { displayText: "-", tooltip: "Error calculating uptime" };
		}
	}, [startedAt, name, state, health]);

	return (
		<div className="text-sm text-muted-foreground" title={tooltip}>
			{displayText}
		</div>
	);
});

export const ShowOverviewCompose = ({
	composeId,
	serverId,
	appName,
	appType,
}: Props) => {
	const router = useRouter();
	const projectId =
		typeof router.query.projectId === "string"
			? router.query.projectId
			: undefined;

	// Simplified services query with better error handling
	// Use consistent hook placement and proper typing
	const { data: services = [], isLoading: isLoadingServices } =
		api.compose.loadServices.useQuery(
			{
				composeId,
				type: "fetch",
			},
			{
				enabled: !!serverId && serverId !== "null" && !!composeId,
				refetchInterval: 5000,
				retry: 3,
				onError(error) {
					console.error("Failed to fetch services:", error);
				},
			},
		);

	// Query container details with real-time updates
	// Using props directly for better type safety
	// Enhanced container details query with better error handling and validation
	const {
		data: containerDetails = [],
		isLoading: isLoadingContainers,
		error: containerError,
	} = api.docker.getContainersByAppNameMatch.useQuery(
		{
			appName,
			appType,
			serverId: serverId || "",
		},
		{
			enabled: Boolean(serverId) && serverId !== "null" && Boolean(appName) && Boolean(composeId),
			refetchInterval: 5000,
			retry: 3,
			onError(error) {
				console.error("Failed to fetch container details:", error, {
					serverId,
					appName,
					composeId,
				});
			},
			onSuccess(data) {
				console.debug("Successfully fetched container details:", {
					containerCount: data.length,
					containers: data.map(c => ({
						name: c.name,
						id: c.containerId,
						state: c.state
					})),
					query: {
						serverId,
						appName,
						appType
					}
				});
			},
		},
	);

	// Move containerIds calculation before its usage
	const containerIds = useMemo(() => {
		return (
			containerDetails
				?.filter(
					(
						c: RouterOutputs["docker"]["getContainersByAppNameMatch"][number],
					): c is NonNullable<typeof c> => !!c?.containerId,
				)
				.map(
					(c: RouterOutputs["docker"]["getContainersByAppNameMatch"][number]) =>
						c.containerId,
				) || []
		);
	}, [containerDetails]);

	// Enhanced container configs query with better dependency handling
	const {
		data: containerConfigs = [],
		error: containerConfigError,
		isLoading: isLoadingConfigs,
	} = api.docker.getContainersConfig.useQuery(
		{
			appName,
			appType,
			serverId: serverId || "",
			containerIds,
		},
		{
			enabled: Boolean(serverId) && 
				serverId !== "null" && 
				Boolean(appName) && 
				Boolean(composeId) && 
				containerIds.length > 0,
			refetchInterval: 5000,
			retry: 3,
			onError(error) {
				console.error("Failed to fetch container configs:", error, {
					composeId,
					serverId,
					appName,
					containerCount: containerIds.length,
					query: {
						serverId,
						appName,
						appType,
						containerIds
					}
				});
			},
			onSuccess(data) {
				console.debug("Successfully fetched container configs:", {
					configCount: data.length,
					containers: data.map((config) => ({
						id: config.Id,
						name: config.Name,
						state: config.State?.Status,
						health: config.State?.Health?.Status,
						startedAt: config.State?.StartedAt,
					})),
					query: {
						serverId,
						appName,
						appType,
						containerIds
					}
				});
			},
		},
	);

	// Move enrichedContainers calculation before its usage
	const enrichedContainers = useMemo((): Container[] => {
		console.debug("Starting container enrichment", {
			containerDetailsCount: containerDetails?.length,
			containerConfigsCount: containerConfigs?.length,
			loadingStates: {
				services: isLoadingServices,
				containers: isLoadingContainers,
				configs: isLoadingConfigs,
			},
		});

		if (isLoadingServices || isLoadingContainers || isLoadingConfigs) {
			return [];
		}

		const containers = containerDetails
			.map((detail) => {
				const config = containerConfigs?.find((c) => c.Id === detail.containerId);

				const enrichedContainer = {
					name: detail.name,
					containerId: detail.containerId,
					state: detail.state,
					health: config?.State?.Health
						? {
								Status: config.State.Health.Status,
								FailingStreak: config.State.Health.FailingStreak,
								Log: config.State.Health.Log,
						  }
						: undefined,
					startedAt: config?.State?.StartedAt
						? new Date(config.State.StartedAt).toISOString()
						: undefined,
				};

				return enrichedContainer;
			})
			.filter((container): container is Container => {
				const validation = {
					hasName: !!container.name,
					hasId: !!container.containerId,
					hasState: !!container.state,
				};

				return validation.hasName && validation.hasId && validation.hasState;
			});

		return containers;
	}, [containerDetails, containerConfigs, isLoadingServices, isLoadingContainers, isLoadingConfigs]);

	const [containerAppName, setContainerAppName] = useState<string>();
	const [containerId, setContainerId] = useState<string>();

	// Ensure we have required route parameters
	useEffect(() => {
		if (!projectId) {
			console.warn("Missing or invalid projectId in route parameters");
		}
	}, [projectId]);

	// Container selection handler with consistent hook usage
	const handleContainerSelect = useCallback(
		(value: string) => {
			console.debug("Container selection changed:", { value });
			const container = enrichedContainers.find((c) => c.name === value);
			
			if (!container?.containerId || !container?.name) {
				console.warn("Invalid container selected:", { value, container });
				return;
			}

			console.debug("Found matching container:", {
				name: container.name,
				containerId: container.containerId,
				state: container.state,
			});

			// Update container selection state
			setContainerAppName(container.name);
			setContainerId(container.containerId);

			// Update URL with selected container ID and preserve all query parameters
			void router.push(
				{
					pathname: router.pathname,
					query: {
						...router.query,
						containerId: container.containerId,
						serverId,
						appName,
						appType,
					},
				},
				undefined,
				{ shallow: true },
			);
		},
		[router, enrichedContainers, serverId, appName, appType],
	);

	// Handle navigation to logs view
	const handleViewLogs = useCallback(
		(container: Container) => {
			if (!container?.containerId) {
				console.warn("Cannot view logs: Invalid container:", container);
				return;
			}

			if (!projectId) {
				console.warn("Cannot view logs: Missing projectId in route");
				return;
			}

			console.debug("Navigating to logs view:", {
				containerId: container.containerId,
				name: container.name,
				projectId,
			});

			void router.push({
				pathname: `/dashboard/project/${projectId}/services/compose/${composeId}/logs`,
				query: {
					...router.query,
					containerId: container.containerId,
					serverId,
					appName,
					appType,
				},
			});
		},
		[router, projectId, composeId, serverId, appName, appType],
	);

	// Handle navigation to monitoring view
	const handleViewMonitoring = useCallback(
		(container: Container) => {
			if (!container?.containerId) {
				console.warn("Cannot view monitoring: Invalid container:", container);
				return;
			}

			if (!projectId) {
				console.warn("Cannot view monitoring: Missing projectId in route");
				return;
			}

			console.debug("Navigating to monitoring view:", {
				containerId: container.containerId,
				name: container.name,
				projectId,
			});

			void router.push({
				pathname: `/dashboard/project/${projectId}/services/compose/${composeId}/monitoring`,
				query: {
					...router.query,
					containerId: container.containerId,
					serverId,
					appName,
					appType,
				},
			});
		},
		[router, projectId, composeId, serverId, appName, appType],
	);

	// Removed duplicate query declarations - using the ones from above

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
	const validContainers = useMemo(() => {
		if (!containerDetails) {
			console.debug("No container details available");
			return [];
		}

		return containerDetails.filter(
			(
				detail: RouterOutputs["docker"]["getContainersByAppNameMatch"][number],
			): detail is NonNullable<typeof detail> => {
				const isValid = !!(
					detail?.name &&
					detail?.containerId &&
					detail?.state
				);
				if (!isValid) {
					console.warn("Invalid container detail:", detail);
				}
				return isValid;
			},
		);
	}, [containerDetails]);

	// Move selectContainer to useCallback for consistent hook ordering
	const selectContainer = useCallback(
		(container: Container) => {
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
		},
		[router],
	);

	// Container selection effect with optimized dependencies and loading handling
	useEffect(() => {
		// Skip selection during loading states to prevent unnecessary updates
		if (isLoadingServices || isLoadingContainers || isLoadingConfigs) {
			return;
		}

		// Wait for containers to be available
		if (!enrichedContainers.length) {
			console.debug("No containers available yet");
			return;
		}

		const attemptContainerSelection = () => {
			// Try to select container from query ID first
			if (router.query.containerId) {
				const container = enrichedContainers.find(
					(c) => c.containerId === router.query.containerId,
				);
				if (container) {
					selectContainer(container);
					return true;
				}
			}

			// Fall back to first container if no match or no query ID
			const firstContainer = enrichedContainers[0];
			if (firstContainer?.name && firstContainer?.containerId) {
				console.debug("Selecting first container:", {
					name: firstContainer.name,
					containerId: firstContainer.containerId,
				});
				selectContainer(firstContainer);
				return true;
			}

			return false;
		};

		if (!attemptContainerSelection()) {
			console.warn("Failed to select any container:", {
				queryId: router.query.containerId,
				availableContainers: enrichedContainers.map((c) => ({
					id: c.containerId,
					name: c.name,
				})),
			});
		}
	}, [
		enrichedContainers,
		router.query.containerId,
		selectContainer,
		isLoadingServices,
		isLoadingContainers,
		isLoadingConfigs,
	]);

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
						onValueChange={handleContainerSelect}
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
							{((): React.ReactElement => {
								// Ensure consistent hook rendering order
								if (containerError) {
									return (
										<TableRow>
											<TableCell
												colSpan={5}
												className="h-24 text-center text-destructive"
											>
												Failed to fetch container details. Please try again.
											</TableCell>
										</TableRow>
									);
								}

								// Show loading state only during initial load
								if (
									isLoadingServices ||
									isLoadingContainers ||
									isLoadingConfigs
								) {
									return (
										<TableRow>
											<TableCell colSpan={5} className="h-24 text-center">
												<div className="flex flex-col items-center justify-center gap-2">
													<Loader2 className="h-6 w-6 animate-spin" />
													<div className="text-sm text-muted-foreground">
														Loading container information...
													</div>
												</div>
											</TableCell>
										</TableRow>
									);
								}

								if (enrichedContainers.length === 0) {
									return (
										<TableRow>
											<TableCell colSpan={5} className="h-24 text-center">
												No containers found
											</TableCell>
										</TableRow>
									);
								}

								return (
									<>
										{enrichedContainers.map((container) => {
											const isSelected = container.containerId === containerId;
											return (
												<TableRow
													key={container.containerId}
													className={isSelected ? "bg-muted/50" : ""}
													onClick={() => handleContainerSelect(container.name)}
													style={{ cursor: "pointer" }}
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
														<HealthStatusBadge
															health={container.health}
															name={container.name}
															state={container.state}
														/>
													</TableCell>
													<TableCell>
														<UptimeDisplay
															startedAt={container.startedAt}
															name={container.name}
															state={container.state}
															health={container.health}
														/>
													</TableCell>
													<TableCell className="text-right">
														<div className="flex justify-end gap-2">
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleViewLogs(container)}
																disabled={!container?.containerId}
																title={
																	container?.containerId
																		? "View container logs"
																		: "Container ID not available"
																}
															>
																<FileText className="h-4 w-4 mr-2" />
																Logs
															</Button>
															<Button
																variant="outline"
																size="sm"
																onClick={() => handleViewMonitoring(container)}
																disabled={!container?.containerId}
																title={
																	container?.containerId
																		? "View container monitoring"
																		: "Container ID not available"
																}
															>
																<ExternalLink className="h-4 w-4 mr-2" />
																Monitor
															</Button>
														</div>
													</TableCell>
												</TableRow>
											);
										})}
									</>
								);
							})()}
						</TableBody>
					</Table>
				</ScrollArea>
			</CardContent>
		</Card>
	);
};

export default ShowOverviewCompose;
