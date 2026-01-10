#!/bin/bash

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration file
CONFIG_FILE="config.yaml"

# Function to print colored messages
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to parse YAML (simple key-value parser)
parse_yaml() {
    local prefix=$2
    local s='[[:space:]]*' w='[a-zA-Z0-9_]*' fs=$(echo @|tr @ '\034')
    sed -ne "s|^\($s\):|\1|" \
         -e "s|^\($s\)\($w\)$s:$s[\"']\(.*\)[\"']$s\$|\1$fs\2$fs\3|p" \
         -e "s|^\($s\)\($w\)$s:$s\(.*\)$s\$|\1$fs\2$fs\3|p" $1 |
    awk -F$fs '{
        indent = length($1)/2;
        vname[indent] = $2;
        for (i in vname) {if (i > indent) {delete vname[i]}}
        if (length($3) > 0) {
            vn=""; for (i=0; i<indent; i++) {vn=(vn)(vname[i])("_")}
            printf("%s%s%s=\"%s\"\n", "'$prefix'",vn, $2, $3);
        }
    }'
}

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
    print_error "Configuration file '$CONFIG_FILE' not found!"
    print_info "Please copy 'config.example.yaml' to 'config.yaml' and fill in your values:"
    echo ""
    echo "    cp config.example.yaml config.yaml"
    echo ""
    print_info "Then edit 'config.yaml' with your GitHub OAuth credentials and other settings."
    print_info "See SETUP_GUIDE.md for detailed instructions."
    exit 1
fi

print_info "Loading configuration from $CONFIG_FILE..."

# Parse configuration file
eval $(parse_yaml $CONFIG_FILE "config_")

# Extract values
CLUSTER_NAME=${config_cluster_name:-"todoapp-cluster"}
PORT=${config_cluster_port:-"8080"}
NAMESPACE=${config_advanced_namespace:-"todoapp-system"}
CHART_PATH="./charts/todoapp"
RELEASE_NAME="todoapp"

# Validate required fields
REQUIRED_FIELDS=(
    "config_github_oauth_clientId"
    "config_github_oauth_clientSecret"
    "config_security_oauth2State"
    "config_security_jwtKey"
    "config_database_password"
)

VALIDATION_FAILED=false
for field in "${REQUIRED_FIELDS[@]}"; do
    if [ -z "${!field}" ] || [ "${!field}" == "YOUR_GITHUB_CLIENT_ID" ] || \
       [ "${!field}" == "YOUR_GITHUB_CLIENT_SECRET" ] || \
       [ "${!field}" == "GENERATE_RANDOM_STRING_HERE" ] || \
       [ "${!field}" == "GENERATE_RANDOM_JWT_KEY_HERE" ] || \
       [ "${!field}" == "YOUR_DB_PASSWORD" ] || \
       [ "${!field}" == "YOUR_SECURE_DB_PASSWORD" ]; then
        print_error "Required field '$field' is not configured properly in $CONFIG_FILE"
        VALIDATION_FAILED=true
    fi
done

if [ "$VALIDATION_FAILED" = true ]; then
    print_error "Please update $CONFIG_FILE with your actual values"
    print_info "See SETUP_GUIDE.md for instructions"
    exit 1
fi

# Check if update mode
UPDATE_MODE=false
if [ "$1" == "--update" ]; then
    UPDATE_MODE=true
    print_info "Running in UPDATE mode - will upgrade existing deployment"
fi

# Create cluster (skip if updating)
if [ "$UPDATE_MODE" = false ]; then
    print_info "Creating k3d cluster '$CLUSTER_NAME' with port mapping $PORT:80"
    k3d cluster create "${CLUSTER_NAME}" \
      --port "${PORT}:80@loadbalancer" \
      --port "8443:443@loadbalancer" \
      --k3s-arg "--disable=traefik@server:*" \
      --k3s-arg '--kube-apiserver-arg=anonymous-auth=true@server:*'

    if [ $? -ne 0 ]; then
        print_error "Failed to create k3d cluster '$CLUSTER_NAME'"
        exit 1
    fi

    print_info "Installing Istio using istioctl..."
    istioctl install --set profile=default -y

    if [ $? -ne 0 ]; then
        print_error "Failed to install Istio"
        exit 1
    fi

    print_info "Creating namespace '$NAMESPACE' and enabling Istio injection..."
    kubectl create namespace $NAMESPACE

    if [ $? -ne 0 ]; then
        print_error "Failed to create namespace '$NAMESPACE'"
        exit 1
    fi

    kubectl label namespace $NAMESPACE istio-injection=enabled

    if [ $? -ne 0 ]; then
        print_error "Failed to label namespace with istio-injection=enabled"
        exit 1
    fi
fi

# Generate Helm values override file
print_info "Generating Helm values from configuration..."

TEMP_VALUES=$(mktemp)
cat > $TEMP_VALUES <<EOF
global:
  rest:
    service:
      port: 5000
      fqdn: http://todoapp-rest.${NAMESPACE}.svc.cluster.local
  graphql:
    service:
      port: 8000
  ui:
    service:
      port: 80
  postgres:
    service:
      port: 5432
      fqdn: todoapp-postgres.${NAMESPACE}.svc.cluster.local

rest:
  deployment:
    replicas: ${config_advanced_replicas:-1}
    resources:
      limits:
        cpu: ${config_app_resources_rest_limits_cpu:-"1"}
        memory: ${config_app_resources_rest_limits_memory:-"256Mi"}
      requests:
        cpu: ${config_app_resources_rest_requests_cpu:-"512m"}
        memory: ${config_app_resources_rest_requests_memory:-"128Mi"}
    image:
      name: ${config_docker_registry:-"victoruzunov"}/todoservice
      tag: ${config_docker_tags_rest:-"project"}
      pullPolicy: Always
  app:
    log:
      level: ${config_app_log_level:-"debug"}
      format: ${config_app_log_format:-"text"}
    oauth:
      clientId: ${config_github_oauth_clientId}
      clientSecret: ${config_github_oauth_clientSecret}
      redirectUrl: ${config_github_oauth_redirectUrl}
      scopes: ${config_github_oauth_scopes:-"read:org,user"}
      oauth2State: ${config_security_oauth2State}
      jwtKey: ${config_security_jwtKey}

graphql:
  deployment:
    replicas: ${config_advanced_replicas:-1}
    resources:
      limits:
        cpu: ${config_app_resources_graphql_limits_cpu:-"1"}
        memory: ${config_app_resources_graphql_limits_memory:-"256Mi"}
      requests:
        cpu: ${config_app_resources_graphql_requests_cpu:-"512m"}
        memory: ${config_app_resources_graphql_requests_memory:-"128Mi"}
    image:
      name: ${config_docker_registry:-"victoruzunov"}/graphql
      tag: ${config_docker_tags_graphql:-"project"}
      pullPolicy: Always
  app:
    log:
      level: ${config_app_log_level:-"debug"}
      format: ${config_app_log_format:-"text"}

postgres:
  deployment:
    image:
      version: "16.4"
    migrations:
      image: ${config_docker_registry:-"victoruzunov"}/migrate
      pullPolicy: Always
      tag: ${config_docker_tags_migrations:-"project"}
  app:
    postgres:
      databaseHost: ${config_database_host:-"localhost"}
      databasePort: ${config_database_port:-"5432"}
      databaseUser: ${config_database_user:-"postgres"}
      databasePassword: ${config_database_password}
      databaseName: ${config_database_name:-"todolist_db"}
      databaseSslmode: ${config_database_sslmode:-"disable"}
      dir: "./migrations"

ui:
  deployment:
    image:
      name: ${config_docker_registry:-"victoruzunov"}/ui
      tag: ${config_docker_tags_ui:-"latest"}
      pullPolicy: Always
EOF

# Install or upgrade Helm chart
if [ "$UPDATE_MODE" = true ]; then
    print_info "Upgrading Helm release '$RELEASE_NAME' in namespace '$NAMESPACE'..."
    helm upgrade "$RELEASE_NAME" "$CHART_PATH" \
        --namespace $NAMESPACE \
        --values $TEMP_VALUES
else
    print_info "Installing Helm chart from '$CHART_PATH' in namespace '$NAMESPACE'..."
    helm install "$RELEASE_NAME" "$CHART_PATH" \
        --namespace $NAMESPACE \
        --create-namespace \
        --values $TEMP_VALUES
fi

if [ $? -ne 0 ]; then
    print_error "Failed to install/upgrade Helm chart"
    rm -f $TEMP_VALUES
    exit 1
fi

# Cleanup temp file
rm -f $TEMP_VALUES

print_info "Waiting for pods to be ready..."
kubectl wait --for=condition=ready pod --all -n $NAMESPACE --timeout=300s || true

echo ""
print_info "=========================================="
print_info "Setup completed successfully!"
print_info "=========================================="
echo ""
print_info "Your TodoList application is now running!"
echo ""
print_info "Access the application at: http://localhost:${PORT}"
echo ""
print_info "Useful commands:"
echo "  - View pods:        kubectl get pods -n $NAMESPACE"
echo "  - View services:    kubectl get svc -n $NAMESPACE"
echo "  - View logs:        kubectl logs -n $NAMESPACE <pod-name>"
echo "  - Delete cluster:   k3d cluster delete $CLUSTER_NAME"
echo ""
print_info "To update the deployment after config changes, run:"
echo "  ./setup.sh --update"
echo ""

