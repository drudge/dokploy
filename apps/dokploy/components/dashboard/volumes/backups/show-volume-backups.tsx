import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatabaseBackup } from "lucide-react";
import React from "react";
import { toast } from "sonner";

interface Volume {
  id: string;
  name: string;
  size: string;
  lastBackup?: string;
  status: 'available' | 'in-use' | 'error';
}

interface Props {
  volumeId?: string;
}

export const ShowVolumeBackups = ({ volumeId }: Props) => {
  // Will implement data fetching later
  const volumes: Volume[] = [];

  return (
    <Card className="bg-background">
      <CardHeader className="flex flex-row justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <CardTitle className="text-xl">Backups</CardTitle>
          <CardDescription>
            Backup and restore Docker volumes to different providers.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {volumes.length === 0 ? (
          <div className="flex w-full flex-col items-center justify-center gap-3 pt-10">
            <DatabaseBackup className="size-8 text-muted-foreground" />
            <span className="text-base text-muted-foreground">
              No volumes found
            </span>
          </div>
        ) : (
          <div className="flex flex-col pt-2">
            <div className="flex flex-col gap-6">
              {volumes.map((volume) => (
                <div key={volume.id}>
                  <div className="flex w-full flex-col md:flex-row md:items-center justify-between gap-4 md:gap-10 border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 flex-col gap-8">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">Volume</span>
                        <span className="text-sm text-muted-foreground">
                          {volume.name}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">Size</span>
                        <span className="text-sm text-muted-foreground">
                          {volume.size}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">Last Backup</span>
                        <span className="text-sm text-muted-foreground">
                          {volume.lastBackup || 'Never'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">Status</span>
                        <span className="text-sm text-muted-foreground">
                          {volume.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-row gap-4">
                      <Button
                        type="button"
                        onClick={() => {
                          toast.info("Backup functionality coming soon");
                        }}
                      >
                        Backup
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          toast.info("Restore functionality coming soon");
                        }}
                      >
                        Restore
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
