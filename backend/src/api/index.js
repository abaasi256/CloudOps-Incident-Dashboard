import { IncidentRepository } from './shared/incidentRepository.js';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { 
  createApiResponse, 
  validateIncidentData, 
  createIncidentId,
  INCIDENT_STATUS,
  INCIDENT_SEVERITY,
  logger 
} from './shared/utils.js';

const incidentRepo = new IncidentRepository();
const eventBridge = new EventBridgeClient({ region: process.env.AWS_REGION || 'us-east-1' });

export const handler = async (event, context) => {
  logger.info('API request received', {
    method: event.httpMethod,
    path: event.path,
    requestId: context.awsRequestId
  });

  try {
    const { httpMethod, path, pathParameters, queryStringParameters, body } = event;

    // Health check endpoint
    if (path === '/health' && httpMethod === 'GET') {
      return createApiResponse(200, { 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    }

    // CORS preflight
    if (httpMethod === 'OPTIONS') {
      return createApiResponse(200, { message: 'CORS preflight successful' });
    }

    // Parse request body if present
    let requestBody = null;
    if (body) {
      try {
        requestBody = JSON.parse(body);
      } catch (error) {
        return createApiResponse(400, null, 'Invalid JSON in request body');
      }
    }

    // Route requests - Handle both /incidents and /test-incidents
    if (path === '/incidents' || path === '/test-incidents') {
      switch (httpMethod) {
        case 'GET':
          return await handleListIncidents(queryStringParameters || {});
        case 'POST':
          return await handleCreateIncident(requestBody, path.includes('test'));
        default:
          return createApiResponse(405, null, 'Method not allowed');
      }
    }

    // Handle specific incident by ID for both endpoints
    if ((path.startsWith('/incidents/') || path.startsWith('/test-incidents/')) && pathParameters?.id) {
      const incidentId = pathParameters.id;
      const isTest = path.startsWith('/test-incidents/');
      switch (httpMethod) {
        case 'GET':
          return await handleGetIncident(incidentId);
        case 'PUT':
          return await handleUpdateIncident(incidentId, requestBody, isTest);
        default:
          return createApiResponse(405, null, 'Method not allowed');
      }
    }

    // Stats endpoint for both
    if ((path === '/incidents/stats' || path === '/test-incidents/stats') && httpMethod === 'GET') {
      return await handleGetIncidentStats();
    }

    // Route not found
    return createApiResponse(404, null, 'Endpoint not found');

  } catch (error) {
    logger.error('Unhandled API error', error, {
      method: event.httpMethod,
      path: event.path,
      requestId: context.awsRequestId
    });

    return createApiResponse(500, null, 'Internal server error');
  }
};

async function sendEventBridgeEvent(eventType, incident, isTest = false) {
  if (isTest) {
    logger.info('Skipping EventBridge event for test incident', { incidentId: incident.incidentId });
    return;
  }

  try {
    const params = {
      Entries: [
        {
          Source: 'custom.incident-system',
          DetailType: eventType,
          Detail: JSON.stringify(incident),
          Time: new Date()
        }
      ]
    };

    const command = new PutEventsCommand(params);
    await eventBridge.send(command);
    
    logger.info('EventBridge event sent', { 
      type: eventType, 
      incidentId: incident.incidentId 
    });
  } catch (error) {
    logger.error('Failed to send EventBridge event', error, { 
      type: eventType, 
      incidentId: incident.incidentId 
    });
    // Don't fail the API call if EventBridge fails
  }
}

async function handleListIncidents(queryParams) {
  try {
    const filters = {
      status: queryParams.status,
      severity: queryParams.severity,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 50
    };

    // Validate limit
    if (filters.limit > 100) {
      filters.limit = 100;
    }

    const incidents = await incidentRepo.listIncidents(filters);
    
    logger.info('Listed incidents', { 
      count: incidents.length, 
      filters: JSON.stringify(filters) 
    });

    return createApiResponse(200, {
      incidents,
      count: incidents.length,
      filters
    });

  } catch (error) {
    logger.error('Error listing incidents', error);
    return createApiResponse(500, null, 'Failed to retrieve incidents');
  }
}

async function handleCreateIncident(requestBody, isTest = false) {
  try {
    if (!requestBody) {
      return createApiResponse(400, null, 'Request body is required');
    }

    // Set defaults before validation
    const incidentData = {
      title: requestBody.title,
      description: requestBody.description || '',
      severity: requestBody.severity || 'Medium',
      status: requestBody.status || 'New', // Default status
      service: requestBody.service || 'custom',
      source: requestBody.source || 'manual',
      assignedTo: requestBody.assignedTo,
      tags: requestBody.tags || []
    };

    // Validate required fields
    const validationErrors = validateIncidentData(incidentData);
    if (validationErrors.length > 0) {
      logger.error('Validation errors', { errors: validationErrors, data: incidentData });
      return createApiResponse(400, null, `Validation errors: ${validationErrors.join(', ')}`);
    }

    // Create incident with generated ID
    const incident = {
      incidentId: createIncidentId(),
      title: incidentData.title.trim(),
      description: incidentData.description,
      severity: incidentData.severity,
      status: incidentData.status,
      service: incidentData.service,
      source: incidentData.source,
      timestamp: new Date().toISOString(),
      assignedTo: incidentData.assignedTo,
      tags: incidentData.tags
    };

    logger.info('Creating incident', { incident });

    const createdIncident = await incidentRepo.createIncident(incident);
    
    // Send EventBridge event for Slack notification
    await sendEventBridgeEvent('Incident Created', createdIncident, isTest);
    
    logger.info('Incident created successfully', { 
      incidentId: createdIncident.incidentId, 
      severity: createdIncident.severity,
      eventSent: !isTest
    });

    return createApiResponse(201, createdIncident);

  } catch (error) {
    logger.error('Error creating incident', error);
    return createApiResponse(500, null, 'Failed to create incident');
  }
}

async function handleGetIncident(incidentId) {
  try {
    const incident = await incidentRepo.getIncident(incidentId);
    
    if (!incident) {
      return createApiResponse(404, null, 'Incident not found');
    }

    logger.info('Retrieved incident', { incidentId });
    return createApiResponse(200, incident);

  } catch (error) {
    logger.error('Error retrieving incident', error, { incidentId });
    return createApiResponse(500, null, 'Failed to retrieve incident');
  }
}

async function handleUpdateIncident(incidentId, requestBody, isTest = false) {
  try {
    if (!requestBody) {
      return createApiResponse(400, null, 'Request body is required');
    }

    // Check if incident exists
    const existingIncident = await incidentRepo.getIncident(incidentId);
    if (!existingIncident) {
      return createApiResponse(404, null, 'Incident not found');
    }

    // Extract allowed update fields
    const allowedFields = [
      'title', 'description', 'severity', 'status', 
      'assignedTo', 'tags', 'resolvedAt'
    ];
    
    const updates = {};
    allowedFields.forEach(field => {
      if (requestBody[field] !== undefined) {
        updates[field] = requestBody[field];
      }
    });

    // Validate updates
    if (Object.keys(updates).length === 0) {
      return createApiResponse(400, null, 'No valid fields to update');
    }

    // Auto-set resolvedAt if status is being changed to Resolved
    if (updates.status === INCIDENT_STATUS.RESOLVED && !updates.resolvedAt) {
      updates.resolvedAt = new Date().toISOString();
    }

    // Clear resolvedAt if status is changed from Resolved to something else
    if (updates.status && updates.status !== INCIDENT_STATUS.RESOLVED) {
      updates.resolvedAt = null;
    }

    const updatedIncident = await incidentRepo.updateIncident(incidentId, updates);
    
    // Send EventBridge event for significant updates
    if (updates.status) {
      const eventType = updates.status === 'Resolved' ? 'Incident Resolved' : 'Incident Updated';
      await sendEventBridgeEvent(eventType, updatedIncident, isTest);
    }
    
    logger.info('Incident updated', { 
      incidentId, 
      updatedFields: Object.keys(updates),
      eventSent: !isTest && updates.status
    });

    return createApiResponse(200, updatedIncident);

  } catch (error) {
    logger.error('Error updating incident', error, { incidentId });
    return createApiResponse(500, null, 'Failed to update incident');
  }
}

async function handleGetIncidentStats() {
  try {
    const stats = await incidentRepo.getIncidentStats();
    
    logger.info('Retrieved incident stats', { total: stats.total });
    return createApiResponse(200, stats);

  } catch (error) {
    logger.error('Error retrieving incident stats', error);
    return createApiResponse(500, null, 'Failed to retrieve incident statistics');
  }
}
