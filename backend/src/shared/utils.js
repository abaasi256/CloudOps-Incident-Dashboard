export const INCIDENT_STATUS = {
  NEW: 'New',
  ACKNOWLEDGED: 'Acknowledged',
  IN_PROGRESS: 'InProgress',
  RESOLVED: 'Resolved'
};

export const INCIDENT_SEVERITY = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

export const SERVICE_TYPES = {
  EC2: 'ec2',
  RDS: 'rds',
  LAMBDA: 'lambda',
  API_GATEWAY: 'api-gateway',
  CLOUDWATCH: 'cloudwatch',
  S3: 's3',
  DYNAMODB: 'dynamodb',
  CUSTOM: 'custom'
};

export const createIncidentId = () => {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `INC-${timestamp}-${random}`;
};

export const mapCloudWatchAlarmToIncident = (alarmData) => {
  const severity = mapAlarmStateToSeverity(alarmData.NewStateValue);
  const service = extractServiceFromAlarm(alarmData);
  
  return {
    incidentId: createIncidentId(),
    title: alarmData.AlarmName,
    description: alarmData.AlarmDescription || `CloudWatch alarm: ${alarmData.AlarmName}`,
    severity,
    status: INCIDENT_STATUS.NEW,
    service,
    source: 'cloudwatch',
    timestamp: new Date().toISOString(),
    metadata: {
      alarmArn: alarmData.AlarmArn,
      region: alarmData.Region,
      accountId: alarmData.AWSAccountId,
      metric: {
        namespace: alarmData.Trigger?.Namespace,
        metricName: alarmData.Trigger?.MetricName,
        dimensions: alarmData.Trigger?.Dimensions
      },
      threshold: alarmData.Trigger?.Threshold,
      comparisonOperator: alarmData.Trigger?.ComparisonOperator
    },
    tags: extractTagsFromAlarm(alarmData)
  };
};

const mapAlarmStateToSeverity = (alarmState) => {
  switch (alarmState) {
    case 'ALARM':
      return INCIDENT_SEVERITY.HIGH;
    case 'INSUFFICIENT_DATA':
      return INCIDENT_SEVERITY.MEDIUM;
    case 'OK':
      return INCIDENT_SEVERITY.LOW;
    default:
      return INCIDENT_SEVERITY.MEDIUM;
  }
};

const extractServiceFromAlarm = (alarmData) => {
  const namespace = alarmData.Trigger?.Namespace;
  
  switch (namespace) {
    case 'AWS/EC2':
      return SERVICE_TYPES.EC2;
    case 'AWS/RDS':
      return SERVICE_TYPES.RDS;
    case 'AWS/Lambda':
      return SERVICE_TYPES.LAMBDA;
    case 'AWS/ApiGateway':
      return SERVICE_TYPES.API_GATEWAY;
    case 'AWS/S3':
      return SERVICE_TYPES.S3;
    case 'AWS/DynamoDB':
      return SERVICE_TYPES.DYNAMODB;
    default:
      return SERVICE_TYPES.CUSTOM;
  }
};

const extractTagsFromAlarm = (alarmData) => {
  const tags = ['aws', 'cloudwatch'];
  
  if (alarmData.Trigger?.Namespace) {
    tags.push(alarmData.Trigger.Namespace.toLowerCase().replace('aws/', ''));
  }
  
  // Add severity-based tags
  if (alarmData.NewStateValue === 'ALARM') {
    tags.push('high-priority');
  }
  
  return tags;
};

export const validateIncidentData = (incident) => {
  const errors = [];
  
  if (!incident.title || incident.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!incident.severity || !Object.values(INCIDENT_SEVERITY).includes(incident.severity)) {
    errors.push('Valid severity is required');
  }
  
  if (!incident.status || !Object.values(INCIDENT_STATUS).includes(incident.status)) {
    errors.push('Valid status is required');
  }
  
  if (incident.title && incident.title.length > 200) {
    errors.push('Title must be less than 200 characters');
  }
  
  return errors;
};

export const createApiResponse = (statusCode, data, error = null) => {
  const response = {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    }
  };

  if (error) {
    response.body = JSON.stringify({
      error: error.message || error,
      timestamp: new Date().toISOString()
    });
  } else {
    response.body = JSON.stringify({
      data,
      timestamp: new Date().toISOString()
    });
  }

  return response;
};

export const logger = {
  info: (message, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  
  error: (message, error = null, meta = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  
  warn: (message, meta = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};
