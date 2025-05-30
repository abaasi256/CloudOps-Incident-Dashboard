import { IncidentRepository } from '../shared/incidentRepository.js';
import { mapCloudWatchAlarmToIncident, logger } from '../shared/utils.js';
import { sendNotification } from '../shared/notifications.js';

const incidentRepo = new IncidentRepository();

export const handler = async (event, context) => {
  logger.info('Processing EventBridge event', { 
    eventSource: event.source,
    detailType: event['detail-type'],
    requestId: context.awsRequestId
  });

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
    
    // Handle other AWS service events
    else {
      logger.warn('Unhandled event type', { 
        source: event.source, 
        detailType: event['detail-type'] 
      });
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Event type not handled' })
      };
    }

    if (incident) {
      logger.info('Incident processed successfully', { 
        incidentId: incident.incidentId,
        severity: incident.severity,
        status: incident.status
      });
      
      // Send notification for the incident
      try {
        await sendNotification({
          type: getNotificationType(event),
          incident: incident,
          timestamp: new Date().toISOString()
        });
        logger.info('Notification sent', { incidentId: incident.incidentId });
      } catch (notificationError) {
        logger.error('Failed to send notification', notificationError, {
          incidentId: incident.incidentId
        });
        // Don't fail the entire process if notification fails
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Event processed successfully',
        incidentId: incident?.incidentId
      })
    };

  } catch (error) {
    logger.error('Error processing event', error, { 
      event: JSON.stringify(event),
      requestId: context.awsRequestId
    });

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process event',
        requestId: context.awsRequestId
      })
    };
  }
};

async function processCloudWatchAlarm(alarmDetail) {
  logger.info('Processing CloudWatch alarm', { 
    alarmName: alarmDetail.AlarmName,
    newState: alarmDetail.NewStateValue,
    previousState: alarmDetail.PreviousStateValue
  });

  // Only create incidents for ALARM state, update/resolve for OK state
  if (alarmDetail.NewStateValue === 'ALARM') {
    // Check if incident already exists for this alarm
    const existingIncidents = await incidentRepo.listIncidents({
      // We would need to implement a search by alarm ARN
      // For now, create new incident
    });

    const incident = mapCloudWatchAlarmToIncident(alarmDetail);
    await incidentRepo.createIncident(incident);
    
    logger.info('Created new incident from CloudWatch alarm', { 
      incidentId: incident.incidentId,
      alarmName: alarmDetail.AlarmName
    });

    return incident;
  } 
  else if (alarmDetail.NewStateValue === 'OK') {
    // Find and resolve related incidents
    // This would require implementing alarm ARN lookup
    logger.info('CloudWatch alarm resolved, should update related incidents', {
      alarmName: alarmDetail.AlarmName
    });
  }

  return null;
}

function getNotificationType(event) {
  if (event.source === 'aws.cloudwatch') {
    return 'CloudWatch Alarm';
  } else if (event.source === 'custom.incident-system') {
    return event['detail-type'];
  }
  return 'Incident Notification';
}

async function processCustomEvent(event) {
  logger.info('Processing custom event', { 
    detailType: event['detail-type'],
    detail: event.detail
  });

  switch (event['detail-type']) {
    case 'Incident Created':
      return await handleIncidentCreated(event.detail);
    
    case 'Incident Updated':
      return await handleIncidentUpdated(event.detail);
    
    case 'Service Health Check':
      return await handleServiceHealthCheck(event.detail);
    
    default:
      logger.warn('Unknown custom event type', { detailType: event['detail-type'] });
      return null;
  }
}

async function handleIncidentCreated(detail) {
  const incident = {
    incidentId: detail.incidentId,
    title: detail.title,
    description: detail.description,
    severity: detail.severity,
    status: detail.status || 'New',
    service: detail.service,
    source: detail.source || 'manual',
    timestamp: detail.timestamp || new Date().toISOString(),
    assignedTo: detail.assignedTo,
    tags: detail.tags || []
  };

  await incidentRepo.createIncident(incident);
  logger.info('Custom incident created', { incidentId: incident.incidentId });
  
  return incident;
}

async function handleIncidentUpdated(detail) {
  const { incidentId, ...updates } = detail;
  
  const updatedIncident = await incidentRepo.updateIncident(incidentId, updates);
  logger.info('Incident updated', { incidentId, updates: Object.keys(updates) });
  
  return updatedIncident;
}

async function handleServiceHealthCheck(detail) {
  // Create incident if service is unhealthy
  if (detail.status === 'unhealthy') {
    const incident = {
      incidentId: createIncidentId(),
      title: `Service Health Issue: ${detail.serviceName}`,
      description: `Health check failed for ${detail.serviceName}: ${detail.message}`,
      severity: detail.severity || 'Medium',
      status: 'New',
      service: detail.serviceName,
      source: 'health-check',
      timestamp: new Date().toISOString(),
      metadata: {
        healthCheckUrl: detail.url,
        responseTime: detail.responseTime,
        statusCode: detail.statusCode
      },
      tags: ['health-check', detail.serviceName]
    };

    await incidentRepo.createIncident(incident);
    logger.info('Health check incident created', { 
      incidentId: incident.incidentId,
      serviceName: detail.serviceName
    });
    
    return incident;
  }

  return null;
}
