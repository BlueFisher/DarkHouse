export class errorResponse {
	constructor(message: string) {
		this.message = message;
	}
	message: string
}
export class webSocketResponse {
	constructor(ip: string, port: number) {
		this.ip = ip,
			this.port = port
	}
	ip: string;
	port: number;
};

export class accountRequest {
	email: string;
	password: string;
}
export class accountResponse {
	user: {
		_id?: string,
		email: string
	}
}