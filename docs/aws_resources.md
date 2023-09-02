## AWS resources

The following resources are created in AWS for the slack bot application,

* [REST API Gateway](https://aws.amazon.com/api-gateway/) - API Gateway is a fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs at any scale.
* [Lambda](https://aws.amazon.com/lambda/) - Lambda is a serverless compute service that lets you run code without provisioning or managing servers, creating workload-aware cluster scaling logic, maintaining event integrations, or managing runtimes.
* [Artifact S3 Bucket](https://aws.amazon.com/s3/) - Amazon Simple Storage Service (Amazon S3) is an object storage service that offers industry-leading scalability, data availability, security, and performance. This bucket is used to store application artifacts.
* [Secrets Manager](https://aws.amazon.com/secrets-manager/) - AWS Secrets Manager helps you protect secrets needed to access your applications, services, and IT resources. Slack and OpenAI tokens are stored in secrets manager.
* [CloudWatch](https://aws.amazon.com/cloudwatch/) - Amazon CloudWatch is a monitoring and observability service built for DevOps engineers, developers, site reliability engineers (SREs), and IT managers. Logs from Lambda functions are stored in CloudWatch.
* [IAM Roles and Policies](https://aws.amazon.com/iam/) - AWS Identity and Access Management (IAM) enables you to manage access to AWS services and resources securely. IAM roles and policies are created to allow Lambda functions and API Gateway.
* [EventBridge Bus and Rules](https://aws.amazon.com/eventbridge/) - Amazon EventBridge is a serverless event bus that makes it easy to connect applications together using data from your own applications, integrated Software-as-a-Service (SaaS) applications, and AWS services. Slack events are pushed to the default event bus in EventBridge which invokes XplorersBot lambda function to process the event and respond to Slack accordingly.
