import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE;

export class IncidentRepository {
  async createIncident(incident) {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        ...incident,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    await docClient.send(command);
    return incident;
  }

  async getIncident(incidentId) {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { incidentId }
    });

    const result = await docClient.send(command);
    return result.Item;
  }

  async updateIncident(incidentId, updates) {
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      
      updateExpression.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updates[key];
    });

    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { incidentId },
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    });

    const result = await docClient.send(command);
    return result.Attributes;
  }

  async listIncidents(filters = {}) {
    const { status, severity, limit = 50 } = filters;

    let command;

    if (status) {
      // Query using GSI
      command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'status-timestamp-index',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: {
          '#status': 'status'
        },
        ExpressionAttributeValues: {
          ':status': status
        },
        ScanIndexForward: false, // Sort by timestamp descending
        Limit: limit
      });
    } else if (severity) {
      // Query using severity GSI
      command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'severity-timestamp-index',
        KeyConditionExpression: '#severity = :severity',
        ExpressionAttributeNames: {
          '#severity': 'severity'
        },
        ExpressionAttributeValues: {
          ':severity': severity
        },
        ScanIndexForward: false,
        Limit: limit
      });
    } else {
      // Scan all incidents
      command = new ScanCommand({
        TableName: TABLE_NAME,
        Limit: limit
      });
    }

    const result = await docClient.send(command);
    return result.Items || [];
  }

  async getIncidentStats() {
    // Get counts by status
    const statusCounts = {};
    const severityCounts = {};

    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      ProjectionExpression: '#status, severity',
      ExpressionAttributeNames: {
        '#status': 'status'
      }
    });

    const result = await docClient.send(scanCommand);
    const incidents = result.Items || [];

    incidents.forEach(incident => {
      // Count by status
      statusCounts[incident.status] = (statusCounts[incident.status] || 0) + 1;
      
      // Count by severity
      severityCounts[incident.severity] = (severityCounts[incident.severity] || 0) + 1;
    });

    return {
      total: incidents.length,
      byStatus: statusCounts,
      bySeverity: severityCounts
    };
  }
}
