## Prerequisites

### Required software
* [AWS CLI](https://aws.amazon.com/cli/)
* [Terraform CLI](https://developer.hashicorp.com/terraform/cli)
* [Taskfile](https://taskfile.dev/installation)

### Login to AWS

Login to AWS using the AWS CLI so that Terraform can use the credentials to create resources. Follow AWS [guide](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) on configuration options for AWS CLI.

### Default configuration variables

The entrypoint for this repository is in the file `configuration/defaults.conf` which stores necessary environment variables used by Taskfile to orchestrate and apply the changes using Terraform. Change these values according to your project configuration,

* `XPLORERS_ARTIFACTS_BUCKET_NAME` - Bucket to use to store artifacts and terraform state information
* `XPLORERS_ARTIFACTS_BUCKET_TERRAFORM_PREFIX` - Bucket prefix to store terraform state information
* `XPLORERS_OPENAI_SLACK_CHANNEL_ID` - Slack channel ID to use for OpenAI interaction
* `TF_WORKSPACE` - Terraform workspace to use. Defaults to `dev`.
* `AZURE_OPENAI_DEPLOYMENT_ID` - Azure OpenAI deployment ID to use. See [OpenAI setup](docs/openai_setup.md) for details.
