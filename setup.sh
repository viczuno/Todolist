#!/bin/bash

if [ -z "$1" ] || [ -z "$2" ]; then
  echo "Usage: $0 <cluster-name> <port>"
  exit 1
fi

CLUSTER_NAME=$1
PORT=$2

echo "Creating k3d cluster '$CLUSTER_NAME' with port mapping $PORT:80"
k3d cluster create "${CLUSTER_NAME}" \
  --port "${PORT}:80@loadbalancer" \
  --port "8443:443@loadbalancer" \
  --k3s-arg "--disable=traefik@server:*" \
  --k3s-arg '--kube-apiserver-arg=anonymous-auth=true@server:*'
if [ $? -ne 0 ]; then
  echo "Error: Failed to create k3d cluster '$CLUSTER_NAME'."
  exit 1
fi

echo "Installing Istio using istioctl..."
istioctl install --set profile=default
if [ $? -ne 0 ]; then
  echo "Error: Failed to install Istio."
  exit 1
fi

echo "Creating namespace 'todoapp-system' and enabling Istio injection..."
kubectl create namespace todoapp-system
if [ $? -ne 0 ]; then
  echo "Error: Failed to create namespace 'todoapp-system'."
  exit 1
fi

kubectl label namespace todoapp-system istio-injection=enabled
if [ $? -ne 0 ]; then
  echo "Error: Failed to label namespace 'todoapp-system' with istio-injection=enabled."
  exit 1
fi

CHART_PATH="${HOME}/intern-project/charts/todoapp"
RELEASE_NAME="todoapp"

echo "Installing Helm chart from '$CHART_PATH' in 'todoapp-system' namespace..."
helm install "$RELEASE_NAME" "$CHART_PATH" --namespace todoapp-system --create-namespace
if [ $? -ne 0 ]; then
  echo "Error: Failed to install Helm chart '$CHART_PATH'."
  exit 1
fi

echo "Cluster setup and application installation complete."
