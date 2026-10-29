#!/usr/bin/env bash
set -euo pipefail
image="${1:?Usage: verify-production-image.sh IMAGE}"
docker run --rm --entrypoint node "$image" scripts/check-node-version.mjs
docker image inspect "$image" --format '{{.Id}} {{json .RepoDigests}}'
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v mpga-trivy-cache:/root/.cache/ \
  aquasec/trivy:0.69.3@sha256:bcc376de8d77cfe086a917230e818dc9f8528e3c852f7b1aff648949b6258d1c \
  image --scanners vuln --severity HIGH,CRITICAL --exit-code 1 "$image"
