import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
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

	const { data: compose, isLoading: isLoadingCompose } =
		api.compose.one.useQuery(
			{ composeId },
			{
				enabled: !!composeId,
			},
		);

	const { data: services = [], isLoading: isLoadingServices } =
		api.compose.loadServices.useQuery(
			{
				composeId,
				type: "fetch",
			},
			{
				enabled: !!composeId,
				refetchInterval: 5000 as const, // Refresh every 5 seconds for real-time updates
			},
		);

	const {
		data: containerDetails = [],
		isLoading: isLoadingContainers,
		error: containerError,
	} = api.docker.getContainersByAppNameMatch.useQuery(
		{
			appName: compose?.appName || "",
			appType: compose?.composeType || "docker-compose",
			serverId: compose?.serverId || undefined,
		},
		{
			enabled: !!compose?.appName,
			refetchInterval: 5000 as const,
			retry: 3,
			onError: (error) => {
				console.error("Failed to fetch container details:", error);
			},
		},
	);

	// Fetch detailed container info including health checks
	// Ensure serverId is a string before enabling the query
	const serverId = compose?.serverId;
	const queryEnabled =
		!!compose?.appName &&
		typeof serverId === "string" &&
		containerDetails.length > 0;

	console.log("Container Configs Query Conditions:", {
		hasAppName: !!compose?.appName,
		hasServerId: !!serverId,
		isServerIdString: typeof serverId === "string",
		containerDetailsLength: containerDetails.length,
		enabled: queryEnabled,
		serverId,
		containerIds: containerDetails.map((c) => c.containerId),
	});

	const { data: containerConfigs = [] } =
		api.docker.getContainersConfig.useQuery(
			{
				appName: compose?.appName || "",
				appType: compose?.composeType || "docker-compose",
				serverId: typeof serverId === "string" ? serverId : "",
				containerIds: containerDetails.map((c) => c.containerId),
			},
			{
				enabled: queryEnabled,
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

	const containers: Container[] = useMemo(() => {
		if (!compose?.serverId) {
			console.warn("No serverId available for container configs", { compose });
			return [];
		}

		if (!containerDetails || !containerConfigs?.length) {
			console.warn("No container details or configs available", {
				hasContainerDetails: !!containerDetails,
				containerDetailsLength: containerDetails?.length,
				hasContainerConfigs: !!containerConfigs,
				containerConfigsLength: containerConfigs?.length,
			});
			return [];
		}

		return containerDetails.map((detail) => {
			const config = containerConfigs.find((c) => c.Id === detail.containerId);

			const baseContainer: Container = {
				...detail,
				health: undefined,
				startedAt: undefined,
			};

			if (!config?.State) {
				console.warn(
					`No state found for container ${detail.containerId} (${detail.name})`,
				);
				return baseContainer;
			}

			const enrichedContainer: Container = {
				...baseContainer,
				health: config.State.Health,
				startedAt: config.State.StartedAt,
			};

			// Detailed logging for container state and health
			console.log(`Container ${enrichedContainer.name} details:`, {
				state: enrichedContainer.state,
				startedAt: enrichedContainer.startedAt,
				health: {
					status: enrichedContainer.health?.Status,
					failingStreak: enrichedContainer.health?.FailingStreak,
					logs: enrichedContainer.health?.Log?.length 
						? enrichedContainer.health.Log[enrichedContainer.health.Log.length - 1]
						: undefined
				},
				rawState: config.State
			});

			return enrichedContainer;
		});
	}, [containerDetails, containerConfigs, compose?.serverId]);

	// Sync container selection with router query
	useEffect(() => {
		if (router.query.containerId && containers.length > 0) {
			const container = containers.find(
				(c) => c.containerId === router.query.containerId,
			);
			if (!container) {
				console.warn(
					`Selected container ${router.query.containerId} not found in available containers:`,
					containers.map((c) => ({ id: c.containerId, name: c.name })),
				);
			}
		}
	}, [containers, router.query.containerId]);

	const mapContainerStateToStatus = (
		state: DockerContainerState | string,
	): "idle" | "error" | "done" | "running" => {
		switch (state.toLowerCase()) {
			case "running":
				return "running";
			case "exited":
				return "error";
			case "created":
				return "idle";
			case "paused":
				return "idle";
			case "restarting":
				return "running";
			case "removing":
				return "error";
			case "dead":
				return "error";
			default:
				console.warn(`Unknown container state: ${state}`);
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
							) : services.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} className="h-24 text-center">
										No services found
									</TableCell>
								</TableRow>
							) : (
								services.map((serviceName: string) => {
									const container = findMatchingContainer(
										serviceName,
										containers,
									);
									return container ? (
										<TableRow key={container.containerId}>
											<TableCell className="font-medium">
												{container.name}
											</TableCell>
											<TableCell>
												<StatusTooltip
													status={mapContainerStateToStatus(container.state)}
												/>
											</TableCell>
											<TableCell>
												{container.health?.Status ? (
													<StatusTooltip
														status={
															container.health.Status === "healthy"
																? "running"
																: container.health.Status === "unhealthy"
																	? "error"
																	: "idle"
														}
													/>
												) : (
													<StatusTooltip status="idle" />
												)}
											</TableCell>
											<TableCell>
												{container?.startedAt &&
												container.state.toLowerCase() === "running"
													? formatDistanceToNow(new Date(container.startedAt), {
															addSuffix: true,
														})
													: "-"}
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															const query = {
																...router.query,
																tab: "logs",
																containerId: container.containerId,
															};
															router.push({ query });
														}}
													>
														<FileText className="h-4 w-4 mr-2" />
														Logs
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															const query = {
																...router.query,
																tab: "monitoring",
																containerId: container.containerId,
															};
															router.push({ query });
														}}
													>
														<ExternalLink className="h-4 w-4 mr-2" />
														Monitor
													</Button>
												</div>
											</TableCell>
										</TableRow>
									) : (
										<TableRow key={serviceName}>
											<TableCell className="font-medium">
												{serviceName}
											</TableCell>
											<TableCell>
												<StatusTooltip status="idle" />
											</TableCell>
											<TableCell>-</TableCell>
											<TableCell>-</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-2">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															const query = {
																...router.query,
																tab: "logs",
																containerId: undefined, // Explicitly clear containerId when no container exists
															};
															router.push({ query });
														}}
													>
														<FileText className="h-4 w-4 mr-2" />
														Logs
													</Button>
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															const query = {
																...router.query,
																tab: "monitoring",
																containerId: undefined, // Explicitly clear containerId when no container exists
															};
															router.push({ query });
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
