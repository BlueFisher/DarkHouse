export class errorResponse {
	constructor(message:string){
		this.message = message;
	}
	message: string
}
export class webSocketResponse {
	constructor(ip:string,port:number,canResume:boolean){
		this.ip = ip,
		this.port = port,
		this.canResumeGame = canResume;
	}
	ip: string;
	port: number;
	canResumeGame: boolean;
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