Manage agent host sessions

Usage: code-tunnel agent [OPTIONS] [COMMAND]

Commands:
  host  Start a local agent host server
  ps    List active sessions on a running agent host
  stop  Cancel the active turn of a session
  kill  Forcefully kill the running agent host process tree
  logs  Stream live session events
  help  Print this message or the help of the given subcommand(s)

Options:
      --host <HOST>
          Host the agent host should bind on. Defaults to 'localhost'. Pass `0.0.0.0` to expose the agent host on all interfaces (paired with a connection token unless `--without-connection-token` is set)
      --port <PORT>
          Port the agent host should bind on. If 0 (the default) the OS picks a free ephemeral port; the chosen port is recorded in the agent host lockfile [default: 0]
      --connection-token <CONNECTION_TOKEN>
          A secret that must be included with all requests
      --connection-token-file <CONNECTION_TOKEN_FILE>
          A file containing a secret that must be included with all requests
      --without-connection-token
          Run without a connection token. Only use this if the connection is secured by other means
      --server-data-dir <SERVER_DATA_DIR>
          Specifies the directory that server data is kept in
      --replace
          Stop any agent host already running on this machine and start a fresh one. Without this flag, the command reuses an existing live supervisor when its configuration is compatible, and errors out when the requested `--host` / `--port` / `--connection-token` differ from what's already running
      --tunnel
          Expose the agent host over a dev tunnel
      --name <NAME>
          Sets the machine name for the tunnel
      --random-name
          Randomly name the machine for the tunnel
  -h, --help
          Print help

GLOBAL OPTIONS:
      --cli-data-dir <CLI_DATA_DIR>  Directory where CLI metadata should be stored [env: VSCODE_CLI_DATA_DIR=]
      --verbose                      Print verbose output (implies --wait)
      --log <level>                  Log level to use [possible values: trace, debug, info, warn, error, critical, off]
