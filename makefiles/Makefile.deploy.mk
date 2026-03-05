# Deployment Automation
# Deploy landing page and platform to AWS

# Resolve this makefile's directory to allow absolute invocation
MAKEFILE_DIR := $(dir $(lastword $(MAKEFILE_LIST)))
include $(MAKEFILE_DIR)/Makefile.shared.mk

.PHONY: deploy-landing deploy-landing-prod deploy-landing-remove landing-logs landing-verify landing-cleanup
.PHONY: deploy-platform deploy-platform-prod deploy-platform-remove platform-logs platform-verify

##@ Deployment

deploy-landing: verify-aws-account ## Deploy landing page to AWS (dev environment)
	@$(call log_step,Deploying landing page to AWS (dev))
	@echo "$(CYAN)Using AWS Profile: $(AWS_PROFILE)$(NC)"
	@echo "$(CYAN)Using AWS Region: $(AWS_REGION)$(NC)"
	@cd landing && \
		set -a && [ -f .env ] && . ./.env || true && set +a && \
		export AWS_PROFILE=$${AWS_PROFILE:-$(AWS_PROFILE)} && \
		export AWS_REGION=$${AWS_REGION:-$(AWS_REGION)} && \
		export CLOUDFLARE_API_TOKEN="$${CLOUDFLARE_API_TOKEN}" && \
		export CLOUDFLARE_ACCOUNT_ID="$${CLOUDFLARE_ACCOUNT_ID}" && \
		sst deploy --yes
	@$(call log_success,Landing page deployed to dev)

deploy-landing-prod: verify-aws-account ## Deploy landing page to AWS (production)
	@$(call log_step,Deploying landing page to AWS (production))
	@echo "$(YELLOW)⚠️  Deploying to PRODUCTION$(NC)"
	@echo "$(CYAN)Using AWS Profile: $(AWS_PROFILE)$(NC)"
	@echo "$(CYAN)Using AWS Region: $(AWS_REGION)$(NC)"
	@cd landing && \
		set -a && [ -f .env ] && . ./.env || true && set +a && \
		export AWS_PROFILE=$${AWS_PROFILE:-$(AWS_PROFILE)} && \
		export AWS_REGION=$${AWS_REGION:-$(AWS_REGION)} && \
		export CLOUDFLARE_API_TOKEN="$${CLOUDFLARE_API_TOKEN}" && \
		export CLOUDFLARE_ACCOUNT_ID="$${CLOUDFLARE_ACCOUNT_ID}" && \
		sst deploy --stage production --yes
	@$(call log_success,Landing page deployed to production)
	@echo "$(CYAN)💡 Blog files synced during build, CloudFront invalidated automatically$(NC)"
	@echo ""
	@$(MAKE) -f $(MAKEFILE_DIR)/Makefile.deploy.mk landing-verify

landing-verify: ## Verify site is accessible
	@$(call log_step,Verifying site is accessible)
	@if curl -fsS -o /dev/null https://getaiready.dev >/dev/null 2>&1; then \
		echo "$(GREEN)✓ Site is live and responding$(NC)"; \
		echo "$(CYAN)🌐 URL: https://getaiready.dev$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  Site may still be deploying$(NC)"; \
		echo "$(CYAN)💡 SST handles invalidation automatically - site will be live shortly$(NC)"; \
	fi
	@echo ""

deploy-landing-remove: ## Remove landing page deployment (dev)
	@$(call log_warning,Removing landing page deployment from AWS (dev))
	@cd landing && \
		AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) sst remove --yes
	@$(call log_success,Landing page deployment removed)

landing-logs: ## Show landing page logs (requires SST dashboard)
	@$(call log_step,Opening SST dashboard for logs)
	@cd landing && \
		AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) sst dev

##@ Platform Deployment

deploy-platform: verify-aws-account ## Deploy platform to AWS (dev environment)
	@$(call log_step,Deploying platform to AWS (dev))
	@echo "$(CYAN)Using AWS Profile: $(AWS_PROFILE)$(NC)"
	@cd platform && \
		[ -f .env.dev ] && set -a && . ./.env.dev && set +a || true && \
		export NEXT_PUBLIC_APP_URL=$${NEXT_PUBLIC_APP_URL:-https://dev.platform.getaiready.dev} && \
		AWS_PROFILE=$(AWS_PROFILE) pnpm run deploy
	@$(call log_success,Platform deployed to dev)
	@$(MAKE) platform-verify

deploy-platform-prod: verify-aws-account ## Deploy platform to AWS (production)
	@$(call log_step,Deploying platform to AWS (production))
	@echo "$(YELLOW)⚠️  Deploying to PRODUCTION$(NC)"
	@echo "$(CYAN)Using AWS Profile: $(AWS_PROFILE)$(NC)"
	@cd platform && \
		[ -f .env.prod ] && set -a && . ./.env.prod && set +a || true && \
		AWS_PROFILE=$(AWS_PROFILE) pnpm run deploy:prod
	@$(call log_success,Platform deployed to production)
	@$(MAKE) platform-verify

platform-verify: ## Verify platform is accessible
	@$(call log_step,Verifying platform is accessible)
	@APP_URL=$${NEXT_PUBLIC_APP_URL:-https://platform.getaiready.dev}; \
	if curl -fsS -o /dev/null "$$APP_URL" >/dev/null 2>&1; then \
		echo "$(GREEN)✓ Platform is live and responding$(NC)"; \
		echo "$(CYAN)🌐 URL: $$APP_URL$(NC)"; \
	else \
		echo "$(YELLOW)⚠️  Platform may still be deploying$(NC)"; \
		echo "$(CYAN)💡 SST handles invalidation automatically - platform will be live shortly$(NC)"; \
	fi
	@echo ""

deploy-platform-remove: ## Remove platform deployment (dev)
	@$(call log_warning,Removing platform deployment from AWS (dev))
	@cd platform && \
		set -a && [ -f .env.dev ] && . ./.env.dev || true && set +a && \
		export AWS_PROFILE=$${AWS_PROFILE:-$(AWS_PROFILE)} && \
		AWS_PROFILE=$(AWS_PROFILE) pnpm sst:remove --yes
	@$(call log_success,Platform deployment removed)

platform-logs: ## Show platform logs (requires SST dev mode)
	@$(call log_step,Opening SST dev mode for logs)
	@cd platform && \
		set -a && [ -f .env.dev ] && . ./.env.dev || true && set +a && \
		AWS_PROFILE=$(AWS_PROFILE) pnpm sst:dev

deploy-platform-status: ## Show current platform deployment status
	@echo "$(CYAN)📊 Platform Deployment Status$(NC)\n"
	@cd platform && \
		set -a && [ -f .env.dev ] && . ./.env.dev || true && set +a && \
		AWS_PROFILE=$(AWS_PROFILE) pnpm sst:list || \
		echo "$(YELLOW)No deployments found$(NC)"

##@ General Deployment

deploy-check: ## Check AWS credentials and SST installation
	@echo "$(CYAN)🔍 Checking deployment prerequisites...$(NC)\n"
	@echo "$(GREEN)AWS Profile:$(NC) $(AWS_PROFILE)"
	@echo "$(GREEN)AWS Region:$(NC) $(AWS_REGION)"
	@echo ""
	@if command -v sst >/dev/null 2>&1; then \
		echo "$(GREEN)✓ SST CLI installed:$(NC) $$(sst --version)"; \
	else \
		echo "$(RED)✗ SST CLI not found$(NC)"; \
		echo "  Install: npm install -g sst@ion"; \
		exit 1; \
	fi
	@echo ""
	@if aws sts get-caller-identity --profile $(AWS_PROFILE) >/dev/null 2>&1; then \
		echo "$(GREEN)✓ AWS credentials valid$(NC)"; \
		aws sts get-caller-identity --profile $(AWS_PROFILE) | \
			jq -r '"  Account: \(.Account)\n  User: \(.Arn)"'; \
	else \
		echo "$(RED)✗ AWS credentials invalid or not found$(NC)"; \
		echo "  Configure: aws configure --profile $(AWS_PROFILE)"; \
		exit 1; \
	fi
	@echo ""
	@$(call log_success,All prerequisites met)

deploy-all: deploy-landing deploy-platform ## Deploy both landing and platform (dev)
	@$(call log_success,All services deployed to dev)

deploy-all-prod: deploy-landing-prod deploy-platform-prod ## Deploy both landing and platform (production)
	@$(call log_success,All services deployed to production)

deploy-landing-status: ## Show current deployment status
	@echo "$(CYAN)📊 Landing Page Deployment Status$(NC)\n"
	@cd landing && \
		AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) sst list || \
		echo "$(YELLOW)No deployments found$(NC)"

domain-status: ## Check Cloudflare zone status and nameservers
	@$(call log_step,Checking Cloudflare zone status)
	@cd landing && \
		set -a && [ -f .env ] && . ./.env || true && set +a && \
		if [ -z "$$CLOUDFLARE_API_TOKEN" ] || [ -z "$$CLOUDFLARE_ACCOUNT_ID" ]; then \
			echo "$(YELLOW)Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID$(NC)"; exit 1; \
		fi; \
		curl -s -H "Authorization: Bearer $$CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/zones?name=$${DOMAIN_NAME:-getaiready.dev}&account.id=$$CLOUDFLARE_ACCOUNT_ID" | jq '{success, result: ( .result[] | {id, name, status, name_servers, account: .account.id} )}' || true

leads-export: ## Export submissions from S3 to local CSV
	@$(call log_step,Exporting leads from S3)
	@mkdir -p .aiready/leads/submissions
	@bucket=$$(cd landing && AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) sst list | awk '/submissionsBucket:/ {print $$2}'); \
	if [ -z "$$bucket" ]; then \
		echo "$(RED)✗ Could not detect submissions bucket$(NC)"; exit 1; \
	fi; \
	aws s3 sync s3://$$bucket/submissions .aiready/leads/submissions --delete --profile $(AWS_PROFILE) || exit 1; \
	jq -r '["email","repoUrl","receivedAt"], (.aiready/leads/submissions/*.json | map( [ .email, .repoUrl, .receivedAt ] ))[] | @csv' \
		<(jq -s '.' .aiready/leads/submissions/*.json 2>/dev/null) > .aiready/leads/leads.csv 2>/dev/null || \
		echo "$(YELLOW)No submissions found yet$(NC)"; \
	echo "$(GREEN)✓ Exported to .aiready/leads/leads.csv$(NC)"

leads-open: ## Open leads folder
	@open .aiready/leads 2>/dev/null || xdg-open .aiready/leads 2>/dev/null || echo "Path: .aiready/leads"

landing-cleanup: ## Clean up stale AWS resources from old deployments
	@$(call log_warning,Scanning for stale AWS resources)
	@echo "$(CYAN)Checking CloudFront distributions...$(NC)"
	@OLD_DISTS=$$(aws cloudfront list-distributions --profile $(AWS_PROFILE) 2>/dev/null | \
		jq -r '.DistributionList.Items[] | select(.Aliases.Quantity == 0 and (.Comment | contains("aiready") or contains("landing"))) | .Id'); \
	if [ -n "$$OLD_DISTS" ]; then \
		echo "$(YELLOW)Found CloudFront distributions without aliases:$(NC)"; \
		for dist in $$OLD_DISTS; do \
			DOMAIN=$$(aws cloudfront get-distribution --id $$dist --profile $(AWS_PROFILE) 2>/dev/null | jq -r '.Distribution.DomainName'); \
			echo "  - $$dist ($$DOMAIN)"; \
		done; \
		echo "$(YELLOW)💡 To disable: aws cloudfront get-distribution-config --id <ID> > /tmp/dist.json$(NC)"; \
		echo "$(YELLOW)   Then: aws cloudfront update-distribution --id <ID> --if-match <ETag> --distribution-config <config-with-Enabled=false>$(NC)"; \
		echo "$(YELLOW)   Finally: aws cloudfront delete-distribution --id <ID> --if-match <ETag>$(NC)"; \
	else \
		echo "$(GREEN)✓ No stale CloudFront distributions$(NC)"; \
	fi
	@echo ""
	@echo "$(CYAN)Checking Lambda functions...$(NC)"
	@OLD_LAMBDAS=$$(aws lambda list-functions --region $(AWS_REGION) --profile $(AWS_PROFILE) 2>/dev/null | \
		jq -r '.Functions[] | select(.FunctionName | contains("pengcao") or contains("dev")) | .FunctionName'); \
	if [ -n "$$OLD_LAMBDAS" ]; then \
		echo "$(YELLOW)Found dev/test Lambda functions:$(NC)"; \
		for func in $$OLD_LAMBDAS; do \
			echo "  - $$func"; \
		done; \
		echo "$(YELLOW)💡 To delete: aws lambda delete-function --function-name <NAME> --region $(AWS_REGION)$(NC)"; \
	else \
		echo "$(GREEN)✓ No stale Lambda functions$(NC)"; \
	fi
	@echo ""
	@echo "$(CYAN)Checking ACM certificates...$(NC)"
	@aws acm list-certificates --region us-east-1 --profile $(AWS_PROFILE) 2>/dev/null | \
		jq -r '.CertificateSummaryList[] | select(.DomainName == "getaiready.dev") | "\(.CertificateArn) - InUse: \(.InUse)"' | \
		while read -r cert; do echo "  $$cert"; done
	@echo "$(CYAN)💡 Certificates are auto-deleted when CloudFront distributions are removed$(NC)"
	@echo ""
	@$(call log_success,Cleanup scan complete)