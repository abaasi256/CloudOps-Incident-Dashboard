const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const eventbridge = new AWS.EventBridge();

const TABLE_NAME = process.env.DYNAMODB_TABLE;

exports.handler = async (event) => {
    console.log('API request:', JSON.stringify(event, null, 2));
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    };
    
    try {
        const method = event.httpMethod;
        const path = event.path;
        
        if (method === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }
        
        if (path === '/health') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() })
            };
        }
        
        if (path === '/incidents') {
            if (method === 'GET') {
                return await listIncidents(event);
            } else if (method === 'POST') {
                return await createIncident(event);
            }
        }
        
        // Test endpoint without authentication
        if (path === '/test-incidents') {
            if (method === 'GET') {
                return await listIncidentsNoAuth(event);
            } else if (method === 'POST') {
                return await createIncidentNoAuth(event);
            }
        }
        
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Not found' })
        };
        
    } catch (error) {
        console.error('API Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

async function listIncidents(event) {
    const params = {
        TableName: TABLE_NAME,
        ScanIndexForward: false,
        Limit: 50
    };
    
    // Add filtering if query parameters exist
    const queryParams = event.queryStringParameters || {};
    if (queryParams.severity) {
        params.IndexName = 'severity-timestamp-index';
        params.KeyConditionExpression = 'severity = :severity';
        params.ExpressionAttributeValues = { ':severity': queryParams.severity };
    } else if (queryParams.status) {
        params.IndexName = 'status-timestamp-index';
        params.KeyConditionExpression = '#status = :status';
        params.ExpressionAttributeNames = { '#status': 'status' };
        params.ExpressionAttributeValues = { ':status': queryParams.status };
    }
    
    const result = await dynamodb.scan(params).promise();
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            incidents: result.Items,
            count: result.Count
        })
    };
}

async function createIncident(event) {
    const body = JSON.parse(event.body || '{}');
    
    const incident = {
        incidentId: body.incidentId || 'INC-' + Date.now(),
        title: body.title,
        description: body.description,
        severity: body.severity || 'Medium',
        status: body.status || 'New',
        service: body.service,
        source: 'api',
        timestamp: new Date().toISOString(),
        assignedTo: body.assignedTo,
        tags: body.tags || []
    };
    
    // Save to DynamoDB
    await dynamodb.put({
        TableName: TABLE_NAME,
        Item: incident
    }).promise();
    
    // Send notification event
    await eventbridge.putEvents({
        Entries: [{
            Source: 'custom.incident-system',
            DetailType: 'Incident Created',
            Detail: JSON.stringify({ incident })
        }]
    }).promise();
    
    console.log('Incident created via API:', incident.incidentId);
    
    return {
        statusCode: 201,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(incident)
    };
}

// Test function without authentication requirement
async function listIncidentsNoAuth(event) {
    const params = {
        TableName: TABLE_NAME
    };
    
    const result = await dynamodb.scan(params).promise();
    
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            incidents: result.Items || [],
            count: result.Count || 0,
            message: 'Test endpoint - no auth required'
        })
    };
}

// Test create function without authentication
async function createIncidentNoAuth(event) {
    const body = JSON.parse(event.body || '{}');
    
    const incident = {
        incidentId: body.incidentId || 'TEST-' + Date.now(),
        title: body.title || 'Test Incident',
        description: body.description || 'Test incident created via API',
        severity: body.severity || 'Medium',
        status: body.status || 'New',
        service: body.service || 'test',
        source: 'test-api',
        timestamp: new Date().toISOString(),
        assignedTo: body.assignedTo,
        tags: body.tags || ['test']
    };
    
    // Save to DynamoDB
    await dynamodb.put({
        TableName: TABLE_NAME,
        Item: incident
    }).promise();
    
    // Send notification event
    await eventbridge.putEvents({
        Entries: [{
            Source: 'custom.incident-system',
            DetailType: 'Incident Created',
            Detail: JSON.stringify({ incident })
        }]
    }).promise();
    
    console.log('Test incident created via API:', incident.incidentId);
    
    return {
        statusCode: 201,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            ...incident,
            message: 'Test incident created successfully - should trigger Slack notification'
        })
    };
}
