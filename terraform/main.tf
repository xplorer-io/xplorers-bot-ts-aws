data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

locals {
  timestamp = formatdate("YYMMDD", timestamp())
}

# Generates an archive of the source code compressed as a .zip file.
data "archive_file" "xplorers_artifact" {
  type        = "zip"
  source_dir  = "../out"
  output_path = "handler.zip"
}

data "archive_file" "xplorers_lambda_layer" {
  type        = "zip"
  source_dir  = "../nodejs"
  output_path = "lambda-layer.zip"
}

resource "aws_lambda_function" "xplorers-event-router" {
  description      = "Receives events from Slack and publishes them to EventBridge - sending 200 OK to Slack immediately"
  function_name    = "xplorers-eventrouter-${terraform.workspace}"
  handler          = "index.eventRouter"
  filename         = data.archive_file.xplorers_artifact.output_path
  runtime          = var.function_runtime
  role             = aws_iam_role.xplorers-eventRouterFunctionRole.arn
  source_code_hash = data.archive_file.xplorers_artifact.output_base64sha256
  layers           = [aws_lambda_layer_version.xplorers-lambda-layer.arn]
  architectures    = var.function_architecture
  timeout          = var.function_timeout_in_seconds
  tracing_config {
    mode = "Active"
  }
  environment {
    variables = {
      NODE_PATH = var.lambda_node_path
    }
  }
}

resource "aws_lambda_function" "xplorers-bot" {
  description      = "Xplorers Bot function that receives events from Slack and processes them accordingly"
  function_name    = "xplorers-bot-${terraform.workspace}"
  handler          = "index.xplorersbot"
  filename         = data.archive_file.xplorers_artifact.output_path
  runtime          = var.function_runtime
  role             = aws_iam_role.xplorers-BotFunctionRole.arn
  source_code_hash = data.archive_file.xplorers_artifact.output_base64sha256
  layers           = [aws_lambda_layer_version.xplorers-lambda-layer.arn]
  architectures    = var.function_architecture
  timeout          = var.function_timeout_in_seconds
  tracing_config {
    mode = "Active"
  }
  environment {
    variables = {
      XPLORERS_OPENAI_SLACK_CHANNEL_ID = var.xplorers_openai_slack_channel_id
      XPLORERS_INTROS_SLACK_CHANNEL_ID = var.xplorers_intros_slack_channel_id
      TF_WORKSPACE                     = terraform.workspace
      NODE_PATH                        = var.lambda_node_path
      AZURE_OPENAI_DEPLOYMENT_ID       = var.azure_openai_deployment_id
    }
  }
}

resource "aws_lambda_function" "xplorers-monthly-lambda" {
  description      = "Xplorers monthly lambda function that sends notes to general slack channel"
  function_name    = "xplorers-monthly-lambda-${terraform.workspace}"
  handler          = "index.xplorersMonthlyLambda"
  filename         = data.archive_file.xplorers_artifact.output_path
  runtime          = var.function_runtime
  role             = aws_iam_role.xplorers-BotFunctionRole.arn
  source_code_hash = data.archive_file.xplorers_artifact.output_base64sha256
  layers           = [aws_lambda_layer_version.xplorers-lambda-layer.arn]
  architectures    = var.function_architecture
  timeout          = var.function_timeout_in_seconds
  tracing_config {
    mode = "Active"
  }
  environment {
    variables = {
      XPLORERS_GENERAL_SLACK_CHANNEL_ID = var.xplorers_general_slack_channel_id
      TF_WORKSPACE = terraform.workspace
      NODE_PATH    = var.lambda_node_path
    }
  }
}


# upload zip file to s3
resource "aws_s3_object" "lambda_layer_zip" {
  bucket = var.xplorers_artifacts_bucket_name
  key    = "xplorers/lambda_layers/lambda-layer.zip"
  source = data.archive_file.xplorers_lambda_layer.output_path
}

resource "aws_lambda_layer_version" "xplorers-lambda-layer" {
  layer_name = "xplorers-lambda-layer-${terraform.workspace}"

  filename         = data.archive_file.xplorers_lambda_layer.output_path
  source_code_hash = data.archive_file.xplorers_lambda_layer.output_base64sha256

  compatible_runtimes = [var.function_runtime]
}

resource "aws_cloudwatch_log_group" "xplorers-bot-log-group" {
  name              = "/aws/lambda/${aws_lambda_function.xplorers-bot.function_name}"
  retention_in_days = var.lambda_log_group_retention_in_days
}

resource "aws_cloudwatch_log_group" "xplorers-event-router-log-group" {
  name              = "/aws/lambda/${aws_lambda_function.xplorers-event-router.function_name}"
  retention_in_days = var.lambda_log_group_retention_in_days
}

resource "aws_cloudwatch_log_group" "xplorers-monthly-lambda-log-group" {
  name              = "/aws/lambda/${aws_lambda_function.xplorers-monthly-lambda.function_name}"
  retention_in_days = var.lambda_log_group_retention_in_days
}

resource "aws_iam_role" "xplorers-eventRouterFunctionRole" {
  name = "xplorers-eventRouterFunctionRole-${terraform.workspace}"

  managed_policy_arns = var.lambda_managed_policy_arns

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  inline_policy {
    name = "xplorers-publish-events-to-eventbridge-policy"
    policy = jsonencode({
      Version = "2012-10-17",
      Statement = [
        {
          Action = [
            "events:PutEvents"
          ],
          Effect = "Allow",
          Resource = [
            "arn:aws:events:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:event-bus/default"
          ]
        }
      ]
    })
  }
}

resource "aws_iam_role" "xplorers-BotFunctionRole" {
  name = "xplorers-BotFunctionRole-${terraform.workspace}"

  managed_policy_arns = var.lambda_managed_policy_arns

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = "sts:AssumeRole",
        Effect = "Allow",
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  inline_policy {
    name = "xplorers-fetch-secrets-from-ssm-systems-manager-policy"
    policy = jsonencode({
      Version = "2012-10-17",
      Statement = [
        {
          Action = [
            "ssm:GetParameter"
          ],
          Effect = "Allow",
          Resource = [
            "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/azure/openai/endpoint/*",
            "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/azure/openai/key/*",
            "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/slack/oauth/token/*",
          ]
        }
      ]
    })
  }
}

data "template_file" "openapi-spec" {
  template = file("apispec.yaml")

  vars = {
    lambda_name    = "${aws_lambda_function.xplorers-event-router.function_name}"
    aws_region     = "${data.aws_region.current.name}"
    aws_account_id = "${data.aws_caller_identity.current.account_id}"
  }

}

resource "aws_lambda_permission" "xplorers-api-gateway-invoke-xplorersbot-lambda" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.xplorers-event-router.function_name
  principal     = "apigateway.amazonaws.com"

  # The /*/* portion grants access from any method on any resource
  # within the specified API Gateway.
  source_arn = "${aws_api_gateway_rest_api.xplorers-api-gateway.execution_arn}/*/*"
}

resource "aws_cloudwatch_event_rule" "xplorers-route-slack-events" {
  name           = "xplorers-route-slack-events-${terraform.workspace}"
  description    = "Rule to trigger Lambda function"
  event_bus_name = "default" # Use the default event bus

  event_pattern = jsonencode({
    detail-type = ["XplorersSlackEvent"]
    source      = ["xplorers.slack"]
  })
}

resource "aws_cloudwatch_event_target" "xplorers-invoke-lambda" {
  arn       = aws_lambda_function.xplorers-bot.arn
  rule      = aws_cloudwatch_event_rule.xplorers-route-slack-events.name
  target_id = "xplorers-invoke-lambda"
}

resource "aws_lambda_permission" "xplorers-allow-events-to-invoke-lambda" {
  statement_id  = "AllowEventsToInvokeLambda"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.xplorers-bot.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.xplorers-route-slack-events.arn
}

resource "aws_api_gateway_rest_api" "xplorers-api-gateway" {
  name        = "xplorers-bot-api-${terraform.workspace}"
  description = "Xplorers Bot API"
  body        = data.template_file.openapi-spec.rendered

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_deployment" "xplorers-api-gateway-deployment" {
  rest_api_id = aws_api_gateway_rest_api.xplorers-api-gateway.id

  triggers = {
    redeployment = sha1(jsonencode(aws_api_gateway_rest_api.xplorers-api-gateway.body))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "xplorers-api-gateway-stage" {
  deployment_id = aws_api_gateway_deployment.xplorers-api-gateway-deployment.id
  rest_api_id   = aws_api_gateway_rest_api.xplorers-api-gateway.id
  stage_name    = "dev"
}

resource "aws_cloudwatch_event_rule" "monthly_friday_lambda_trigger" {
  name        = "xplorers-MonthlyFridayLambdaTrigger"
  description = "Trigger Lambda function every month on a Friday at 1 PM"

  schedule_expression = "cron(0 3 ? * 6L *)"  # This schedules the rule to run on the last Friday of every month at 1 PM Sydney time
}

resource "aws_lambda_permission" "allow_cloudwatch_to_invoke_monthly_friday_lambda" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.xplorers-monthly-lambda.function_name
  principal     = "events.amazonaws.com"

  source_arn = aws_cloudwatch_event_rule.monthly_friday_lambda_trigger.arn
}

resource "aws_cloudwatch_event_target" "xplorers_monthly_friday_lambda_target" {
  target_id = "xplorers-MonthlyFridayLambdaTarget"
  rule      = aws_cloudwatch_event_rule.monthly_friday_lambda_trigger.name
  arn       = aws_lambda_function.xplorers-monthly-lambda.arn
}
