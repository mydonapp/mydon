{
  description = "Node.js 22 development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (
        system:
        let
          pkgs = import nixpkgs { inherit system; };
          isDarwin = pkgs.stdenv.isDarwin;
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.nodejs_24
              pkgs.corepack_24
              pkgs.rustup
            ];

            shellHook = pkgs.lib.optionalString isDarwin ''
              echo "Setting up Rust iOS targets for Tauri…"
              node --version
              pnpm --version

              export RUSTUP_HOME="$HOME/.rustup"
              export CARGO_HOME="$HOME/.cargo"
              export PATH="$CARGO_HOME/bin:$PATH"

              export PATH=/usr/bin:/Applications/Xcode.app/Contents/Developer/usr/bin:$PATH

              export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
              unset SDKROOT
              unset CPATH
              unset LIBRARY_PATH
              unset NIX_CFLAGS_COMPILE

              rustup target add \
                aarch64-apple-ios \
                x86_64-apple-ios \
                aarch64-apple-ios-sim
            '';
          };
        }
      );
    };
}
