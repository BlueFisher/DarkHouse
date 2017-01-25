import * as httpPROTs from '../shared/http_prot';

let activeWebSocket: httpPROTs.webSocketResponse | undefined;
let webSockets: httpPROTs.webSocketResponse[] = [];

export let indexCommon = {
	name: 'Default Player',
	activeWebSocket: activeWebSocket,
	webSockets: webSockets,
}

export let index = {
	ping: 0
}

export let gameInitModal = {
	common: indexCommon,
	resumeGame: true,
	email: '',
	password: '',
	showAccount: false,
}

export let gameOverModal = {
	common: indexCommon,
	historyMaxShipsCount: 0
}