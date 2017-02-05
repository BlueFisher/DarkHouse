const cp = require('child_process');
const webpack = require('webpack');

cp.exec('tsc -p .', function (err, stdout) {
	let compiler = webpack(require('./webpack.config'));
	compiler.run(function (err, stats) {
		if (err) { console.log(err); }
		else {
			console.log(stats.toString({
				colors: true,
			}));
		}
	});
});