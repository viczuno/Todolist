#!/bin/bash

# Helper script to generate secure random keys for config.yaml

echo "=================================="
echo "Security Keys Generator"
echo "=================================="
echo ""
echo "Copy these values into your config.yaml file:"
echo ""
echo "---"
echo "security:"
echo "  oauth2State: \"$(openssl rand -base64 32)\""
echo "  jwtKey: \"$(openssl rand -base64 32)\""
echo "---"
echo ""
echo "database:"
echo "  password: \"$(openssl rand -base64 16)\""
echo "---"
echo ""

