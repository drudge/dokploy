import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";

interface Container {
  id: string;
  name: string;
  status: string;
}

interface Props {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  containers: Container[];
  onConfirm: () => void;
  operation: 'backup' | 'restore';
}

export const ContainerModal = ({
  isOpen,
  setIsOpen,
  containers,
  onConfirm,
  operation,
}: Props) => {
  const buttonText = `Stop Containers & ${operation.charAt(0).toUpperCase()}${operation.slice(1)}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Running Containers</DialogTitle>
          <DialogDescription>
            The following containers are using volumes that will be {operation}d
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex flex-col gap-2">
            {containers.map((container) => (
              <div
                key={container.id}
                className="flex items-center justify-between border rounded-md p-3"
              >
                <span className="font-medium">{container.name}</span>
                <span className="text-sm text-muted-foreground">
                  {container.status}
                </span>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="mr-2"
          >
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
