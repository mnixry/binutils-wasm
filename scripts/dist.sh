#!/bin/bash -xve

targets=$(pnpm tsx ./scripts/supported.ts)
packages=$(ls -d packages/*)

docker buildx build \
  --progress plain \
  --build-arg TARGET=$targets \
  --build-arg BRANCH=binutils-2_41-branch \
  --output . \
  ./scripts

for package in $packages; do
  package_dist="$package/dist"
  package_folder=$(basename "$package")
  mkdir -p "$package_dist"
  if [ -d "./dist/$package_folder" ]; then
    cp -rv "./dist/$package_folder"/* "$package_dist"
  else
    echo "No dist folder for $package"
  fi
done