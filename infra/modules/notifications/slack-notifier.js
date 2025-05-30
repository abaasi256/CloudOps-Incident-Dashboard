const AWS = require('aws-sdk');
const https = require('https');
const url = require('url');

const ssm = new AWS.SSM();

/**
 * CloudOps Incident Dashboard - Slack Notifier
 * Sends formatted notifications to Slack when incidents are created/updated
 */
exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    try {
        // Get Slack webhook URL from SSM Parameter Store
        const webhookUrl = await getSlackWebhookUrl();
        
        // Parse the incident event
        const incidentData = parseIncidentEvent(event);
        
        if (!incidentData) {
            console.log('No incident data found in event');
            return { statusCode: 200, body: 'No incident data to process' };
        }
        
        // Create Slack message
        const slackMessage = createSlackMessage(incidentData);
        
        // Send to Slack
        await sendToSlack(webhookUrl, slackMessage);
        
        console.log('Successfully sent notification to Slack');
        return { statusCode: 200, body: 'Notification sent successfully' };
        
    } catch (error) {
        console.error('Error sending Slack notification:', error);
        throw error;
    }
};

/**
 * Get Slack webhook URL from SSM Parameter Store
 */
async function getSlackWebhookUrl() {
    const parameterName = process.env.SLACK_WEBHOOK_PARAMETER;
    
    if (!parameterName) {
        throw new Error('SLACK_WEBHOOK_PARAMETER environment variable not set');
    }
    
    const params = {
        Name: parameterName,
        WithDecryption: true
    };
    
    const result = await ssm.getParameter(params).promise();
    
    if (!result.Parameter || !result.Parameter.Value) {
        throw new Error('Slack webhook URL not found in parameter store');
    }
    
    return result.Parameter.Value;
}

/**
 * Parse incident event data
 */
function parseIncidentEvent(event) {
    // Handle EventBridge events
    if (event.source === 'custom.incident-system') {
        return {
            type: event['detail-type'],
            incident: event.detail,
            timestamp: event.time
        };
    }
    
    // Handle CloudWatch alarm events
    if (event.source === 'aws.cloudwatch') {
        const alarmData = event.detail;
        return {
            type: 'CloudWatch Alarm',
            incident: {
                incidentId: `ALARM-${Date.now()}`,
                title: alarmData.alarmName,
                description: alarmData.newStateReason,
                severity: alarmData.newStateReasonData ? 'Critical' : 'High',
                status: alarmData.newStateValue === 'ALARM' ? 'New' : 'Resolved',
                service: 'cloudwatch',
                alarmName: alarmData.alarmName,
                region: alarmData.region
            },
            timestamp: event.time
        };
    }
    
    // Handle direct Lambda invocation with incident data
    if (event.incident) {
        return {
            type: event.type || 'Incident Notification',
            incident: event.incident,
            timestamp: event.timestamp || new Date().toISOString()
        };
    }
    
    return null;
}

/**
 * Create formatted Slack message
 */
function createSlackMessage(incidentData) {
    const { type, incident, timestamp } = incidentData;
    
    // Determine color based on severity
    const colorMap = {
        'Critical': '#FF0000',
        'High': '#FF6600', 
        'Medium': '#FFCC00',
        'Low': '#00FF00'
    };
    
    const color = colorMap[incident.severity] || '#808080';
    
    // Create status emoji
    const statusEmojis = {
        'New': '🚨',
        'Acknowledged': '👀',
        'InProgress': '🔧',
        'Resolved': '✅'
    };
    
    const statusEmoji = statusEmojis[incident.status] || '❓';
    
    // Format timestamp
    const formattedTime = new Date(timestamp).toLocaleString();
    
    // Create the message payload
    const payload = {
        username: 'CloudOps Dashboard',
        icon_emoji: ':warning:',
        attachments: [
            {
                color: color,
                title: `${statusEmoji} ${type}`,
                title_link: getIncidentUrl(incident.incidentId),
                fields: [
                    {
                        title: 'Incident ID',
                        value: incident.incidentId,
                        short: true
                    },
                    {
                        title: 'Severity',
                        value: incident.severity,
                        short: true
                    },
                    {
                        title: 'Status',
                        value: incident.status,
                        short: true
                    },
                    {
                        title: 'Service',
                        value: incident.service || 'Unknown',
                        short: true
                    },
                    {
                        title: 'Title',
                        value: incident.title,
                        short: false
                    },
                    {
                        title: 'Description',
                        value: incident.description || 'No description available',
                        short: false
                    }
                ],
                footer: 'CloudOps Incident Dashboard',
                ts: Math.floor(new Date(timestamp).getTime() / 1000)
            }
        ]
    };
    
    // Add assignee if available
    if (incident.assignedTo) {
        payload.attachments[0].fields.push({
            title: 'Assigned To',
            value: incident.assignedTo,
            short: true
        });
    }
    
    // Add resolution time for resolved incidents
    if (incident.status === 'Resolved' && incident.resolvedAt) {
        const resolutionTime = calculateResolutionTime(incident.timestamp, incident.resolvedAt);
        payload.attachments[0].fields.push({
            title: 'Resolution Time',
            value: resolutionTime,
            short: true
        });
    }
    
    return payload;
}

/**
 * Get incident URL (placeholder - update with your actual dashboard URL)
 */
function getIncidentUrl(incidentId) {
    // Update this with your actual CloudFront domain
    const dashboardDomain = process.env.DASHBOARD_DOMAIN || 'https://d323fhlcf39ntc.cloudfront.net';
    return `${dashboardDomain}/incidents/${incidentId}`;
}

/**
 * Calculate resolution time
 */
function calculateResolutionTime(startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

/**
 * Send message to Slack
 */
function sendToSlack(webhookUrl, payload) {
    return new Promise((resolve, reject) => {
        const options = url.parse(webhookUrl);
        options.method = 'POST';
        options.headers = {
            'Content-Type': 'application/json',
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(data);
                } else {
                    reject(new Error(`Slack API returned status ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(JSON.stringify(payload));
        req.end();
    });
}
