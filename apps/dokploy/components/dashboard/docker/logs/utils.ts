export type LogType = "error" | "warning" | "success" | "info" | "debug";
export type LogVariant = "red" | "yellow" | "green" | "blue" | "orange";

export interface LogLine {
	rawTimestamp: string | null;
	timestamp: Date | null;
	message: string;
}

interface LogStyle {
	type: LogType;
	variant: LogVariant;
	color: string;
}
interface AnsiSegment {
	text: string;
	className: string;
}

const ansiToTailwind: Record<number, string> = {
	// Reset
	0: "",
	// Regular colors
	30: "text-black dark:text-gray-900",
	31: "text-red-600 dark:text-red-500",
	32: "text-green-600 dark:text-green-500",
	33: "text-yellow-600 dark:text-yellow-500",
	34: "text-blue-600 dark:text-blue-500",
	35: "text-purple-600 dark:text-purple-500",
	36: "text-cyan-600 dark:text-cyan-500",
	37: "text-gray-600 dark:text-gray-400",
	// Bright colors
	90: "text-gray-500 dark:text-gray-600",
	91: "text-red-500 dark:text-red-600",
	92: "text-green-500 dark:text-green-600",
	93: "text-yellow-500 dark:text-yellow-600",
	94: "text-blue-500 dark:text-blue-600",
	95: "text-purple-500 dark:text-purple-600",
	96: "text-cyan-500 dark:text-cyan-600",
	97: "text-white dark:text-gray-300",
	// Background colors
	40: "bg-black",
	41: "bg-red-600",
	42: "bg-green-600",
	43: "bg-yellow-600",
	44: "bg-blue-600",
	45: "bg-purple-600",
	46: "bg-cyan-600",
	47: "bg-white",
	// Formatting
	1: "font-bold",
	2: "opacity-75",
	3: "italic",
	4: "underline",
};

const LOG_STYLES: Record<LogType, LogStyle> = {
	error: {
		type: "error",
		variant: "red",
		color: "bg-red-500/40",
	},
	warning: {
		type: "warning",
		variant: "orange",
		color: "bg-orange-500/40",
	},
	debug: {
		type: "debug",
		variant: "yellow",
		color: "bg-yellow-500/40",
	},
	success: {
		type: "success",
		variant: "green",
		color: "bg-green-500/40",
	},
	info: {
		type: "info",
		variant: "blue",
		color: "bg-blue-600/40",
	},
} as const;

export function parseLogs(logString: string): LogLine[] {
	// Regex to match the log line format
	// Exemple of return :
	// 1 2024-12-10T10:00:00.000Z The server is running on port 8080
	// Should return :
	// { timestamp: new Date("2024-12-10T10:00:00.000Z"),
	// message: "The server is running on port 8080" }
	const logRegex =
		/^(?:(\d+)\s+)?(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z|\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} UTC)?\s*(.*)$/;

	return logString
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line !== "")
		.map((line) => {
			const match = line.match(logRegex);
			if (!match) return null;

			const [, , timestamp, message] = match;

			if (!message?.trim()) return null;

			// Delete other timestamps and keep only the one from --timestamps
			const cleanedMessage = message
				?.replace(
					/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z|\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3} UTC/g,
					"",
				)
				.trim();

			return {
				rawTimestamp: timestamp ?? null,
				timestamp: timestamp ? new Date(timestamp.replace(" UTC", "Z")) : null,
				message: cleanedMessage,
			};
		})
		.filter((log) => log !== null);
}

// Detect log type based on message content
export const getLogType = (message: string): LogStyle => {
	const lowerMessage = message.toLowerCase();

	if (
		/(?:^|\s)(?:info|inf|information):?\s/i.test(lowerMessage) ||
		/\[(?:info|information)\]/i.test(lowerMessage) ||
		/\b(?:status|state|current|progress)\b:?\s/i.test(lowerMessage) ||
		/\b(?:processing|executing|performing)\b/i.test(lowerMessage)
	) {
		return LOG_STYLES.info;
	}

	if (
		/(?:^|\s)(?:error|err):?\s/i.test(lowerMessage) ||
		/\b(?:exception|failed|failure)\b/i.test(lowerMessage) ||
		/(?:stack\s?trace):\s*$/i.test(lowerMessage) ||
		/^\s*at\s+[\w.]+\s*\(?.+:\d+:\d+\)?/.test(lowerMessage) ||
		/\b(?:uncaught|unhandled)\s+(?:exception|error)\b/i.test(lowerMessage) ||
		/Error:\s.*(?:in|at)\s+.*:\d+(?::\d+)?/.test(lowerMessage) ||
		/\b(?:errno|code):\s*(?:\d+|[A-Z_]+)\b/i.test(lowerMessage) ||
		/\[(?:error|err|fatal)\]/i.test(lowerMessage) ||
		/\b(?:crash|critical|fatal)\b/i.test(lowerMessage) ||
		/\b(?:fail(?:ed|ure)?|broken|dead)\b/i.test(lowerMessage)
	) {
		return LOG_STYLES.error;
	}

	if (
		/(?:^|\s)(?:warning|warn):?\s/i.test(lowerMessage) ||
		/\[(?:warn(?:ing)?|attention)\]/i.test(lowerMessage) ||
		/(?:deprecated|obsolete)\s+(?:since|in|as\s+of)/i.test(lowerMessage) ||
		/\b(?:caution|attention|notice):\s/i.test(lowerMessage) ||
		/(?:might|may|could)\s+(?:not|cause|lead\s+to)/i.test(lowerMessage) ||
		/(?:!+\s*(?:warning|caution|attention)\s*!+)/i.test(lowerMessage) ||
		/\b(?:deprecated|obsolete)\b/i.test(lowerMessage) ||
		/\b(?:unstable|experimental)\b/i.test(lowerMessage)
	) {
		return LOG_STYLES.warning;
	}

	if (
		/(?:successfully|complete[d]?)\s+(?:initialized|started|completed|created|done|deployed)/i.test(
			lowerMessage,
		) ||
		/\[(?:success|ok|done)\]/i.test(lowerMessage) ||
		/(?:listening|running)\s+(?:on|at)\s+(?:port\s+)?\d+/i.test(lowerMessage) ||
		/(?:connected|established|ready)\s+(?:to|for|on)/i.test(lowerMessage) ||
		/\b(?:loaded|mounted|initialized)\s+successfully\b/i.test(lowerMessage) ||
		/✓|√|✅|\[ok\]|done!/i.test(lowerMessage) ||
		/\b(?:success(?:ful)?|completed|ready)\b/i.test(lowerMessage) ||
		/\b(?:started|starting|active)\b/i.test(lowerMessage)
	) {
		return LOG_STYLES.success;
	}

	if (
		/(?:^|\s)(?:info|inf):?\s/i.test(lowerMessage) ||
		/\[(info|log|debug|trace|server|db|api|http|request|response)\]/i.test(
			lowerMessage,
		) ||
		/\b(?:version|config|import|load|get|HTTP|PATCH|POST|debug)\b:?/i.test(
			lowerMessage,
		)
	) {
		return LOG_STYLES.debug;
	}

	return LOG_STYLES.info;
};

export function parseAnsi(text: string): AnsiSegment[] {
	const segments: AnsiSegment[] = [];
	let currentIndex = 0;
	let buffer = "";
	let currentClasses: string[] = [];

	while (currentIndex < text.length) {
		const escStart = text.indexOf("\x1b[", currentIndex);

		// No more escape sequences found
		if (escStart === -1) {
			if (buffer || currentIndex < text.length) {
				segments.push({
					text: buffer + text.slice(currentIndex),
					className: currentClasses.join(" "),
				});
			}
			break;
		}

		// Add text before the escape sequence to buffer
		if (escStart > currentIndex) {
			buffer += text.slice(currentIndex, escStart);
		}

		const escEnd = text.indexOf("m", escStart);
		if (escEnd === -1) break;

		// If we have accumulated text in buffer, flush it before processing new styles
		if (buffer) {
			segments.push({
				text: buffer,
				className: currentClasses.join(" "),
			});
			buffer = "";
		}

		// Handle ANSI codes
		const codesStr = text.slice(escStart + 2, escEnd);
		const codes = codesStr.split(";").map((c) => Number.parseInt(c, 10));

		if (codes.includes(0) || codes.includes(39)) {
			// Reset all formatting or reset foreground color
			if (codes.includes(0)) {
				currentClasses = [];
			} else if (codes.includes(39)) {
				// Only reset text color classes
				currentClasses = currentClasses.filter((c) => !c.startsWith("text-"));
			}
		} else {
			let i = 0;
			while (i < codes.length) {
				const code = codes[i];

				// Handle 8-bit colors (38;5;n and 48;5;n)
				if ((code === 38 || code === 48) && i + 2 < codes.length) {
					const colorType = codes[i + 1];
					const colorValue = codes[i + 2];

					if (colorType === 5 && typeof colorValue === "number") {
						const isBackground = code === 48;
						// Handle basic colors (0-7)
						if (colorValue <= 7) {
							const colorIndex = (30 +
								colorValue) as keyof typeof ansiToTailwind;
							const className = ansiToTailwind[colorIndex];
							if (className) {
								currentClasses = currentClasses.filter((c) =>
									isBackground ? !c.startsWith("bg-") : !c.startsWith("text-"),
								);
								currentClasses.push(className);
							}
						}
						// Handle bright colors (8-15)
						else if (colorValue >= 8 && colorValue <= 15) {
							const colorIndex = (90 +
								(colorValue - 8)) as keyof typeof ansiToTailwind;
							const className = ansiToTailwind[colorIndex];
							if (className) {
								currentClasses = currentClasses.filter((c) =>
									isBackground ? !c.startsWith("bg-") : !c.startsWith("text-"),
								);
								currentClasses.push(className);
							}
						}
					}
					i += 3; // Skip the color parameters
					continue;
				}

				// Handle standard ANSI codes
				const className = ansiToTailwind[code as keyof typeof ansiToTailwind];
				if (className) {
					// Handle color classes specifically
					if (className.startsWith("text-")) {
						currentClasses = currentClasses.filter(
							(c) => !c.startsWith("text-"),
						);
					} else if (className.startsWith("bg-")) {
						currentClasses = currentClasses.filter((c) => !c.startsWith("bg-"));
					}

					if (!currentClasses.includes(className)) {
						currentClasses.push(className);
					}
				}
				i++;
			}
		}

		currentIndex = escEnd + 1;
	}

	// Filter out empty segments and segments with no text
	return segments.filter((segment) => segment.text.length > 0);
}
