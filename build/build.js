const cp = require('child_process');
const webpack = require('webpack');

let env = process.env.NODE_ENV || 'production';
env = env.toLowerCase();

if (env == 'production') {
	const webpackConfig = require('./webpack.prod.conf');

	console.log('Compiling TypeScript...');
	cp.exec('tsc -p .', function (err) {
		if (err) { console.log(err); }
		else {
			console.log('Compiling webpack...');
			let compiler = webpack(webpackConfig);
			compiler.run(function (err, stats) {
				if (err) { console.log(err); }
				else {
					console.log(stats.toString({
						colors: true,
					}));
				}
			});
		}
	});
} else if (env == 'watch') {
	const webpackConfig = require('./webpack.dev.conf');

	let compiler = webpack(webpackConfig);
	compiler.watch({}, function (err, stats) {
		if (err) { console.log(err); }
		else {
			console.log(new Date().toLocaleTimeString());
			console.log(stats.toString({
				colors: true,
			}));
		}
	});
}