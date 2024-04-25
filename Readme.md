<div align="center">
  <br/>
  <br/>
   <b>S</b>tg <b>C</b>LI<br/>
  <i>Node.js Command-Line Interface</i>
  <br/><br/>
  <a href="https://github.com/prettier/prettier">
  <img src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg" alt="Code Style: Prettier">
  </a>
  <a title="stg-cli Downloads" href="https://npm-stat.com/charts.html?package=stg-cli&from=2022-01-01&to=2024-01-01">
    <img src="https://img.shields.io/npm/dm/stg-cli" alt="Downloads per Month"/>
  </a>
  <a title="stg-cli Downloads" href="https://npm-stat.com/charts.html?package=stg-cli&from=2022-01-01&to=2024-01-01">
    <img src="https://img.shields.io/npm/dy/stg-cli" alt="Downloads per Year"/>
  </a>
  <a href="https://badge.fury.io/js/stg-cli" title="NPM Version Badge">
    <img src="https://badge.fury.io/js/stg-cli.svg" alt="npm version">
  </a>
  <a href="https://bundlephobia.com/package/stg-cli@latest" rel="nofollow">
  <img src="https://img.shields.io/bundlephobia/minzip/stg-cli?style=flat-square" alt="npm bundle size" data-canonical-src="https://img.shields.io/bundlephobia/minzip/stg-cli?style=flat-square" style="max-width: 100%;">
  </a>
  <br/>
  <br/>
  <br/>
</div>

## Introduction

`Stg-CLI` is a powerful Node.js command-line interface (CLI) tool designed to simplify the initialization and management of applications within a defined pipeline configuration. It seamlessly integrates with GitHub Actions workflows locally and Docker, streamlining your development processes.

## Installation

To use `stg-cli`, install it globally using npm:

```bash
npm install -g stg-cli

Commands

Initialization: Initialize the stg-cli npm package for your project to set up the required configuration files.

bash
$ stg-cli init

Start/Stop Applications: Manage the lifecycle of configured applications by starting or stopping them.
bash
$ stg-cli start <appid>
$ stg-cli stop <appid>

List Configured Applications: View a table of configured applications, displaying their IDs, names, statuses, paths, and UUIDs.
bash
$ stg-cli apps

Kill Service: Terminate the CI/CD service completely or for a specific project.

To kill the CI/CD service completely:
bash
$ stg-cli kill

To kill the CI/CD service for a specific project:
bash
$ stg-cli kill <appid>

Show Version: Display the version number of the stg-cli tool.
bash
$ stg-cli -v

Show Available Commands: Display a list of available commands and their usage.
bash
$ stg-cli -help

Docker Integration: Execute Docker commands as part of the workflow.

Usage
application.json
A filename CreateApplication.json is automatically create in inside the package in which we Define the properties of our applications.

Example:

{
  "applications": [
    {
      "id": "123",
      "name": "MyApp",
      "path": "/path/to/app",
      "uuid": "abc123def456"
    },
    // Add more applications as needed
  ]
}

onetab-pipeline.yml
Create a file named onetab-pipeline.yml in the root of your project. Define the GitHub Actions workflow for stg-cli.

Example:

yaml
Copy code
on:
  push:
    branches:
      - main
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v2
      # Add more steps as needed
```
