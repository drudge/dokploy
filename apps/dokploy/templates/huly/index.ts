import {
	type DomainSchema,
	type Schema,
	type Template,
	generateBase64,
	generateRandomDomain,
} from "../utils";

export function generate(schema: Schema): Template {
	const mainDomain = generateRandomDomain(schema);
	const hulySecret = generateBase64(64);
	const domains: DomainSchema[] = [
		{
			host: generateRandomDomain(schema),
			port: 80,
			serviceName: "nginx",
		},
	];

	const envs = [
		"HULY_VERSION=v0.6.377",
		"DOCKER_NAME=huly",
		"",
		"# The address of the host or server from which you will access your Huly instance.",
		"# This can be a domain name (e.g., huly.example.com) or an IP address (e.g., 192.168.1.1).",
		`HOST_ADDRESS=${mainDomain}`,
		"",
		"# Set this variable to 'true' to enable SSL (HTTPS/WSS). ",
		"# Leave it empty to use non-SSL (HTTP/WS).",
		"SECURE=",
		"",
		"# Specify the IP address to bind to; leave blank to bind to all interfaces (0.0.0.0).",
		"# Do not use IP:PORT format in HTTP_BIND or HTTP_PORT.",
		"HTTP_PORT=80",
		"HTTP_BIND=",
		"",
		"# Huly specific variables",
		"TITLE=Huly",
		"DEFAULT_LANGUAGE=en",
		"LAST_NAME_FIRST=true",
		"",
		"# The following configs are auto-generated by the setup script. ",
		"# Please do not manually overwrite.",
		"",
		"# Run with --secret to regenerate.",
		`SECRET=${hulySecret}`,
	];

	const mounts: Template["mounts"] = [
		{
			filePath: "/volumes/nginx/.huly.nginx",
			content: `server {
    listen 80;
    server_name _;
    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://front:8080;
    }

    location /_accounts {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        rewrite ^/_accounts(/.*)$ $1 break;
        proxy_pass http://account:3000/;
    }

    #location /_love {
    #    proxy_set_header Host $host;
    #    proxy_set_header X-Real-IP $remote_addr;
    #    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #    proxy_set_header X-Forwarded-Proto $scheme;

    #    proxy_http_version 1.1;
    #    proxy_set_header Upgrade $http_upgrade;
    #    proxy_set_header Connection "upgrade";
    #    rewrite ^/_love(/.*)$ $1 break;
    #    proxy_pass http://love:8096/;
    #}

    location /_collaborator {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        rewrite ^/_collaborator(/.*)$ $1 break;
        proxy_pass http://collaborator:3078/;
    }

    location /_transactor {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        rewrite ^/_transactor(/.*)$ $1 break;
        proxy_pass http://transactor:3333/;
    }

    location ~ ^/eyJ {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_pass http://transactor:3333;
    }

    location /_rekoni {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        rewrite ^/_rekoni(/.*)$ $1 break;
        proxy_pass http://rekoni:4004/;
    }

    location /_stats {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        rewrite ^/_stats(/.*)$ $1 break;
        proxy_pass http://stats:4900/;
    }
}`,
		},
	];

	return {
		domains,
		envs,
		mounts,
	};
}