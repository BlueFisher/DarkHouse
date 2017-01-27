import * as httpPROTs from '../shared/http_prot';
import * as toClientPROT from '../shared/ws_prot_to_client';


let activeWebSocket: httpPROTs.webSocketResponse | undefined;
let webSockets: httpPROTs.webSocketResponse[] = [];

export let indexCommon = {
	name: 'Default Player',
	activeWebSocket: activeWebSocket,
	webSockets: webSockets,
}

let rankList: {
	name: string,
	killTimes: number
}[] = [];
export let index = {
	ping: 0,
	rankList: rankList
}

export let gameInitModal = {
	common: indexCommon,
	resumeGame: true,
	email: '',
	password: '',
	showAccount: false,
}

let records: toClientPROT.records = {
	shootingTimes: 0,
	shootingInAimTimes: 0,
	shootedTimes: 0,
	killTimes: 0
};
export let gameOverModal = {
	common: indexCommon,
	records: records
}