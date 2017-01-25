export let sessionAge = 7 * 24 * 60 * 60 * 1000;
export let httpPort = 80;
export let useCDN = true;
export let tickrate = 60;

export let webSockets = [{
	ip: 'localhost',
	port: 8080
}, {
	ip: 'localhost',
	port: 8888
}];