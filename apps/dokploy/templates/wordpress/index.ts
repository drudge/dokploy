import {
	type DomainSchema,
	type Schema,
	type Template,
	generateRandomDomain,
	generateHash,
	generatePassword,
} from "../utils";
import { v4 as uuidv4 } from "uuid";

export function generate(schema: Schema): Template {
	const randomDomain = generateRandomDomain(schema);
	const deploymentUuid = uuidv4().split('-')[0];
	const dbUser = generateHash("wpuser", 8);
	const dbPass = generatePassword(16);
	const dbName = generateHash("wpdb", 8);
	const rootPass = generatePassword(16);

	const domains: DomainSchema[] = [
		{
			host: randomDomain,
			port: 80,
			serviceName: `wordpress-${deploymentUuid}`,
		},
	];

	return {
		domains,
		networkName: deploymentUuid,
		containerNames: {
			wordpress: `wordpress-${deploymentUuid}`,
			db: `mysql-${deploymentUuid}`,
		},
		volumeNames: {
			wordpress: `${deploymentUuid}_wordpress-data`,
			db: `${deploymentUuid}_db-data`,
		},
		envs: [
			`WORDPRESS_DB_USER=${dbUser}`,
			`WORDPRESS_DB_PASSWORD=${dbPass}`,
			`WORDPRESS_DB_NAME=${dbName}`,
			`MYSQL_ROOT_PASSWORD=${rootPass}`,
		],
	};
}
