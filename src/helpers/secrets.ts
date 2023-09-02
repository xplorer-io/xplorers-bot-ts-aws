import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// read secret from secrets manager aws
export async function readSecretFromSecretsManager(
    secretName: string
): Promise<string | undefined> {
    try {
        const secretsManagerClient = new SecretsManagerClient()
        const data = await secretsManagerClient.send(
            new GetSecretValueCommand({
              SecretId: secretName,
            })
          );

        return data.SecretString
    } catch (err) {
        console.error(
            `Failed to read secret from secrets manager ${secretName}: ${err}`
        );
        return undefined;
    }
}
