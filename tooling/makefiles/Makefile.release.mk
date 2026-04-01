###############################################################################
# Makefile.release: Release orchestrator for all distributable components
#
# npm spokes:  make release-one SPOKE=pattern-detect TYPE=minor
#              make release-all TYPE=minor
# ClawMore:    make release-clawmore-dev TYPE=patch / release-clawmore-prod TYPE=patch
# Landing:     make release-landing-dev TYPE=minor  / release-landing-prod TYPE=minor
# Platform:    make release-platform TYPE=patch
# VS Code:     make release-vscode TYPE=patch
# Status:      make release-status
###############################################################################

MAKEFILE_DIR := $(dir $(lastword $(MAKEFILE_LIST)))
ROOT_DIR     := $(abspath $(MAKEFILE_DIR)/../..)
$(info DEBUG: MAKEFILE_DIR is $(MAKEFILE_DIR))
$(info DEBUG: ROOT_DIR is $(ROOT_DIR))
include $(MAKEFILE_DIR)/Makefile.shared.mk
include $(MAKEFILE_DIR)/Makefile.publish.mk

# Use PUBLIC_OWNER and PRIVATE_OWNER from Makefile.publish.mk
TARGET_BRANCH ?= main
LANDING_DIR   := $(ROOT_DIR)/apps/landing
PLATFORM_DIR  := $(ROOT_DIR)/apps/platform
CLAWMORE_DIR  := $(ROOT_DIR)/apps/clawmore

# Release toggles to reduce coupling between checks, deploys, and publishing.
RELEASE_PRECHECKS         ?= 1
RELEASE_BUILD             ?= 1
RELEASE_DEPLOY            ?= 1
RELEASE_E2E               ?= 1
RELEASE_VERIFY            ?= 1
RELEASE_PUBLISH           ?= 1
RELEASE_PUSH              ?= 1
RELEASE_HUB_DOWNSTREAM    ?= 1
RELEASE_ALL_PLATFORM_E2E  ?= 0
RELEASE_ALL_DOWNSTREAM    ?= 1
RELEASE_DISTRIBUTION      ?= 1

.PHONY: check-changes check-dependency-updates release-one release-all release-dev release-status \
	release-landing release-landing-dev release-landing-prod \
	release-platform release-platform-dev release-vscode \
	release-clawmore release-clawmore-dev release-clawmore-prod \
	release-spoke-% release-help \
	release-checks-spoke release-checks-all-spokes \
	release-checks-landing release-checks-platform release-checks-clawmore \
	update-distribution update-homebrew

###############################################################################
# Internal macros
###############################################################################

###############################################################################
# Internal parallel helpers
###############################################################################

# Internal parallel helper for release-all
.PHONY: release-spoke-%
release-spoke-%:
	@$(call log_info,Releasing spoke @aiready/$*...); \
	$(MAKE) npm-publish SPOKE=$* || exit 1; \
	$(MAKE) publish SPOKE=$* PUBLIC_OWNER=$(PUBLIC_OWNER) || exit 1; \
	$(call log_success,Released @aiready/$*)

# Internal parallel helper for versioning
.PHONY: version-spoke-%
version-spoke-%:
	@$(MAKE) version-$(TYPE) SPOKE=$*

# Internal parallel helper for tagging
.PHONY: tag-spoke-%
tag-spoke-%:
	@version=$$(node -p "require('$(ROOT_DIR)/packages/$*/package.json').version"); \
	$(call log_step,Tagging @aiready/$* v$$version...); \
	cd $(ROOT_DIR) && git tag -f -a "$*-v$$version" -m "Release @aiready/$* v$$version" || true

# Internal parallel helper for release-all
.PHONY: release-spoke-%
release-spoke-%:
	@$(call log_info,Releasing spoke @aiready/$*...); \
	$(MAKE) npm-publish SPOKE=$* || exit 1; \
	$(MAKE) publish SPOKE=$* PUBLIC_OWNER=$(PUBLIC_OWNER) || exit 1; \
	$(call log_success,Released @aiready/$*)

# Internal parallel helper for versioning
.PHONY: version-spoke-%
version-spoke-%:
	@$(MAKE) version-$(TYPE) SPOKE=$*

# Internal parallel helper for tagging
.PHONY: tag-spoke-%
tag-spoke-%:
	@version=$$(node -p "require('$(ROOT_DIR)/packages/$*/package.json').version"); \
	$(call log_step,Tagging @aiready/$* v$$version...); \
	cd $(ROOT_DIR) && git tag -f -a "$*-v$$version" -m "Release @aiready/$* v$$version" || true

release-checks-spoke: ## Shared checks for release-one (SPOKE required)
	$(call require_spoke)
	@$(call log_step,Running shared release checks for @aiready/$(SPOKE)...)
	@$(MAKE) -C $(ROOT_DIR) build
	@$(MAKE) -C $(ROOT_DIR) test-contract SPOKE=$(SPOKE)
	@$(MAKE) -C $(ROOT_DIR) test-integration
	@$(MAKE) -C $(ROOT_DIR) test-verify-cli
	@if [ "$(SPOKE)" = "core" ] || [ "$(SPOKE)" = "cli" ]; then \
		if [ "$(RELEASE_HUB_DOWNSTREAM)" = "1" ]; then \
			$(call log_step,HUB RELEASE: Running downstream safety checks...); \
			$(MAKE) -C $(ROOT_DIR) test-downstream || { \
				$(call log_error,Downstream checks failed. Aborting.); exit 1; \
			}; \
		else \
			$(call log_info,Skipping hub downstream checks); \
		fi; \
	fi

release-checks-all-spokes: ## Shared checks for release-all
	@$(call log_step,Phase 1: Build...)
	@$(MAKE) -C $(ROOT_DIR) build
	@$(call log_step,Phase 2: Parallel tests (unit + contract + integration)...)
	@$(MAKE) $(MAKE_PARALLEL) test test-contract test-integration
	@$(call log_step,Phase 3: E2E and Downstream tests...)
	@if [ "$(RELEASE_ALL_PLATFORM_E2E)" = "1" ] || [ "$(RELEASE_ALL_DOWNSTREAM)" = "1" ]; then \
		$(MAKE) $(MAKE_PARALLEL) \
			$(if $(filter 1,$(RELEASE_ALL_PLATFORM_E2E)),test-platform-e2e-local) \
			$(if $(filter 1,$(RELEASE_ALL_DOWNSTREAM)),test-downstream); \
	fi

release-checks-landing: ## Shared checks for landing release
	@$(call log_step,Running landing release checks...)
	@$(MAKE) -C $(ROOT_DIR) test-landing
	@$(call run_if_enabled,$(RELEASE_E2E),$(MAKE) -C $(ROOT_DIR) test-landing-e2e-local,landing local E2E)

release-checks-platform: ## Shared checks for release-platform
	@$(call log_step,Running shared platform release checks...)
	@CI=1 $(MAKE) -C $(ROOT_DIR) test-platform
	@$(call run_if_enabled,$(RELEASE_E2E),CI=1 $(MAKE) -C $(ROOT_DIR) test-platform-e2e-local,platform local E2E)

release-checks-clawmore: ## Shared checks for clawmore release
	@$(call log_step,Running clawmore release checks...)
	@cd $(CLAWMORE_DIR) && pnpm test
	@$(call run_if_enabled,$(RELEASE_E2E),$(MAKE) -C $(ROOT_DIR) test-clawmore-e2e-local,clawmore local E2E)
	@$(MAKE) -C $(ROOT_DIR) test-clawmore-integration
	@$(MAKE) -C $(ROOT_DIR) test-clawmore-contracts

###############################################################################
# Version bump targets
###############################################################################

# App-specific version bump targets (using unified maybe_bump_version)
version-landing-%:
	@$(call maybe_bump_version,$(LANDING_DIR),landing,$*,$(or $(TAG_PREFIX),landing))

version-platform-%:
	@$(call maybe_bump_version,$(PLATFORM_DIR),platform,$*,$(or $(TAG_PREFIX),platform))

version-vscode-%:
	@$(call maybe_bump_version,$(EXTENSION_DIR),vscode-extension,$*,$(or $(TAG_PREFIX),vscode-extension))

version-clawmore-%:
	@$(call maybe_bump_version,$(CLAWMORE_DIR),clawmore,$*,$(or $(TAG_PREFIX),clawmore))

# npm spoke version bump targets (packages/*)
version-%: ## Bump npm spoke version: version-patch|minor|major SPOKE=name
	$(call require_spoke)
	@$(call log_step,Bumping @aiready/$(SPOKE) version ($*)...)
	@npm --prefix $(ROOT_DIR)/packages/$(SPOKE) version $* --no-git-tag-version
	@$(call log_success,@aiready/$(SPOKE) bumped to $$(node -p "require('$(ROOT_DIR)/packages/$(SPOKE)/package.json').version"))

###############################################################################
# ClawMore Release
###############################################################################

release-clawmore: release-clawmore-prod ## Alias -> release-clawmore-prod

release-clawmore-dev: verify-aws-account ## Deploy ClawMore to dev stage: TYPE=patch|minor|major
	@$(call release_app,$(CLAWMORE_DIR),clawmore,clawmore,clawmore-dev,dev,deploy-clawmore-dev,,)

release-clawmore-prod: verify-aws-account ## Release ClawMore to production: TYPE=patch|minor|major
	@$(call release_app,$(CLAWMORE_DIR),clawmore,clawmore,clawmore,production,deploy-clawmore-prod,clawmore-verify,publish-clawmore PRIVATE_OWNER=$(PRIVATE_OWNER),test-clawmore-e2e-prod)

###############################################################################
# Landing Release
###############################################################################

release-landing: release-landing-prod ## Alias -> release-landing-prod

release-landing-dev: ## Release landing to dev stage: TYPE=patch|minor|major
	@$(call release_app,$(LANDING_DIR),landing,@aiready/landing,landing-dev,dev,deploy-landing-dev,,)

release-landing-prod: ## Release landing to production: TYPE=patch|minor|major
	@$(call release_app,$(LANDING_DIR),landing,@aiready/landing,landing,production,deploy-landing-prod,landing-verify VERIFY_RETRIES=3 VERIFY_WAIT=10,publish-landing PUBLIC_OWNER=$(PUBLIC_OWNER))

###############################################################################
# Platform Release
###############################################################################

release-platform-dev: verify-aws-account ## Release platform to dev stage: TYPE=patch|minor|major
	@$(call release_app,$(PLATFORM_DIR),platform,@aiready/platform,platform-dev,dev,deploy-platform,,)

release-platform: verify-aws-account ## Release platform to production: TYPE=patch|minor|major
	@$(call release_app,$(PLATFORM_DIR),platform,@aiready/platform,platform,production,deploy-platform-prod,platform-verify,)

###############################################################################
# VS Code Extension Release
###############################################################################

release-vscode: ## Release VS Code extension: TYPE=patch|minor|major
	@$(validate_type)
	@$(call maybe_bump_app_version,$(EXTENSION_DIR),vscode-extension,$(TYPE),vscode-extension)
	@$(call commit_and_tag_app,$(EXTENSION_DIR),vscode-extension,vscode-extension,vscode-extension)
	@$(call run_if_enabled,$(RELEASE_BUILD),cd $(EXTENSION_DIR) && pnpm build,vscode build)
	@$(call run_if_enabled,$(RELEASE_PUBLISH),$(MAKE) -C $(ROOT_DIR) publish-vscode TYPE=$(TYPE) && $(MAKE) -C $(ROOT_DIR) publish-vscode-sync PUBLIC_OWNER=$(PUBLIC_OWNER) && $(MAKE) -C $(ROOT_DIR) publish-action-sync PUBLIC_OWNER=$(PUBLIC_OWNER) OWNER=$(OWNER),publish vscode)
	@$(call run_if_enabled,$(RELEASE_DISTRIBUTION),$(MAKE) -C $(ROOT_DIR) update-distribution,distribution channels)
	@$(call run_if_enabled,$(RELEASE_PUSH),$(MAKE) sync,sync and push)
	@$(call log_success,Release finished for VS Code extension)

###############################################################################
# npm Spoke Releases
###############################################################################

check-changes: ## Check if SPOKE has changes since last release tag
	$(call require_spoke)
	@last_tag=$$(git for-each-ref 'refs/tags/$(SPOKE)-v*' --sort=-creatordate --format '%(refname:short)' | head -n1); \
	if [ -z "$$last_tag" ]; then \
		$(call log_info,No previous release tag for @aiready/$(SPOKE)); \
		echo "has_changes"; exit 0; \
	fi; \
	if git diff --quiet "$$last_tag" -- packages/$(SPOKE); then \
		if $(MAKE) -s check-dependency-updates SPOKE=$(SPOKE) | grep -q "has_outdated_deps"; then \
			$(call log_info,Outdated dependencies detected); echo "has_changes"; exit 0; \
		fi; \
		$(call log_info,No changes since $$last_tag); echo "no_changes"; exit 1; \
	fi; \
	$(call log_info,Code changes detected since $$last_tag); echo "has_changes"

check-dependency-updates: ## Check if SPOKE's published dependencies have newer versions
	$(call require_spoke)
	@./makefiles/scripts/check-dependency-updates.sh $(SPOKE)

release-one: ## Release one npm spoke: SPOKE=name TYPE=patch|minor|major
	$(call require_spoke)
	@$(validate_type)
	@$(MAKE) -C $(ROOT_DIR) $(call bump_target_for_type,$(TYPE)) SPOKE=$(SPOKE)
	@$(call commit_and_tag)
	@$(call run_if_enabled,$(RELEASE_PRECHECKS),$(MAKE) -C $(ROOT_DIR) release-checks-spoke SPOKE=$(SPOKE),spoke checks)
	@$(call run_if_enabled,$(RELEASE_PUBLISH),$(MAKE) -C $(ROOT_DIR) npm-publish SPOKE=$(SPOKE) && $(MAKE) -C $(ROOT_DIR) publish SPOKE=$(SPOKE) PUBLIC_OWNER=$(PUBLIC_OWNER),publish spoke)
	@$(call run_if_enabled,$(RELEASE_DISTRIBUTION),$(MAKE) -C $(ROOT_DIR) update-distribution,distribution channels)
	@$(call run_if_enabled,$(RELEASE_PUSH),$(MAKE) sync,sync and push)
	@$(call log_success,Release finished for @aiready/$(SPOKE))

# Build+test once, then version-bump -> publish in order: core -> middle -> cli
# Landing, platform, and clawmore are excluded -- use their dedicated targets.
release-all: ## Release all npm spokes: TYPE=patch|minor|major
	@$(validate_type)
	@$(call run_if_enabled,$(RELEASE_PRECHECKS),$(MAKE) -C $(ROOT_DIR) release-checks-all-spokes,all-spoke checks)
	@$(call log_step,Phase 3: Version bump all npm spokes in parallel...)
	@$(MAKE) $(MAKE_PARALLEL) $(addprefix version-spoke-,$(NPM_PUBLISH_SPOKES)) TYPE=$(TYPE)
	@$(call log_step,Phase 4: Commit + tag all...)
	@cd $(ROOT_DIR) && git add . && \
		git commit -m "chore(release): version bumps across spokes" || true
	@$(MAKE) $(MAKE_PARALLEL) $(addprefix tag-spoke-,$(NPM_PUBLISH_SPOKES))
	@$(call run_if_enabled,$(RELEASE_PUBLISH),$(call log_step,Phase 5: Publish core...) && $(MAKE) -C $(ROOT_DIR) npm-publish SPOKE=$(CORE_SPOKE) && $(MAKE) -C $(ROOT_DIR) publish SPOKE=$(CORE_SPOKE) PUBLIC_OWNER=$(PUBLIC_OWNER),publish core)
	@$(call run_if_enabled,$(RELEASE_PUBLISH),$(call log_step,Phase 6: Publish middle spokes in parallel...) && $(MAKE) $(MAKE_PARALLEL) $(addprefix release-spoke-,$(filter-out $(CORE_SPOKE) $(CLI_SPOKE),$(NPM_PUBLISH_SPOKES))),publish middle spokes)
	@$(call run_if_enabled,$(RELEASE_PUBLISH),$(call log_step,Phase 7: Publish CLI...) && $(MAKE) -C $(ROOT_DIR) npm-publish SPOKE=$(CLI_SPOKE) && $(MAKE) -C $(ROOT_DIR) publish SPOKE=$(CLI_SPOKE) PUBLIC_OWNER=$(PUBLIC_OWNER),publish cli)
	@$(call run_if_enabled,$(RELEASE_DISTRIBUTION),$(call log_step,Phase 8: Update distribution channels...) && $(MAKE) -C $(ROOT_DIR) update-distribution,distribution channels)
	@$(call run_if_enabled,$(RELEASE_PUSH),$(MAKE) sync,sync and push)
	@$(call log_success,All spokes released: core -> middle -> cli)

###############################################################################
# Distribution Channel Updates
###############################################################################

update-distribution: ## Update all distribution channels (Homebrew, Docker, etc.)
	@$(call log_step,Updating Homebrew formula...)
	@$(MAKE) update-homebrew
	@$(call log_step,Building Docker images...)
	@$(MAKE) -C $(ROOT_DIR) docker-build || $(call log_warning,Docker build failed - continuing)
	@$(call log_step,Package distribution channels ready)
	@$(call log_success,Distribution channels updated: Homebrew formula, Docker images built)
	@$(call log_info,Note: VS Code extension and GitHub Action are standalone - they don't use CLI npm package)
	@$(call log_info,These require separate releases via their own distribution channels)

update-homebrew: ## Update Homebrew formula to latest CLI version
	@$(call log_step,Getting latest CLI version from npm...)
	@latest_cli=$$(npm view @aiready/cli version 2>/dev/null); \
	if [ -z "$$latest_cli" ]; then \
		$(call log_error,Failed to get latest CLI version from npm); \
		exit 1; \
	fi; \
	$(call log_info,Latest CLI version: $$latest_cli)
	@$(call log_step,Downloading tarball and computing SHA256...)
	@tarball_url=$$(npm view @aiready/cli@$$latest_cli dist.tarball 2>/dev/null); \
	if [ -z "$$tarball_url" ]; then \
		$(call log_error,Failed to get tarball URL); \
		exit 1; \
	fi; \
	sha256=$$(curl -s "$$tarball_url" | shasum -a 256 | cut -d' ' -f1); \
	if [ -z "$$sha256" ]; then \
		$(call log_error,Failed to compute SHA256); \
		exit 1; \
	fi; \
	$(call log_info,SHA256: $$sha256)
	@$(call log_step,Updating Homebrew formula...)
	@sed -i '' "s|url \".*\"|url \"https://registry.npmjs.org/@aiready/cli/-/cli-$$latest_cli.tgz\"|g" tooling/homebrew/aiready.rb; \
	sed -i '' "s|sha256 \".*\"|sha256 \"$$sha256\"|g" tooling/homebrew/aiready.rb
	@$(call log_step,Committing Homebrew formula update...)
	@git add tooling/homebrew/aiready.rb && \
		git commit -m "chore: update Homebrew formula to v$$latest_cli" || true
	@$(call log_success,Homebrew formula updated)

###############################################################################
# Dev pipeline + Status
###############################################################################

release-dev: ## Dev pipeline: build + test + deploy platform dev + E2E
	@$(MAKE) -C $(ROOT_DIR) build
	@$(MAKE) -C $(ROOT_DIR) test
	@$(MAKE) -C $(ROOT_DIR) test-contract
	@$(MAKE) -C $(ROOT_DIR) deploy-platform
	@$(call tag_platform_dev)
	@$(MAKE) -C $(ROOT_DIR) test-platform-e2e
	@$(MAKE) -C $(ROOT_DIR) test-landing-e2e
	@cd $(ROOT_DIR) && git push origin --follow-tags
	@$(call log_success,Dev release pipeline complete!)

release-status: ## Show local vs published/tagged versions for all components
	@echo ""; \
	printf "%-30s %-15s %-17s %-10s\n" "Component" "Local" "Published/Tag" "Status"; \
	printf "%-30s %-15s %-17s %-10s\n" "---------" "-----" "-------------" "------"; \
	for spoke in $(ALL_SPOKES); do \
		if [ -d "$(ROOT_DIR)/packages/$$spoke" ]; then d="packages/$$spoke"; \
		elif [ -d "$(ROOT_DIR)/apps/$$spoke" ]; then d="apps/$$spoke"; \
		else continue; fi; \
		if [ ! -f "$(ROOT_DIR)/$$d/package.json" ]; then continue; fi; \
		pkg_name=$$(node -p "require('$(ROOT_DIR)/$$d/package.json').name" 2>/dev/null); \
		if [ -z "$$pkg_name" ]; then continue; fi; \
		local_ver=$$(node -p "require('$(ROOT_DIR)/$$d/package.json').version" 2>/dev/null); \
		if echo "$$pkg_name" | grep -q "@aiready/"; then \
			target_ver=$$(npm view $$pkg_name version 2>/dev/null || echo "n/a"); \
			type="npm"; \
		else \
			target_ver=$$(git for-each-ref "refs/tags/$$spoke-v*" --sort=-creatordate --format '%(refname:short)' | head -n1 | sed "s/$$spoke-v//"); \
			[ -z "$$target_ver" ] && target_ver="n/a"; \
			type="tag"; \
		fi; \
		[ "$$local_ver" = "$$target_ver" ] && s="$(GREEN)OK$(RESET_COLOR)" || \
			{ [ "$$target_ver" = "n/a" ] && s="$(YELLOW)new$(RESET_COLOR)" || s="$(CYAN)ahead$(RESET_COLOR)"; }; \
		printf "%-30s %-15s %-17s %-10b\n" "$$pkg_name" "$$local_ver" "$$target_ver ($$type)" "$$s"; \
	done; \
	echo ""; \
	$(call log_success,Status collected)

release-help: ## Show release targets and examples
	@printf "%-45s %s\n" "Target" "Description"
	@printf "%-45s %s\n" "------" "-----------"
	@printf "%-45s %s\n" "RELEASE_PRECHECKS=0" "Skip shared release test/build gates"
	@printf "%-45s %s\n" "RELEASE_BUILD=0" "Skip component build step"
	@printf "%-45s %s\n" "RELEASE_DEPLOY=0" "Skip deploy step"
	@printf "%-45s %s\n" "RELEASE_VERIFY=0" "Skip post-deploy verify step"
	@printf "%-45s %s\n" "RELEASE_PUBLISH=0" "Skip npm/GitHub publish steps"
	@printf "%-45s %s\n" "RELEASE_PUSH=0" "Skip git push/tag push"
	@printf "%-45s %s\n" "RELEASE_ALL_PLATFORM_E2E=1" "Enable platform E2E in release-all checks"
	@printf "%-45s %s\n" "release-one SPOKE=name TYPE=patch" "Release one npm spoke"
	@printf "%-45s %s\n" "release-all TYPE=minor" "Release all npm spokes (core->middle->cli)"
	@printf "%-45s %s\n" "release-clawmore-dev TYPE=patch" "Deploy ClawMore to dev"
	@printf "%-45s %s\n" "release-clawmore-prod TYPE=patch" "Release ClawMore to production"
	@printf "%-45s %s\n" "release-landing-dev TYPE=minor" "Deploy landing to dev"
	@printf "%-45s %s\n" "release-landing-prod TYPE=minor" "Release landing to production"
	@printf "%-45s %s\n" "release-platform-dev TYPE=patch" "Deploy platform to dev"
	@printf "%-45s %s\n" "release-platform TYPE=patch" "Release platform to production"
	@printf "%-45s %s\n" "release-vscode TYPE=patch" "Release VS Code extension"
	@printf "%-45s %s\n" "release-status" "Show all component versions"
	@printf "%-45s %s\n" "check-changes SPOKE=cli" "Check if spoke has unreleased changes"
	@echo ""
	@echo "═══════════════════════════════════════════════════════════"
	@echo "Distribution Channels (automatically updated on release):"
	@echo "═══════════════════════════════════════════════════════════"
	@echo "  ✅ npm - @aiready/cli and all spokes"
	@echo "  ✅ Homebrew - Formula updated with latest version + SHA256"
	@echo "  ✅ Docker - Images built automatically"
	@echo "  ⚠️  VS Code - Standalone (VS Code Marketplace)"
	@echo "  ⚠️  GitHub Action - Standalone (GitHub Marketplace)"
	@echo ""
	@echo "  ℹ️  VS Code & GitHub Action are NOT npm packages"
	@echo "  ℹ️  They have their own versioning and release processes"
	@echo "  ℹ️  They don't depend on @aiready/cli npm package"
	@echo "═══════════════════════════════════════════════════════════"
