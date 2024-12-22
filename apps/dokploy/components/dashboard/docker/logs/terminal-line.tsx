import { Badge } from "@/components/ui/badge";
import {
	Tooltip,
	TooltipContent,
	TooltipPortal,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { escapeRegExp } from "lodash";
import React from "react";
import { type LogLine, getLogType, parseWithFancyAnsi } from "./utils";

interface LogLineProps {
	log: LogLine;
	noTimestamp?: boolean;
	searchTerm?: string;
}

export function TerminalLine({ log, noTimestamp, searchTerm }: LogLineProps) {
	const { timestamp, message, rawTimestamp } = log;
	const { type, variant, color } = getLogType(message);

	const formattedTime = timestamp
		? timestamp.toLocaleString([], {
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				year: "2-digit",
				second: "2-digit",
			})
		: "--- No time found ---";

	const highlightMessage = (text: string, term: string) => {
		if (!term) {
			// If no search term, just convert ANSI to HTML
			return (
				<span
					dangerouslySetInnerHTML={{
						__html: parseWithFancyAnsi(text),
					}}
				/>
			);
		}

		// For search highlighting, we'll use Option A:
		// 1. Replace search terms with markers first
		// 2. Convert to HTML with fancy-ansi
		// 3. Replace markers with highlight spans
		const HIGHLIGHT_START = "[[HIGHLIGHT_START]]";
		const HIGHLIGHT_END = "[[HIGHLIGHT_END]]";

		// Step 1: Add markers around matching terms
		const markedText = text.replace(
			new RegExp(`(${escapeRegExp(term)})`, "gi"),
			`${HIGHLIGHT_START}$1${HIGHLIGHT_END}`,
		);

		// Step 2: Convert to HTML with fancy-ansi
		const html = parseWithFancyAnsi(markedText);

		// Step 3: Replace markers with highlight spans
		const highlightedHtml = html
			.replace(
				new RegExp(escapeRegExp(HIGHLIGHT_START), "g"),
				'<span class="bg-yellow-200/50 dark:bg-yellow-900/50">',
			)
			.replace(new RegExp(escapeRegExp(HIGHLIGHT_END), "g"), "</span>");

		return (
			<span
				dangerouslySetInnerHTML={{
					__html: highlightedHtml,
				}}
			/>
		);
	};

	const tooltip = (color: string, timestamp: string | null) => {
		const square = (
			<div className={cn("w-2 h-full flex-shrink-0 rounded-[3px]", color)} />
		);
		return timestamp ? (
			<TooltipProvider delayDuration={0} disableHoverableContent>
				<Tooltip>
					<TooltipTrigger asChild>{square}</TooltipTrigger>
					<TooltipPortal>
						<TooltipContent
							sideOffset={5}
							className="bg-popover border-border z-[99999]"
						>
							<p className="text text-xs text-muted-foreground break-all max-w-md">
								<pre>{timestamp}</pre>
							</p>
						</TooltipContent>
					</TooltipPortal>
				</Tooltip>
			</TooltipProvider>
		) : (
			square
		);
	};

	return (
		<div
			className={cn(
				"font-mono text-xs flex flex-row gap-3 py-2 sm:py-0.5 group",
				type === "error"
					? "bg-red-500/10 hover:bg-red-500/15"
					: type === "warning"
						? "bg-yellow-500/10 hover:bg-yellow-500/15"
						: type === "debug"
							? "bg-orange-500/10 hover:bg-orange-500/15"
							: "hover:bg-gray-200/50 dark:hover:bg-gray-800/50",
			)}
		>
			{" "}
			<div className="flex items-start gap-x-2">
				{/* Icon to expand the log item maybe implement a colapsible later */}
				{/* <Square className="size-4 text-muted-foreground opacity-0 group-hover/logitem:opacity-100 transition-opacity" /> */}
				{tooltip(color, rawTimestamp)}
				{!noTimestamp && (
					<span className="select-none pl-2 text-muted-foreground w-full sm:w-40 flex-shrink-0">
						{formattedTime}
					</span>
				)}

				<Badge
					variant={variant}
					className="w-14 justify-center text-[10px] px-1 py-0"
				>
					{type}
				</Badge>
			</div>
			<span className="dark:text-gray-200 font-mono text-foreground whitespace-pre-wrap break-all">
				{highlightMessage(message, searchTerm || "")}
			</span>
		</div>
	);
}
