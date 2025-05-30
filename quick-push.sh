#!/bin/bash
cd /Users/abaasi/Desktop/CloudOps-Incident-Dashboard
git init
git remote add origin https://github.com/abaasi256/CloudOps-Incident-Dashboard.git
git add .
git commit -m "🎉 Initial commit: CloudOps Incident Dashboard - Production-ready serverless monitoring system"
git branch -M main
git push -u origin main
echo "✅ Successfully pushed to GitHub!"
