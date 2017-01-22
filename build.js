const cp = require('child_process');
const webpack = require('webpack');

let compiler = webpack(require('./webpack.config'));

if (process.argv.find(p => p == '-w')) {
	let ts = cp.exec('tsc -p . -w');
	let isFirstData = true;
	ts.stdout.on('data', data => {
		if (isFirstData) {
			isFirstData = false;

			let lastHash = '';
			compiler.watch({}, function (err, stats) {
				if (err) {
					console.log(err);
				}
				else {
					if (stats.hash != lastHash) {
						lastHash = stats.hash;
						console.log(`webpack - ${new Date().toLocaleTimeString()}`);
						console.log(stats.toString({
							colors: true,
						}));
						console.log();
					}
				}
			});
		}
		console.log(`tsc - ${data.toString()}`)
	});
} else {
	cp.exec('tsc -p .', function (err,stdout) {
		compiler.run(function (err, stats) {
			if (err) { console.log(err); }
			else {
				console.log(stats.toString({
					colors: true,
				}));
			}
		});
	});
}