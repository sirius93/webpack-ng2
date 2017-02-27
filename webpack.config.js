// Helper: root() is defined at the bottom
var path = require('path');
var webpack = require('webpack');

// Webpack Plugins
var CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin;
var autoprefixer = require('autoprefixer');
var precss = require('precss');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');

/**
 * Env
 * Get npm lifecycle event to identify the environment
 */
var ENV = process.env.npm_lifecycle_event;
var isProd = ENV === 'build';

module.exports = function makeWebpackConfig() {
  /**
   * Config
   * This is the object where all configuration gets set
   */
  var config = {};

  /**
   * Devtool
   * Type of sourcemap to use per build type
   */
  if (isProd) {
    config.devtool = 'source-map';
  }  else {
    config.devtool = 'eval-source-map';
  }
    
  /**
   * Entry
   */
  config.entry = {
    'polyfills': './src/polyfills.ts',
    'vendor': './src/vendor.ts',
    'app': './src/main.ts' // our angular app
  };


  /**
   * Output
   */
  config.output =  {
    path: root('dist'),
    publicPath: isProd ? '/' : 'http://localhost:8080/',
    filename: isProd ? 'js/[name].[hash].js' : 'js/[name].js',
    chunkFilename: isProd ? '[id].[hash].chunk.js' : '[id].chunk.js'
  };

  /**
   * Resolve
   */
  config.resolve = {
    // only discover files that have those extensions
    extensions: ['.ts', '.js', '.json', '.css', '.scss', '.html'],
  };

  var atlOptions = '';
  // if (isTest && !isTestWatch) {
  //   // awesome-typescript-loader needs to output inlineSourceMap for code coverage to work with source maps.
  //   atlOptions = 'inlineSourceMap=true&sourceMap=false';
  // }

  /**
   * Loaders
   * This handles most of the magic responsible for converting modules
   */
  config.module = {
    rules: [
      // Support for .ts files.
      {
        test: /\.ts$/,
        loaders: ['awesome-typescript-loader?' + atlOptions, 'angular2-template-loader', '@angularclass/hmr-loader'],
        exclude: [/\.(spec|e2e)\.ts$/, /node_modules\/(?!(ng2-.+))/]
      },

      // copy those assets to output
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader?name=fonts/[name].[hash].[ext]?'
      },

      // Support for *.json files.
      {test: /\.json$/, loader: 'json-loader'},

      // Support for CSS as raw text
      
      {
        test: /\.css$/,
        exclude: root('src', 'app'),
        loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: ['css-loader', 'postcss-loader']})
      },
      // all css required in src/app files will be merged in js files
      {test: /\.css$/, include: root('src', 'app'), loader: 'raw-loader!postcss-loader'},

      // support for .scss files
      
      {
        test: /\.(scss|sass)$/,
        exclude: root('src', 'app'),
        loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: ['css-loader', 'postcss-loader', 'sass-loader']})
      },
      // all css required in src/app files will be merged in js files
      {test: /\.(scss|sass)$/, exclude: root('src', 'style'), loader: 'raw-loader!postcss-loader!sass-loader'},

      // support for .html as raw text
      
      {test: /\.html$/, loader: 'raw-loader',  exclude: root('src', 'public')}
    ]
  };

  /**
   * Plugins
   */
  config.plugins = [
    // Define env variables to help with builds
    new webpack.DefinePlugin({
      // Environment helpers
      'process.env': {
        ENV: JSON.stringify(ENV)
      }
    }),

    // Workaround needed for angular 2 angular/angular#11580
      new webpack.ContextReplacementPlugin(
        // path separators in *nix and Windows
        /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
        root('./src') 
      ),

    // Tslint configuration for webpack 2
    new webpack.LoaderOptionsPlugin({
      options: {
        /**
         * Apply the tslint loader as pre/postLoader
         */
        tslint: {
          emitErrors: false,
          failOnHint: false
        },
        /**
         * Sass
         * Transforms .scss files to .css
         */
        sassLoader: {
          //includePaths: [path.resolve(__dirname, "node_modules/foundation-sites/scss")]
        },
        /**
         * PostCSS
         * Add vendor prefixes to your css
         */
        postcss: [
          autoprefixer({
            browsers: ['last 2 version']
          }),
          precss({})
        ]
      }
    }),
    new CommonsChunkPlugin({
        name: ['vendor', 'polyfills']
      }),

      // Inject script and link tags into html files
      new HtmlWebpackPlugin({
        template: './src/index.html',
        chunksSortMode: 'dependency'
      }),

      // Extract css files
      // Disabled when in test mode or not in build mode
      new ExtractTextPlugin({filename: 'css/[name].[hash].css', disable: !isProd})
  ];  

  // Add build specific plugins
  if (isProd) {
    config.plugins.push(
      // Only emit files when there are no errors
      new webpack.NoEmitOnErrorsPlugin(),

      // Minify all javascript, switch loaders to minimizing mode
      new webpack.optimize.UglifyJsPlugin({sourceMap: true, mangle: { keep_fnames: true }}),

      // Copy assets from the public folder
      new CopyWebpackPlugin([{
        from: root('src/public')
      }])
    );
  }

  /**
   * Devlopment server configuration
   */
  config.devServer = {
    contentBase: './src/public',
    historyApiFallback: true,
    quiet: true,
    stats: 'minimal' // none (or false), errors-only, minimal, normal (or true) and verbose
  };

  return config;
}();

// Helper functions
function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [__dirname].concat(args));
}
