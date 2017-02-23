import * as httpPROT from '../shared/http_prot';
import * as toClientPROT from '../shared/ws_prot_to_client';

let activeWebSocket: httpPROT.webSocketResponse | undefined;
let webSockets: httpPROT.webSocketResponse[] = [];
let indexUser: httpPROT.accountResponse | undefined;

export let indexCommon = {
	name: 'Default Player',
	activeWebSocket: activeWebSocket,
	webSockets: webSockets,
	user: indexUser
}

let rankList: {
	name: string,
	killTimes: number
}[] = [];
export let index = {
	ping: 0,
	dataLengthPerSec: 0,
	rankList: rankList
}

export let gameInitModal = {
	common: indexCommon,
	email: '',
	password: '',
	showAccount: false
}

let records: toClientPROT.records = {
	attackTimes: 0,
	attackInAimTimes: 0,
	attactedTimes: 0,
	killTimes: 0
};
export let gameOverModal = {
	common: indexCommon,
	records: records
}