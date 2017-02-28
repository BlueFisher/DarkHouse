module.exports = {
	entry: './lib/web/main.js',
	output: {
		filename: "./public/scripts/bundle.js"
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				enforce: "pre",
				loader: "source-map-loader"
			}, {
				test: /\.js$/,
				exclude: /(node_modules|bower_components)/,
				loader: 'babel-loader',
				query: {
					presets: ['es2015']
				}
			}
		]
	},
	externals: {
		vue: "window.Vue",
		jquery: 'window.$',
		toastr: 'window.toastr'
	},
}
