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
					$('#modal-gameinit').modal('hide');
					gameOn();
				}
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

		new vue({
			el: '#ranklist',
			data: vueData.index
		});

		let gameOn = () => {
			this._connectWebSocketServer();
		}
		new vue({
			el: '#ping',
			data: vueData.index
		});
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