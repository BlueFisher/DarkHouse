const cp = require('child_process');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');

delete webpackConfig.devtool;

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