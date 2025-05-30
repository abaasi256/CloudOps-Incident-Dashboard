const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const eventbridge = new AWS.EventBridge();

const TABLE_NAME = process.env.DYNAMODB_TABLE;

exports.handler = async (event) => {
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    try {
        let incident = null;
        
        // Handle CloudWatch Alarm events
        if (event.source === 'aws.cloudwatch' && event['detail-type'] === 'CloudWatch Alarm State Change') {
            incident = await processCloudWatchAlarm(event.detail);
        }
        // Handle custom application events
        else if (event.source === 'custom.incident-system') {
            incident = await processCustomEvent(event);
        }
        
        if (incident) {
            console.log('Incident processed:', incident.incidentId);
            
            // Send notification
            await sendNotification({
                type: getNotificationType(event),
                incident: incident,
                timestamp: new Date().toISOString()
            });
        }
        
        return { statusCode: 200, body: 'Event processed successfully' };
    } catch (error) {
        console.error('Error processing event:', error);
        return { statusCode: 500, body: 'Failed to process event' };
    }
};

async function processCloudWatchAlarm(alarmDetail) {
    if (alarmDetail.NewStateValue === 'ALARM') {
        const incident = {
            incidentId: 'ALARM-' + Date.now(),
            title: 'CloudWatch Alarm: ' + alarmDetail.AlarmName,
            description: alarmDetail.NewStateReason,
            severity: 'High',
            status: 'New',
            service: 'cloudwatch',
            source: 'aws.cloudwatch',
            timestamp: new Date().toISOString(),
            metadata: {
                alarmName: alarmDetail.AlarmName,
                region: alarmDetail.Region
            }
        };
        
        await createIncident(incident);
        return incident;
    }
    return null;
}

async function processCustomEvent(event) {
    if (event['detail-type'] === 'Incident Created') {
        const detail = event.detail;
        const incident = {
            incidentId: detail.incidentId || 'INC-' + Date.now(),
            title: detail.title,
            description: detail.description,
            severity: detail.severity || 'Medium',
            status: detail.status || 'New',
            service: detail.service,
            source: 'manual',
            timestamp: detail.timestamp || new Date().toISOString(),
            assignedTo: detail.assignedTo,
            tags: detail.tags || []
        };
        
        await createIncident(incident);
        return incident;
    }
    return null;
}

async function createIncident(incident) {
    const params = {
        TableName: TABLE_NAME,
        Item: incident
    };
    
    await dynamodb.put(params).promise();
    console.log('Incident created:', incident.incidentId);
}

async function sendNotification(notificationData) {
    const params = {
        Entries: [{
            Source: 'custom.incident-system',
            DetailType: notificationData.type,
            Detail: JSON.stringify({
                incident: notificationData.incident,
                timestamp: notificationData.timestamp
            })
        }]
    };
    
    try {
        await eventbridge.putEvents(params).promise();
        console.log('Notification sent for incident:', notificationData.incident.incidentId);
    } catch (error) {
        console.error('Failed to send notification:', error);
    }
}

function getNotificationType(event) {
    if (event.source === 'aws.cloudwatch') {
        return 'CloudWatch Alarm';
    } else if (event.source === 'custom.incident-system') {
        return event['detail-type'];
    }
    return 'Incident Notification';
}
