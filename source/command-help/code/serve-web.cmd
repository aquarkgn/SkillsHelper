Runs a local web version of Visual Studio Code

Usage: code-tunnel serve-web [OPTIONS]

Options:
      --host <HOST>
          Host to listen on, defaults to 'localhost'
      --socket-path <SOCKET_PATH>

      --port <PORT>
          Port to listen on. If 0 is passed a random free port is picked [default: 8000]
      --connection-token <CONNECTION_TOKEN>
          A secret that must be included with all requests
      --connection-token-file <CONNECTION_TOKEN_FILE>
          A file containing a secret that must be included with all requests
      --without-connection-token
          Run without a connection token. Only use this if the connection is secured by other means
      --accept-server-license-terms
          If set, the user accepts the server license terms and the server will be started without a user prompt
      --server-base-path <SERVER_BASE_PATH>
          Specifies the path under which the web UI and the code server is provided
      --server-data-dir <SERVER_DATA_DIR>
          Specifies the directory that server data is kept in
      --default-folder <DEFAULT_FOLDER>
          The workspace folder to open when no input is specified in the browser URL
      --default-workspace <DEFAULT_WORKSPACE>
          The workspace to open when no input is specified in the browser URL
      --disable-telemetry
          Disables telemetry
      --commit-id <COMMIT_ID>
          Use a specific commit SHA for the client
  -h, --help
          Print help

GLOBAL OPTIONS:
      --cli-data-dir <CLI_DATA_DIR>  Directory where CLI metadata should be stored [env: VSCODE_CLI_DATA_DIR=]
      --verbose                      Print verbose output (implies --wait)
      --log <level>                  Log level to use [possible values: trace, debug, info, warn, error, critical, off]
