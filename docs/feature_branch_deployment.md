## Deploy your own version of XplorersBot for testing and feature development

As developers, we want to be able to deploy a test version of the application for adding a new feature, testing or debugging. This guide covers how to deploy your own version of XplorersBot to AWS.

### Terraform workspaces

Terraform [workspaces](https://www.terraform.io/docs/state/workspaces.html) allow multiple instances of infrastructure to be provisioned from the same Terraform configuration. Using workspaces, you can maintain different environments like `dev`, `staging` and `production` from the same code base.

Run the following commands to create and switch to a `dev` workspace:

```
terraform -chdir=terraform workspace new dev
terraform -chdir=terraform workspace select dev
```

### Create Slack and OpenAI secrets in AWS Secrets Manager

Set the environment variables below before running the commands to create the secrets:

```bash
export SLACK_OAUTH_TOKEN=<your-slack-oauth-token>
export AZURE_OPENAI_ENDPOINT=<your-azure-openai-endpoint> (Optional)
export AZURE_OPENAI_KEY=<your-azure-openai-key> (Optional)
```

Run `task create-secrets` to create the secrets in AWS Secrets Manager.

If you are testing the function locally, set these environment variable before calling the function.

### Deploy your feature branch

Run the following commands to check the deployment plan and to deploy your feature branch to the `dev` workspace:
```
task terraform-plan (also calls task terraform-init)
task terraform-apply
```
