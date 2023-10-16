variable "xplorers_artifacts_bucket_name" {
  type        = string
  description = "Bucket storing xplorers bot artifacts"
}

variable "function_runtime" {
  type        = string
  description = "Runtime for AWS lambda function"
  default     = "nodejs18.x"
}

variable "function_architecture" {
  type        = list(string)
  description = "Function architecture for AWS lambda function"
  default     = ["arm64"]
}

variable "lambda_log_group_retention_in_days" {
  type        = number
  description = "Number of days to retain logs for lambda functions"
  default     = 60
}

variable "lambda_node_path" {
  type        = string
  description = "Node path for lambda functions"
  default     = "./:/opt/node_modules"
}

variable "lambda_managed_policy_arns" {
  type        = list(string)
  description = "Managed policy arns for lambda functions"
  default = [
    "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
  ]
}

variable "secret_mount_path" {
  type        = string
  description = "Path where the secret will be mounted in the function container"
  default     = "/etc/secrets"
}

variable "function_timeout_in_seconds" {
  type        = number
  description = "Number of seconds after which the function times out"
  default     = 60
}

variable "xplorers_openai_slack_channel_id" {
  type        = string
  description = "Slack channel id for the xplorers openai slack channel"
}

variable "xplorers_general_slack_channel_id" {
  type        = string
  description = "Slack channel id for the xplorers general slack channel"
}

variable "azure_openai_deployment_id" {
  type        = string
  description = "Deployment id for the azure openai deployment"
}
