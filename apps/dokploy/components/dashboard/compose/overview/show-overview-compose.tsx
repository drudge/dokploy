import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
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

type DockerContainerState = "running" | "exited" | "created" | "restarting" | "removing" | "paused" | "dead";

interface ContainerHealth {
	Status: string;
	FailingStreak: number;
	Log: Array<{
		Start: string;
		End: string;
		ExitCode: number;
		Output: string;
	}>;
}

interface ContainerState {
	Status: string;
	Running: boolean;
	Paused: boolean;
	Restarting: boolean;
	OOMKilled: boolean;
	Dead: boolean;
	Pid: number;
	ExitCode: number;
	Error: string;
	StartedAt: string;
	FinishedAt: string;
	Health?: ContainerHealth;
}

interface Container {
	containerId: string;
	name: string;
	state: string;
	health?: ContainerHealth;
	startedAt?: string;
}

interface Props {
	composeId: string;
}

type ComposeType = {
	composeId: string;
	appName: string;
	composeType: "docker-compose" | "stack";
	serverId: string | null;
};
import { ExternalLink, FileText } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";

interface Props {
	composeId: string;
}

export const ShowOverviewCompose = ({ composeId }: Props) => {
	const router = useRouter();
	const [containers, setContainers] = useState<Container[]>([]);

	const { data: compose, isLoading: isLoadingCompose } =
		api.compose.one.useQuery(
			{ composeId },
			{
				enabled: !!composeId,
			},
		) as { data: ComposeType | undefined; isLoading: boolean };

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
			serverId: compose?.serverId,
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
	const containerQueries = containerDetails.map((container) =>
		api.docker.getConfig.useQuery(
			{
				containerId: container.containerId,
				serverId: compose?.serverId,
			},
			{
				enabled: !!container.containerId,
				refetchInterval: 5000 as const,
				retry: 3,
				onError: (error) => {
					console.error(
						`Failed to fetch container config for ${container.containerId}:`,
						error,
					);
				},
			},
		),
	);

	// Update containers with health and uptime info
	useEffect(() => {
		if (containerDetails) {
			const updatedContainers = containerDetails.map((container, index) => {
				const configQuery = containerQueries[index];
				const config = configQuery?.data;

				if (!config) return container;

				return {
					...container,
					health: config.State?.Health,
					startedAt: config.State?.StartedAt,
				};
			});

			setContainers(updatedContainers);
		}
	}, [containerDetails, containerQueries]);

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
									<TableCell colSpan={5} className="h-24 text-center text-destructive">
										Failed to fetch container details. Please try again.
									</TableCell>
								</TableRow>
							) : isLoadingCompose || isLoadingServices || isLoadingContainers ? (
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
							) : null}
							{services.map((serviceName: string) => {
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
														const query = { ...router.query, tab: "monitoring" };
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
														const query = { ...router.query, tab: "monitoring" };
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
