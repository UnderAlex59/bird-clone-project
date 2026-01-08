# Kubernetes Runbook

## Prerequisites
- kubectl configured for a cluster
- NGINX Ingress Controller installed (ingressClassName: nginx)
- A default StorageClass (or set storageClassName in the MySQL StatefulSets)
- A CNI that enforces NetworkPolicy (required for networkpolicies.yaml)

## Build images
Build service images from the repo root (details in `DOCKER-BUILD.md`):
```shell
docker build -t ums:2.0 ums
docker build -t twitter:2.0 twitter
docker build -t frontend:2.0 frontend
```

If you use a local cluster, load the images:
```shell
# kind
kind load docker-image ums:2.0 twitter:2.0 frontend:2.0

# minikube
minikube image load ums:2.0
minikube image load twitter:2.0
minikube image load frontend:2.0
```

If you use a remote cluster, push the images to a registry and update the tags in the
manifests.

## Deploy
Update the auth secret before deploying:
```shell
# Edit k8s/secrets.yaml and set GitHub OAuth credentials
# For GitHub OAuth, ensure GITHUB_REDIRECT_URI matches your GitHub App callback
```
```shell
minikube addons enable ingress
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
minikube tunnel
kubectl get svc -n ingress-nginx ingress-nginx-controller
```
После этого добавить в hosts: <EXTERNAL-IP> app.local.


```shell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/mysql-ums.yaml
kubectl apply -f k8s/mysql-twitter.yaml
kubectl apply -f k8s/ums.yaml
kubectl apply -f k8s/twitter.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/networkpolicies.yaml
kubectl apply -f k8s/ingress.yaml
```

## Verify
```shell
kubectl get pods -n apps
kubectl rollout status -n apps deploy/ums
kubectl rollout status -n apps deploy/twitter
kubectl rollout status -n apps deploy/frontend
kubectl rollout status -n apps statefulset/mysql-ums
kubectl rollout status -n apps statefulset/mysql-twitter
```

## Access
Ingress uses the host `app.local`. Point it to your ingress controller address and open:
- http://app.local/
- http://app.local/api/ums/...
- http://app.local/api/twitter/...

### Minikube ingress service type
The Minikube ingress addon exposes the controller as a `NodePort` by default, so you must use the
NodePort in the URL:
```shell
minikube addons enable ingress
kubectl get svc -n ingress-nginx ingress-nginx-controller -o wide
# http://app.local:<nodePort>/
```

## Local DNS (app.local)
For local clusters, map `app.local` to your ingress controller address:
```shell
# minikube
minikube ip

# kind (ingress exposed on host)
# use 127.0.0.1 if ingress listens on host 80/443
```

Add a hosts entry:
- Windows: `C:\Windows\System32\drivers\etc\hosts`
- macOS/Linux: `/etc/hosts`

Add a line:
```
<ingress-ip> app.local
```

## Auth API
UMS issues JWT tokens:
- POST http://app.local/api/ums/auth/register
- POST http://app.local/api/ums/auth/login
- POST http://app.local/api/ums/auth/rotate-secret
- POST http://app.local/api/ums/auth/introspect

Include `Authorization: Bearer <token>` when calling UMS/Twitter endpoints.

GitHub OAuth flow starts at:
- http://app.local/api/ums/oauth2/authorization/github

On a local cluster, add an `/etc/hosts` entry for `app.local` that points to the ingress
controller IP or use a local DNS mapping solution of your choice.

If DNS in your cluster is labeled differently than `k8s-app: kube-dns`, adjust the selector
in `k8s/networkpolicies.yaml`.
