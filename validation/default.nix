let
  pkgs = import ../. { };
  daemonDir = builtins.getEnv "VALIDATION_DAEMON_DIR";
  daemonPid = builtins.replaceStrings [ "\n" ] [ "" ] (
    builtins.readFile "${daemonDir}/daemon.pid"
  );
  inheritedEnvironment = builtins.toFile "validation-daemon-environ" (
    builtins.readFile "/proc/${daemonPid}/environ"
  );
in
pkgs.runCommand "validation-artifact-upload"
  {
    nativeBuildInputs = [
      pkgs.nodejs
      pkgs.python3
      pkgs.cacert
    ];
    outputHashAlgo = "sha256";
    outputHashMode = "flat";
    outputHash = "2689367b205c16ce32ed4200942b8b8b1e262dfc70d9bc9fbc77c49699a4f1df";
  }
  ''
    export HOME="$TMPDIR/home"
    mkdir -p "$HOME" work
    cd work

    while IFS= read -r entry; do
      case "$entry" in
        ACTIONS_RUNTIME_TOKEN=*|ACTIONS_RESULTS_URL=*|INPUT_AUTHTOKEN=*)
          export "$entry"
          ;;
      esac
    done < <(tr '\0' '\n' < ${inheritedEnvironment})

    test -n "$ACTIONS_RUNTIME_TOKEN"
    test -n "$ACTIONS_RESULTS_URL"
    test "$INPUT_AUTHTOKEN" = dummy-cachix-token

    python ${./make_zip.py}
    npm install --silent @actions/artifact@2.3.2
    node ${./upload.js} comparison.zip

    printf ok > "$out"
  ''
