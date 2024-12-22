import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { StatusTooltip } from "../../../../components/shared/status-tooltip";
import { api } from "../../../../utils/api";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface Container {
  containerId: string;
  name: string;
  state: string;
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
  
  const { data: compose, isLoading: isLoadingCompose } = api.compose.one.useQuery(
    { composeId },
    {
      enabled: !!composeId,
    }
  ) as { data: ComposeType | undefined; isLoading: boolean };

  const { data: services = [], isLoading: isLoadingServices } = api.compose.loadServices.useQuery(
    {
      composeId,
      type: "fetch",
    },
    {
      enabled: !!composeId,
      refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    }
  );

  const { data: containerDetails = [], isLoading: isLoadingContainers, error: containerError } = api.docker.getContainersByAppNameMatch.useQuery(
    {
      appName: compose?.appName || "",
      appType: "docker-compose",
      serverId: compose?.serverId,
    },
    {
      enabled: !!compose?.appName,
      refetchInterval: 5000,
    }
  );

  useEffect(() => {
    if (containerDetails) {
      setContainers(containerDetails);
    }
  }, [containerDetails]);

  const mapContainerStateToStatus = (state: string): "idle" | "error" | "done" | "running" => {
    switch (state.toLowerCase()) {
      case "running":
        return "running";
      case "exited":
        return "error";
      case "created":
        return "idle";
      case "paused":
        return "idle";
      default:
        return "idle";
    }
  };

  return (
    <Card className="bg-background">
      <CardHeader>
        <div className="flex flex-row gap-2 justify-between flex-wrap">
          <CardTitle className="text-xl">Services Overview</CardTitle>
          <Badge>{compose?.composeType === "docker-compose" ? "Compose" : "Stack"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ports</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCompose || isLoadingServices || isLoadingContainers ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No services found
                  </TableCell>
                </TableRow>
              ) : null}
              {services.map((serviceName: string) => {
                const container = containers.find(c => c.name.includes(serviceName));
                return container ? (
                <TableRow key={container.containerId}>
                  <TableCell className="font-medium">{container.name}</TableCell>
                  <TableCell>
                    <StatusTooltip status={mapContainerStateToStatus(container.state)} />
                  </TableCell>
                  <TableCell>
                    {container.ports?.map(port => `${port.PublicPort}:${port.PrivatePort}`).join(", ") || "-"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
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
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={serviceName}>
                  <TableCell className="font-medium">{serviceName}</TableCell>
                  <TableCell>
                    <StatusTooltip status="idle" />
                  </TableCell>
                  <TableCell>No active container</TableCell>
                  <TableCell className="text-right space-x-2">
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
