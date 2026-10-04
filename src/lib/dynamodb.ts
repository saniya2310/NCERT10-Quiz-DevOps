import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "eu-north-1";

let docClientInstance: DynamoDBDocumentClient | null = null;

export function getDocClient(): DynamoDBDocumentClient {
  if (!docClientInstance) {
    const rawClient = new DynamoDBClient({ region });
    docClientInstance = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: {
        removeUndefinedValues: true,
      },
    });
  }
  return docClientInstance;
}

export const ATTEMPTS_TABLE = process.env.DYNAMODB_TABLE_ATTEMPTS;
export const LEADERBOARD_TABLE = process.env.DYNAMODB_TABLE_LEADERBOARD;

export function isDynamoDBConfigured(): boolean {
  return Boolean(ATTEMPTS_TABLE && LEADERBOARD_TABLE);
}
