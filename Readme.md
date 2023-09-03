# XPLORERS SLACK BOT

An event driven serverless application which reacts to events happening in Slack. [Slack Event Subscriptions](https://api.slack.com/events-api) is a feature that allows developers to build apps that can receive and respond to events that occur within Slack. These events can be anything from a new message being posted in a channel to a user joining or leaving a workspace.

Once an app is subscribed to an event, Slack will send a payload containing information about the event to the app's specified endpoint (i.e., webhook). The app can then use this information to perform various actions, such as sending a notification, updating a database, or triggering a workflow.

## Prerequisites

Please follow the [prerequisites guide](docs/prerequisites.md) on instructions to setup required software and for authenticating to AWS.

## Validating and applying configuration to AWS

Terraform is an infrastructure as code tool that enables developers to automate the creation, modification, and deletion of cloud infrastructure resources. We deploy XplorersBot application to AWS using Terraform.

To run the following commands from your local machine, ensure you have authenticated to AWS, see [prerequisites guide](docs/prerequisites.md) for details.

1. Run `task terraform-init` to initialize terraform's backend and providers.
    1. AWS provider is setup.
    2. AWS S3 bucket is used as backend to store terraform's configuration. State locking is also supported.

2. Run `task terraform-plan` to generate a plan for the changes to be applied to AWS.

3. Once you have reviewed the changes to be applied, run `task terraform-apply` to apply changes to AWS.

To delete all the resources created by Terraform, run `task terraform-destroy`.

## Architecture Diagram

![XplorersBot](assets/xplorersbot-architecture.png)

## Features

There are a million ways to drive engagement in Slack. Current features of XplorersBot are,

* ***Welcome a new slack user*** - When a user joins a slack channel, XplorersBot crafts a welcome message and posts in the channel to welcome the user.
* ***React to slack posts with emojis*** - With every slack post, XplorersBot checks the text for any keyword matches and reacts to the post with appropriate emoji's. For example, for text `This is a kubernetes environment`, XplorersBot will react to the post with `kubernetes` emoji.
* ***Interact with OpenAI from Slack*** - XplorersBot can interact with OpenAI from slack. For example, if you post `hey openai, tell me a joke`, XplorersBot will respond with a joke. Please read [OpenAI setup](docs/openai_setup.md) to learn more about setting up OpenAI with Slack.

> As every slack organisation can have custom emojis added, the emoji set `src/helpers/files/emojis.json` will need to be adjusted accordingly to fit your slack emoji set.

## Slack setup

Please follow [slack setup guide](docs/slack_setup.md) to configure event subscription and oauth permissions for the slack bot.

## Feature branch based deployments

Please follow [feature branch deployment guide](docs/feature_branch_deployment.md) to deploy a feature branch deployment of XplorersBot.

## AWS resources

See [AWS Resources](docs/aws_resources.md) section for a list of resources deployed to AWS to get the slack bot running.

## CI/CD with Github Actions and AWS Workload Identity Federation

See [github actions](docs/cd_cd_with_github_actions.md) guide to understand how Continuous Integration (CI) and Continuous Delivery/Deployment (CD) works when using GitHub Actions and AWS Workload Identity Federation.

## Release tags

With the help of github actions and release drafter tool, a new release tag is created on every merge to `main`.
