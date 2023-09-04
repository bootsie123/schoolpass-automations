# <img alt="" src="src/public/logo.svg" height="30"> SchoolPass Automations

[![Deploy To Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fbootsie123%2Fschoolpass-automations%2Fmain%2Fazuredeploy.json)
[![License](https://img.shields.io/github/license/bootsie123/schoolpass-automations)](https://github.com/bootsie123/schoolpass-automations/blob/main/LICENSE)
[![Version](https://img.shields.io/github/package-json/v/bootsie123/schoolpass-automations)](https://github.com/bootsie123/schoolpass-automations/blob/main/package.json)

A collection of automation tools for SchoolPass.

## Tools

| Name | Description |
| :--- | :--- |
| Bus Manifest Report | Sends a daily email containing the passenger list for each bus |

## Installation

First, clone the repository using [git](https://git-scm.com/) and then use [npm](https://www.npmjs.com/) to install the necessary node modules. If [Node.js](https://nodejs.org/) is not already installed, please do so before running npm.

```bash
# Clone the repository
git clone https://github.com/bootsie123/schoolpass-automations.git

# Enter the directory
cd schoolpass-automations

# Install the dependencies
npm install
```

Next, copy `default.settings.json` to `local.settings.json`.

```bash
cp default.settings.json local.settings.json
```

_Note: The project must be configured before it can be ran_

## Configuration

In order to run the app, the following configuration options must be set in the `local.settings.json` file or in the function app's configuration settings if deployed to Azure.

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| SCHOOLPASS_USERNAME | String | | The username of the user used to authenticate in SchoolPass |
| SCHOOLPASS_PASSWORD | String | | The password of the user used to authenticate in SchoolPass |
| SMTP_SEND_AS_EMAIL* | String | | The email address used for sending emails via SMTP |
| SMTP_HOST* | String | | The hostname or ip of the SMTP server to use |
| SMTP_PORT* | Int | 587 | The port to use when connecting to the SMTP server |
| SMTP_USE_TLS* | Boolean | false | Set to true if TLS should be used when connecting to the SMTP server, false if otherwise |
| SMTP_USERNAME* | String | | The username to use during authentication with the SMTP server |
| SMTP_PASSWORD* | String | | The password to use during authentication with the SMTP server |

*\*Only needed if using features requiring SMTP*

### Application Settings

The following table shows the various configuration options for each tool which can be set and their default values. These settings are changed in the `local.settings.json` file or in the function app's configuration settings if deployed to Azure.

| Name | Tool | Type | Default | Description |
| --- | --- | --- | --- | --- |
| SCHOOLPASS_SCHOOL_NAME | ALL | String | SchoolPass Automations | The school name shown throughout the application and tools |
| AUTOMATIONS_BUS_MANIFEST_REPORT_ENABLED | Bus Manifest Report | Boolean | false | Set to true if the Bus Manifest Report tool should be enabled, false if otherwise |
| AUTOMATIONS_BUS_MANIFEST_REPORT_SCHEDULE | Bus Manifest Report | String | 0 0 12 * * 1-5 | Determines the frequency of email reports using an [NCronTab](https://github.com/atifaziz/NCrontab) expression. Defaults to 12PM every weekday (M-F) |
| AUTOMATIONS_BUS_MANIFEST_REPORT_TO_EMAIL | Bus Manifest Report | String | | The email to send the bus manifest report to |

## Usage

To start the application locally simply run:

```bash
npm run build

npm run start:local
```

This will start a local web server at `http://localhost:7071`.

### Manually Running Tools

To manually start run a tool, simply visit: `http://localhost:7071/run/tool-name-here`.

For example, to manually run the `Bus Manifest Report` tool, simply visit: `http://localhost:7071/run/bus-manifest-report`

### Tool Schedules

Some tools have the option to run automatically on a schedule without any user input. The scheduling is controlled via a tool setting for each applicable tool and uses [NCrontab](https://github.com/atifaziz/NCrontab) formatted strings. A few example situations are shown below:

**NCrontab Format:**

```
* * * * *
- - - - -
| | | | |
| | | | +----- day of week (0 - 6) (Sunday=0)
| | | +------- month (1 - 12)
| | +--------- day of month (1 - 31)
| +----------- hour (0 - 23)
+------------- min (0 - 59)
```

**Examples:**

| Occurance                     | NCrontab       |
| ----------------------------- | -------------- |
| Every 6 hours                 | 0 _/6 _ \* \*  |
| 12AM every day                | 0 0 0 \* \* \* |
| 1AM every Sunday              | 0 1 \* \* 0    |
| 2AM every 2 days              | 0 2 _/2 _ \*   |
| 2AM on the 1st of every month | 0 2 1 \* \*    |

_Note: For more examples, refer to [crontab guru](https://crontab.guru/)_

## Deployment to Azure

[![Deploy To Azure](https://aka.ms/deploytoazurebutton)](https://portal.azure.com/#create/Microsoft.Template/uri/https%3A%2F%2Fraw.githubusercontent.com%2Fbootsie123%2Fschoolpass-automations%2Fmain%2Fazuredeploy.json)

### Deploy Resources

To deploy the necessary resources to Azure, simply click on the link above and fill out the parameters in the deployment template. By default the location for all resources is based on the choosen `Region`. However, this can be changed by using the `Location` and `App Insights Location` options.

### Deploy the Function App

Once the resources are deployed, the function app itself can be deployed via the [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli). Make sure to have it installed and authenticated via `az login` before proceeding with the following:

```bash
npm run deploy -- APP_NAME
```

_Note: Replace `APP_NAME` with the name of the app used when deploying the Azure resources_

### Configure Application Settings

To change the application's settings, go to the function app in the Azure dashboard and then click on "Configuration" under "Settings" in the left hand side navbar. Refer to the [Configuration](#configuration) and the [Application Settings](#application-settings) sections for specific details on each setting. Also make sure to fill in all required settings with their appropriate values before using the application.

### Reminders

When going through the documentation, remember that all references to `localhost` should be replaced with your function app's URL. Keep in mind that by default all HTTP routes are public. In order to restrict access, networking rules can be setup via "Settings" -> "Networking" -> "Access restriction" in the function app. The [Azure App Service access restrictions](https://learn.microsoft.com/en-us/azure/app-service/overview-access-restrictions) guide offers specifics on how this page can be utilized.

## Contributing

Pull requests are welcome. Any changes are appreciated!

## License

This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/)