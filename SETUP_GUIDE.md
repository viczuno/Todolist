# TodoList Application - Setup Guide

This guide will help you set up and run the TodoList application on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Docker** (v20.10+): [Install Docker](https://docs.docker.com/get-docker/)
- **k3d** (v5.0+): [Install k3d](https://k3d.io/#installation)
- **kubectl** (v1.20+): [Install kubectl](https://kubernetes.io/docs/tasks/tools/)
- **Helm** (v3.0+): [Install Helm](https://helm.sh/docs/intro/install/)
- **istioctl** (v1.20+): [Install Istio](https://istio.io/latest/docs/setup/getting-started/#download)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Todolist
```

### 2. Create Your Configuration File

Copy the example configuration file and edit it with your details:

```bash
cp config.example.yaml config.yaml
```

### 3. Set Up GitHub OAuth Application

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the details:
   - **Application name**: TodoList App (or any name you prefer)
   - **Homepage URL**: `http://localhost:8080` (or your chosen port)
   - **Authorization callback URL**: `http://localhost:8080/login/github/callback`
4. Click **"Register application"**
5. Copy the **Client ID** and generate a **Client Secret**
6. Update your `config.yaml` file with these credentials

### 4. Generate Security Keys

Generate secure random keys for OAuth and JWT:

```bash
# Generate OAuth2 State
echo "oauth2State: $(openssl rand -base64 32)"

# Generate JWT Key
echo "jwtKey: $(openssl rand -base64 32)"
```

Copy these values into your `config.yaml` file.

### 5. Configure Your Settings

Edit `config.yaml` and update the following required fields:

```yaml
github:
  oauth:
    clientId: "YOUR_GITHUB_CLIENT_ID"        # From step 3
    clientSecret: "YOUR_GITHUB_CLIENT_SECRET" # From step 3
    redirectUrl: "http://localhost:8080/login/github/callback"  # Match your port

security:
  oauth2State: "YOUR_GENERATED_OAUTH_STATE"  # From step 4
  jwtKey: "YOUR_GENERATED_JWT_KEY"           # From step 4

database:
  password: "YOUR_SECURE_DB_PASSWORD"        # Choose a secure password
```

### 6. Run the Setup Script

Make the setup script executable and run it:

```bash
chmod +x setup.sh
./setup.sh
```

The script will:
- Load your configuration from `config.yaml`
- Create a k3d Kubernetes cluster
- Install Istio service mesh
- Create the necessary namespace
- Deploy all application components (PostgreSQL, REST API, GraphQL API, UI)
- Run database migrations

### 7. Verify the Deployment

Check that all pods are running:

```bash
kubectl get pods -n todoapp-system
```

You should see all pods in "Running" status.

### 8. Access the Application

Open your browser and navigate to:

```
http://localhost:8080
```

You should see the login page. Click "Login with GitHub" to authenticate.

## Configuration Options

### Cluster Settings

```yaml
cluster:
  name: todoapp-cluster    # Name of your k3d cluster
  port: 8080              # Port to access the app (localhost:8080)
```

### GitHub OAuth

```yaml
github:
  oauth:
    clientId: "..."        # Your OAuth App Client ID
    clientSecret: "..."    # Your OAuth App Client Secret
    redirectUrl: "..."     # Must match OAuth App callback URL
    scopes: "read:org,user"  # Required GitHub permissions
```

### Database

```yaml
database:
  user: "postgres"
  password: "..."          # Your database password
  name: "todolist_db"     # Database name
```

### Logging

```yaml
app:
  log:
    level: "debug"         # Options: debug, info, warn, error
    format: "text"         # Options: text, json
```

## Troubleshooting

### Pods Not Starting

Check pod logs:
```bash
kubectl logs -n todoapp-system <pod-name>
```

### Port Already in Use

If port 8080 is already in use, change it in `config.yaml`:
```yaml
cluster:
  port: 9090  # Or any available port
```

Then update your GitHub OAuth callback URL to match.

### Database Connection Issues

Verify PostgreSQL is running:
```bash
kubectl get pods -n todoapp-system | grep postgres
```

Check database logs:
```bash
kubectl logs -n todoapp-system todoapp-postgres-<pod-id>
```

### OAuth Login Fails

1. Verify your GitHub OAuth App callback URL matches your configuration
2. Check that the Client ID and Secret are correct
3. Ensure you're a member of the configured GitHub organization (if set)

## Cleanup

To delete the cluster and all resources:

```bash
k3d cluster delete todoapp-cluster
```

(Replace `todoapp-cluster` with your cluster name from `config.yaml`)

## Development

### Rebuilding Images

If you make code changes and want to rebuild:

```bash
# Build and push your images
cd todoservice
make docker-build docker-push

cd ../graphqlServer
make docker-build docker-push

# Update the deployment
helm upgrade todoapp ./charts/todoapp -n todoapp-system
```

### Updating Configuration

If you change `config.yaml`, run:

```bash
./setup.sh --update
```

This will update the Helm deployment with new values.

## GitHub Organization Setup (Optional but Recommended)

For proper role-based access control:

1. Create a GitHub Organization
2. Create three teams: `readers`, `writers`, `admins`
3. Add users to appropriate teams
4. Update `config.yaml` with your organization name

Team permissions:
- **Readers**: Can view todo lists they're part of
- **Writers**: Can create/update/delete todos and lists
- **Admins**: Full access to all resources

## Support

For issues or questions:
1. Check the [README.md](README.md) for architecture details
2. Review application logs: `kubectl logs -n todoapp-system <pod-name>`
3. Check Istio gateway: `kubectl get gateway -n todoapp-system`

## Security Notes

⚠️ **Important**: 
- Never commit `config.yaml` to version control
- Use strong, random values for `oauth2State` and `jwtKey`
- Change the default database password
- For production, use proper secret management (e.g., Kubernetes Secrets, Vault)

