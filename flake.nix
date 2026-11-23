# ==================================================================================================
# github-profile-trophy Development Flake
# ==================================================================================================

{
  description = "github-profile-trophy development environment";

  # ------------------------------------------------------------------------------------------------
  # Inputs
  # ------------------------------------------------------------------------------------------------
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

    devkit = {
      url = "github:hakulab/devkit/v3";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  # ------------------------------------------------------------------------------------------------
  # Outputs
  # ------------------------------------------------------------------------------------------------
  outputs =
    {
      nixpkgs,
      devkit,
      ...
    }:
    devkit.lib.eachSystem devkit.lib.systems (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        dk = devkit.lib.mkLib pkgs;

        # ------------------------------------------------------------------------------------------
        # Pre-commit Hooks
        # ------------------------------------------------------------------------------------------
        preCommit = dk.preCommit {
          src = ./.;
          hooks = {
            dprint.excludes = [
              "^CONTRIBUTING\\.md$"
              "^README\\.md$"
            ];
            editorconfig-checker.excludes = [
              "^CONTRIBUTING\\.md$"
              "^README\\.md$"
            ];
            eslint.enable = true;
            markdownlint-cli2.excludes = [
              "^CONTRIBUTING\\.md$"
              "^README\\.md$"
            ];
            prettier.enable = true;
            taplo.enable = true;
            tsc.enable = true;
          };
        };
      in
      {
        # ------------------------------------------------------------------------------------------
        # Dev Shell
        # ------------------------------------------------------------------------------------------
        devShells.default = pkgs.mkShell {
          name = "github-profile-trophy-dev";

          inputsFrom = [ preCommit ];

          packages = builtins.attrValues dk.nodeToolchain;
        };

        # ------------------------------------------------------------------------------------------
        # Formatter
        # ------------------------------------------------------------------------------------------
        formatter = pkgs.nixfmt-tree;
      }
    );
}
