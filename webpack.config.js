"use strict";

const { worker } = require("cluster");
const path = require("path");
const webpack = require("webpack");

module.exports = (env, argv) => {
  /**@type {import('webpack').Configuration}*/
  const config = {
    entry: "./src/extension.ts", // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    devtool: "source-map",
    externals: {
      vscode: "commonjs vscode"
    },
    node: {
      __dirname: false // We need to support dirname to be able to load the language server
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"]
      }),
      new webpack.DefinePlugin({
        PRODUCTION: argv.mode === "production"
      }),
      new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),

    ],
    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        "universal-user-agent$": "universal-user-agent/dist-node/index.js"
      },
      fallback: {
        assert: require.resolve("assert/"),
        buffer: require.resolve("buffer/"),
        console: require.resolve("console-browserify"),
        path: require.resolve("path-browserify"),
        crypto: require.resolve("crypto-browserify"),
        net: require.resolve("net-browserify"),
        stream: require.resolve("stream-browserify"),
        http: require.resolve("stream-http"),
        timers: require.resolve("timers-browserify"),
        querystring: require.resolve("querystring-es3"),
        express: require.resolve("express-browserify"),
        fs: require.resolve("graceful-fs"),
        _stream_transform: false,
        constants: require.resolve("constants-browserify"),
        tls: false,
        diagnostics_channel: false,
        perf_hooks: false,
        util: false,
        worker_threads: false,
        async_hooks: false,
        vm: require.resolve("vm-browserify"),
        url: require.resolve("url/"),
        zlib: require.resolve("browserify-zlib")
      }
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "ts-loader",
              options: {
                compilerOptions: {
                  sourceMap: true
                }
              }
            }
          ]
        },
        {
          test: /\.js$/,
          enforce: "pre",
          use: ["source-map-loader"]
        },
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false // disable the behaviour
          }
        },
        {
          test: /\.node$/,
          use: "node-loader"
        }
      ]
    },
    ignoreWarnings: [/Failed to parse source map/]
  };

  const nodeConfig = {
    ...config,
    target: "node",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "extension-node.js",
      libraryTarget: "commonjs",
      devtoolModuleFilenameTemplate: "../[resource-path]"
    }
  };

  const webConfig = {
    ...config,
    target: "webworker",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "extension-web.js",
      libraryTarget: "commonjs",
      devtoolModuleFilenameTemplate: "../[resource-path]"
    }
  };

  const serverConfig = {
    entry: "./src/langserver.ts",
    devtool: "inline-source-map",
    externals: {
      vscode: "commonjs vscode"
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ["buffer", "Buffer"]
      }),
      new webpack.DefinePlugin({
        PRODUCTION: JSON.stringify(process.env.NODE_ENV)
      })
    ],
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                compilerOptions: {
                  sourceMap: true
                }
              }
            }
          ],
          resolve: {
            fullySpecified: false
          }
        },
        {
          test: /\.js$/,
          enforce: "pre",
          use: ["source-map-loader"]
        },
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false // disable the behaviour
          }
        }
      ]
    },
    ignoreWarnings: [/Failed to parse source map/],
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
      extensionAlias: {
        ".ts": [".js", ".ts"],
        ".cts": [".cjs", ".cts"],
        ".mts": [".mjs", ".mts"]
      },
      fallback: {
        buffer: require.resolve("buffer/"),
        path: require.resolve("path-browserify")
      }
    }
  };

  const serverNodeConfig = {
    ...serverConfig,
    target: "node",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "server-node.js",
      libraryTarget: "commonjs",
      devtoolModuleFilenameTemplate: "../[resource-path]"
    }
  };

  const serverWebConfig = {
    ...serverConfig,
    target: "webworker",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "server-web.js",
      devtoolModuleFilenameTemplate: "../[resource-path]"
    }
  };

  return [nodeConfig, webConfig, serverNodeConfig, serverWebConfig];
};
