import { formatDistanceToNow } from "date-fns";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
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
	const { data: containerConfigs = [] } = api.docker.getContainersConfig.useQuery(
		{
			appName: compose?.appName || "",
			appType: compose?.composeType || "docker-compose",
			serverId: compose?.serverId || undefined,
			containerIds: containerDetails.map((c) => c.containerId),
		},
		{
			enabled: !!compose?.appName && containerDetails.length > 0,
			refetchInterval: 5000 as const,
			retry: 3,
			onError: (error) => {
				console.error("Failed to fetch container configs:", error);
			},
		},
	);

	// Combine container details with their configs
	const containers: Container[] = useMemo(() => {
		if (!containerDetails || !containerConfigs?.length) return [];

		return containerDetails.map((container) => {
			const config = containerConfigs.find(
				(c) => c.Id === container.containerId,
			);

			const baseContainer: Container = {
				...container,
				health: undefined,
				startedAt: undefined,
			};

			if (!config?.State) return baseContainer;

			return {
				...baseContainer,
				health: config.State.Health,
				startedAt: config.State.StartedAt,
			};
		});
	}, [containerDetails, containerConfigs]);

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
							) : services.map((serviceName: string) => {
								const container = containers.find((c) =>
									c.name.includes(serviceName),
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
											<StatusTooltip
												status={
													container.health?.Status === "healthy"
														? "running"
														: container.health?.Status === "unhealthy"
															? "error"
															: "idle"
												}
											/>
										</TableCell>
										<TableCell>
											{container.startedAt
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
														const query = { ...router.query, tab: "logs" };
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
										<TableCell className="font-medium">{serviceName}</TableCell>
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
														const query = { ...router.query, tab: "logs" };
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
							})}
						</TableBody>
					</Table>
				</ScrollArea>
			</CardContent>
		</Card>
	);
};
