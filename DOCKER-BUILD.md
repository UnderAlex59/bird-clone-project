# Docker Build Guide

This guide describes how to build Docker images for all services from the repo root.

## Prerequisites
- Docker with build support

## Build all images
From the repo root:
```shell
docker build -t ums:2.0 ums
docker build -t twitter:2.0 twitter
docker build -t frontend:2.0 frontend
```

## Notes
- If you change the tag, update the Kubernetes manifests in `k8s/`.
- Dockerfiles live in `ums/`, `twitter/`, and `frontend/`.
