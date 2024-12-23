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
}

type ComposeType = {
	composeId: string;
	appName: string;
	composeType: "docker-compose" | "stack";
	serverId: string | undefined;
};
import { ExternalLink, FileText } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";

interface Props {
	composeId: string;
}

export const ShowOverviewCompose = ({ composeId }: Props) => {
	const router = useRouter();

	const [containerAppName, setContainerAppName] = useState<string>();
	const [containerId, setContainerId] = useState<string>();

	// Get compose data
	const { data: compose, isLoading: isLoadingCompose } =
		api.compose.one.useQuery(
			{ composeId },
			{
				enabled: !!composeId,
			},
		);

	// Get serverId early to use in queries
	const serverId = compose?.serverId;

	// Simplified services query with better error handling
	const { data: services = [], isLoading: isLoadingServices } =
		api.compose.loadServices.useQuery(
			{
				composeId,
				type: "fetch",
			},
			{
				enabled: !!composeId,
				refetchInterval: 5000 as const, // Refresh every 5 seconds for real-time updates
				retry: 3,
				onError: (error) => {
					console.error("Failed to fetch services:", error);
				},
			},
		);

	// Query container details with real-time updates
	// Simplified container details query with better type handling
	const {
		data: containerDetails = [],
		isLoading: isLoadingContainers,
		error: containerError,
	} = api.docker.getContainersByAppNameMatch.useQuery(
		{
			appName: compose?.appName || "",
			appType: compose?.composeType || "docker-compose",
			serverId: serverId || "",
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
	const { data: containerConfigs = [] } =
		api.docker.getContainersConfig.useQuery(
			{
				appName: compose?.appName || "",
				appType: compose?.composeType || "docker-compose",
				serverId: serverId || "",
				containerIds: containerDetails?.map((c) => c.containerId) || [],
			},
			{
				enabled: !!compose?.appName && !!serverId,
				refetchInterval: 5000 as const,
				retry: 3,
				onError: (error) => {
					console.error("Failed to fetch container configs:", error);
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

	// Enhanced container data processing with proper typing
	const enrichedContainers = useMemo((): Container[] => {
		console.debug("Processing container data:", {
			containerDetailsLength: containerDetails?.length,
			containerConfigsLength: containerConfigs?.length,
		});

		return (
			containerDetails?.map((detail): Container => {
				const config = containerConfigs?.find(
					(c: ContainerConfig) => c.Id === detail.containerId,
				);
				console.debug(`Processing container ${detail.name}:`, {
					containerId: detail.containerId,
					hasConfig: !!config,
					startedAt: config?.State?.StartedAt,
					health: config?.State?.Health?.Status,
				});

				// Ensure we return an object that exactly matches the Container interface
				return {
					name: detail.name,
					containerId: detail.containerId,
					state: detail.state,
					health: config?.State?.Health,
					startedAt: config?.State?.StartedAt,
				};
			}) || []
		);
	}, [containerDetails, containerConfigs]);

	// Match monitoring tab's container selection pattern with proper type safety
	useEffect(() => {
		console.debug("Container selection effect running", {
			queryContainerId: router.query.containerId,
			enrichedContainersLength: enrichedContainers?.length,
		});

		// Ensure we have valid container data
		if (!Array.isArray(enrichedContainers) || enrichedContainers.length === 0) {
			console.debug("No containers available");
			return;
		}

		// Get first container safely
		const firstContainer = enrichedContainers[0];
		if (!firstContainer?.name || !firstContainer?.containerId) {
			console.warn("Invalid first container data:", firstContainer);
			return;
		}

		const selectContainer = (container: Container) => {
			if (!container?.name || !container?.containerId) {
				console.warn("Invalid container data:", container);
				return;
			}

			console.debug("Selecting container:", {
				name: container.name,
				startedAt: container.startedAt,
				containerId: container.containerId,
			});

			setContainerAppName(container.name);
			setContainerId(container.containerId);

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
		};

		if (router.query.containerId) {
			const container = enrichedContainers.find(
				(c) => c?.containerId === router.query.containerId,
			);
			if (container) {
				selectContainer(container);
			} else {
				// If container not found by ID, fall back to first container
				console.debug("Container not found by ID, falling back to first:", {
					firstContainerId: firstContainer.containerId,
					firstContainerName: firstContainer.name,
				});
				selectContainer(firstContainer);
			}
		} else {
			// No container ID in query, use first container
			console.debug("No container ID in query, using first:", {
				firstContainerId: firstContainer.containerId,
				firstContainerName: firstContainer.name,
			});
			selectContainer(firstContainer);
		}
	}, [enrichedContainers, router.query.containerId]);

	// Map container state and health to status with proper typing
	const mapContainerStateToStatus = (
		state: DockerContainerState | string,
		health?: ContainerHealth,
	): "idle" | "error" | "done" | "running" => {
		// Prioritize health status if available
		if (health?.Status) {
			const healthStatus = health.Status.toLowerCase();
			switch (healthStatus) {
				case "healthy":
					return "running";
				case "unhealthy":
					return "error";
				case "starting":
					return "idle";
				default:
					console.debug(`Unknown health status: ${healthStatus}`);
			}
		}

		// Fallback to container state
		const containerState = state.toLowerCase() as DockerContainerState;
		switch (containerState) {
			case "running":
				return "running";
			case "exited":
				return "error";
			case "created":
			case "paused":
				return "idle";
			case "restarting":
				return "running";
			case "removing":
			case "dead":
				return "error";
			default:
				console.warn(`Unknown container state: ${containerState}`);
				return "idle";
		}
	};

	return (
		<Card className="bg-background">
			<CardHeader>
				<div className="flex flex-row gap-2 justify-between flex-wrap">
					<CardTitle className="text-xl">Services Overview</CardTitle>
					<Badge>
						{compose?.composeType === "docker-compose" ? "Compose" : "Stack"}
					</Badge>
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
									startedAt: container.startedAt,
								});
								setContainerAppName(value);
								setContainerId(container.containerId);
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
							) : isLoadingCompose ||
								isLoadingServices ||
								isLoadingContainers ? (
								<TableRow>
									<TableCell colSpan={5} className="h-24 text-center">
										<div className="flex items-center justify-center">
											<Loader2 className="h-6 w-6 animate-spin" />
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
												<Badge
													variant={
														container.health?.Status?.toLowerCase() ===
														"healthy"
															? "default"
															: container.health?.Status?.toLowerCase() ===
																	"unhealthy"
																? "destructive"
																: "secondary"
													}
													className={
														container.health?.Status?.toLowerCase() ===
														"healthy"
															? "bg-green-500 hover:bg-green-500/90"
															: undefined
													}
												>
													{container.health?.Status || "No health check"}
												</Badge>
											</TableCell>
											<TableCell>
												{(() => {
													try {
														if (!container?.startedAt) return "-";
														const startDate = new Date(container.startedAt);
														if (Number.isNaN(startDate.getTime())) {
															console.warn(
																`Invalid startedAt date: ${container.startedAt}`,
															);
															return "-";
														}
														return formatDistanceToNow(startDate, {
															addSuffix: true,
														});
													} catch (error) {
														console.error("Error formatting uptime:", error);
														return "-";
													}
												})()}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															// Find matching container and update query
															const matchingContainer = containerDetails?.find(
																(c) => c.containerId === container.containerId,
															);
															if (matchingContainer) {
																const query = {
																	...router.query,
																	tab: "logs",
																	containerId: matchingContainer.containerId,
																};
																void router.push({ query }, undefined, {
																	shallow: true,
																});
															}
														}}
													>
														<FileText className="h-4 w-4 mr-2" />
														Logs
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															// Find matching container and update query
															const matchingContainer = containerDetails?.find(
																(c) => c.containerId === container.containerId,
															);
															if (matchingContainer) {
																const query = {
																	...router.query,
																	tab: "monitoring",
																	containerId: matchingContainer.containerId,
																};
																void router.push({ query }, undefined, {
																	shallow: true,
																});
															}
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
