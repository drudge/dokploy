import { TerminalLine } from "./terminal-line";
import type { LogLine } from "./utils";

const testLogs: LogLine[] = [
	{
		rawTimestamp: new Date().toISOString(),
		timestamp: new Date(),
		message:
			"[2024-12-21 17:38:29] INFO Worker for job &quot;mentions-email-report&quot; online",
	},
	{
		rawTimestamp: new Date().toISOString(),
		timestamp: new Date(),
		message: "\u001b[31mError: Failed to connect\u001b[0m",
	},
	{
		rawTimestamp: new Date().toISOString(),
		timestamp: new Date(),
		message: "\u001b[32mSuccess: Connection established\u001b[0m",
	},
	{
		rawTimestamp: new Date().toISOString(),
		timestamp: new Date(),
		message: "\u001b[34mInfo: Processing request\u001b[0m",
	},
	{
		rawTimestamp: new Date().toISOString(),
		timestamp: new Date(),
		message: "\u001b[33mWarning: Resource usage high\u001b[0m",
	},
	{
		rawTimestamp: new Date().toISOString(),
		timestamp: new Date(),
		message: 'Test <script>alert("xss")</script> injection',
	},
	{
		rawTimestamp: new Date().toISOString(),
		timestamp: new Date(),
		message: 'Plain text with "quotes" and <brackets>',
	},
];

export function TestLogs() {
	return (
		<div className="border-t border-b border-gray-200 dark:border-gray-800 py-4 my-4">
			<h2 className="text-sm font-medium mb-2 px-4">Test Logs</h2>
			<div className="space-y-1">
				{testLogs.map((log, index) => (
					<TerminalLine
						key={index}
						log={log}
						searchTerm=""
						noTimestamp={false}
					/>
				))}
			</div>
		</div>
	);
}
