# User Guide - CloudOps Incident Dashboard

## Getting Started

### Accessing the Dashboard

1. Navigate to your CloudFront URL (provided after deployment)
2. Click "Create Account" if you're a new user
3. Fill in your email, name, and password
4. Check your email for verification code
5. Enter the verification code to activate your account

### First Login

After logging in for the first time:
1. You'll see the main dashboard with system overview
2. If no incidents exist, you'll see empty states with helpful messages
3. Use the sidebar navigation to explore different sections

## Dashboard Overview

### Main Dashboard

The dashboard provides a real-time view of your incident management system:

**Key Metrics Cards:**
- **Active Incidents**: Current unresolved incidents
- **Critical**: High-priority incidents requiring immediate attention
- **Resolved Today**: Incidents closed in the last 24 hours
- **MTTR**: Mean Time To Resolution average

**Charts:**
- **Incident Trends**: 7-day view of new incidents vs. resolved
- **Severity Distribution**: Pie chart showing incident breakdown by severity

**Recent Incidents**: Quick list of the 5 most recent incidents

### Navigation

**Sidebar Menu:**
- **Dashboard**: System overview and metrics
- **Incidents**: Full incident list with filtering
- **Create Incident**: Form to report new incidents

**Top Bar:**
- **System Status**: Green indicator when operational
- **Notifications**: Bell icon with alert badge
- **User Menu**: Profile info and sign-out option

## Managing Incidents

### Creating an Incident

1. Click "Create Incident" in the sidebar or use the + button
2. Fill in required fields:
   - **Title**: Brief, descriptive name for the incident
   - **Service**: Affected system/service (required)
   - **Severity**: Critical, High, Medium, or Low
   - **Description**: Detailed explanation of the issue
   - **Assigned To**: Email of person responsible (optional)
   - **Tags**: Additional labels for categorization

3. Click "Create Incident" to save

**Best Practices:**
- Use clear, specific titles (e.g., "API Gateway 5xx errors spike" vs "Error")
- Include impact assessment in description
- Set appropriate severity based on business impact
- Assign to appropriate team member immediately

### Viewing Incident Lists

The Incidents page shows all incidents with:

**Filtering Options:**
- **Search**: Free text search across title, description, and service
- **Status**: Filter by New, Acknowledged, In Progress, or Resolved
- **Severity**: Filter by Critical, High, Medium, or Low
- **Clear Filters**: Reset all filters

**Incident Information:**
- Title with severity and status badges
- Service name and creation time
- Assigned person (if any)
- Incident ID for reference

### Incident Details

Click any incident to view detailed information:

**Left Panel - Details:**
- Full description
- Timeline of events (created, updated, resolved)
- Duration tracking

**Right Panel - Metadata:**
- Current status and severity
- Assignment information
- Service details
- Associated tags

**Editing Incidents:**
1. Click "Edit" button in top right
2. Modify any field except ID and timestamps
3. Click "Save" to update
4. Changes are immediately reflected

### Status Workflow

**Recommended Status Progression:**
1. **New**: Incident just created, awaiting triage
2. **Acknowledged**: Team is aware and investigating
3. **In Progress**: Actively working on resolution
4. **Resolved**: Issue fixed and verified

**Automatic Timestamps:**
- Setting status to "Resolved" automatically records resolution time
- Duration is calculated from creation to resolution
- Timeline shows all status changes

## Advanced Features

### Real-time Updates

The dashboard automatically refreshes every 30 seconds to show:
- New incidents created by automated systems
- Status changes made by team members
- Updated metrics and charts

### CloudWatch Integration

The system automatically creates incidents from CloudWatch alarms:
- **ALARM** state triggers new incident creation
- **OK** state can resolve related incidents
- Alarm metadata is preserved in incident details
- Service type is inferred from CloudWatch namespace

### Severity Guidelines

**Critical**: Complete service outage, security breach, data loss
- Customer-facing services down
- Revenue-impacting issues
- Security incidents

**High**: Major feature broken, significant performance degradation
- Core functionality affected
- Multiple users impacted
- SLA at risk

**Medium**: Minor feature issues, moderate performance problems
- Limited user impact
- Workaround available
- Non-critical services affected

**Low**: Cosmetic issues, minor bugs, planned maintenance
- Minimal user impact
- Nice-to-have features
- Documentation issues

### Tagging Best Practices

Use consistent tags for better organization:
- **Environment**: `prod`, `staging`, `dev`
- **Component**: `api`, `database`, `frontend`, `auth`
- **Team**: `platform`, `security`, `data`
- **Priority**: `customer-facing`, `internal`, `maintenance`

## Troubleshooting

### Common Issues

**Can't Sign In:**
- Check email for verification code
- Ensure password meets requirements (8+ chars, uppercase, number, symbol)
- Contact admin if account is locked

**Incidents Not Loading:**
- Check your internet connection
- Refresh the page
- Clear browser cache if issues persist

**Can't Create Incidents:**
- Ensure all required fields are filled
- Check that you're signed in
- Verify your account has proper permissions

**Charts Not Updating:**
- Data updates every 30 seconds automatically
- Click refresh button to manually update
- Check if there are any incidents to display

### Keyboard Shortcuts

- **Ctrl/Cmd + K**: Quick search
- **G → D**: Go to Dashboard
- **G → I**: Go to Incidents
- **G → N**: Create New Incident
- **Esc**: Close modals/forms

### Mobile Usage

The dashboard is optimized for mobile devices:
- Responsive design adapts to screen size
- Touch-friendly buttons and navigation
- Swipe gestures for navigation
- Readable text at all sizes

### Browser Support

**Supported Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Features requiring modern browsers:**
- Real-time updates
- Local storage for preferences
- Advanced charts and visualizations

## API Usage

For advanced users, the system provides a REST API:

**Base URL**: Your API Gateway URL
**Authentication**: Bearer token (JWT from Cognito)

**Key Endpoints:**
```
GET /incidents - List all incidents
POST /incidents - Create new incident  
GET /incidents/{id} - Get incident details
PUT /incidents/{id} - Update incident
GET /incidents/stats - Get statistics
GET /health - Health check
```

**Example API Call:**
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-api-url/incidents
```

## Best Practices

### Incident Response Workflow

1. **Detection**: Automated alerts or manual reporting
2. **Triage**: Assess severity and assign appropriate team
3. **Investigation**: Gather information and identify root cause
4. **Resolution**: Implement fix and verify solution
5. **Documentation**: Update incident with timeline and lessons learned
6. **Review**: Post-incident analysis for improvement

### Team Collaboration

- **Use @mentions** in descriptions to notify team members
- **Update status regularly** to keep stakeholders informed
- **Add relevant tags** for better organization and reporting
- **Document workarounds** in incident description
- **Include timeline** of actions taken

### Monitoring and Alerting

- **Set up CloudWatch alarms** for critical metrics
- **Configure notification channels** (email, Slack, PagerDuty)
- **Review incident patterns** regularly for proactive improvements
- **Maintain runbooks** for common incident types

## Getting Help

### Support Channels

- **Documentation**: Check this user guide and architecture docs
- **GitHub Issues**: Report bugs or request features
- **Team Chat**: Contact your DevOps team
- **Email**: admin@yourcompany.com

### Training Resources

- **Video Tutorials**: Available in company learning portal
- **Runbooks**: Service-specific incident response procedures
- **Best Practices**: Internal wiki documentation
- **Office Hours**: Weekly Q&A sessions with platform team

### Feedback

We welcome feedback to improve the system:
- **Feature Requests**: Submit via GitHub issues
- **Bug Reports**: Include steps to reproduce
- **UI/UX Suggestions**: Screenshots help explain issues
- **Performance Issues**: Include browser and network details

Remember: The goal is rapid incident resolution with clear communication and thorough documentation for continuous improvement.
