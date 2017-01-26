import * as $ from 'jquery';
import * as vue from 'vue';

import * as vueData from './vue_data';
import * as toClientPROT from '../shared/ws_prot_to_client';
import * as httpPROT from '../shared/http_prot';

export class domManager {
	private _connectWebSocketServer: () => void;

	constructor(connectWebSocketServer: () => void) {
		this._connectWebSocketServer = connectWebSocketServer;

		this._initializeVue();
		this._initializeCanvas();
		this._initializeGame();
	}

	private _initializeVue() {
		new vue({
			el: '#modal-gameinit',
			data: vueData.gameInitModal,
			methods: {
				startGame: () => {
					vueData.gameInitModal.resumeGame = false;
					$('#modal-gameinit').modal('hide');
					gameOn();
				},
				resumeGame: () => {
					vueData.gameInitModal.resumeGame = true;
					$('#modal-gameinit').modal('hide');
					gameOn();
				},
				// signin: () => {
				// 	let protocol: HttpProtocols.AccountRequest = {
				// 		email: vueData.gameInitModal.email,
				// 		password: vueData.gameInitModal.password
				// 	};
				// 	$.ajax('/signin', {
				// 		method: 'POST',
				// 		contentType: "application/json",
				// 		data: JSON.stringify(protocol)
				// 	}).then(function (data: HttpProtocols.AccountResponse) {
				// 		location.reload();
				// 	}, (function (xhr) {
				// 		toastr.error((xhr.responseJSON as HttpProtocols.ErrorResponse).message);
				// 	}));
				// },
				// signup: () => {
				// 	let protocol: HttpProtocols.AccountRequest = {
				// 		email: vueData.gameInitModal.email,
				// 		password: vueData.gameInitModal.password
				// 	};
				// 	$.ajax('/signup', {
				// 		method: 'POST',
				// 		contentType: "application/json",
				// 		data: JSON.stringify(protocol)
				// 	}).then(function (data: HttpProtocols.AccountResponse) {
				// 		location.reload();
				// 	}, (function (xhr) {
				// 		toastr.error((xhr.responseJSON as HttpProtocols.ErrorResponse).message);
				// 	}));
				// }
			}
		});

		new vue({
			el: '#modal-gameover',
			data: vueData.gameOverModal,
			methods: {
				startGameFromGameOver: () => {
					$('#modal-gameover').modal('hide');
					gameOn();
				}
			}
		});

		let gameOn = () => {
			this._connectWebSocketServer();
		}
	}

	private _initializeCanvas() {
		let adjustCanvasSize = () => {
			let canvas = document.querySelector('#stage') as HTMLCanvasElement;
			canvas.height = window.innerHeight
			canvas.width = window.innerWidth;
		}

		adjustCanvasSize();
		window.onresize = () => {
			adjustCanvasSize();
		}
	}

	gameOver(protocol: toClientPROT.gameOver) {
		vueData.gameOverModal.records = protocol.records;

		$('#modal-gameover').on('shown.bs.modal', function () {
			$('#modal-gameover').find('.form-control').focus();
		}).modal({
			backdrop: 'static',
			keyboard: false
		});
	}

	private _initializeGame() {
		$.getJSON('/websockets').then((protocol: httpPROT.webSocketResponse[]) => {
			vueData.indexCommon.webSockets = protocol;
			vueData.indexCommon.activeWebSocket = protocol[0];

			$('#modal-gameinit').find('.form-control').focus();
		});

		$('#modal-gameinit').modal({
			backdrop: 'static',
			keyboard: false
		});
	}
}