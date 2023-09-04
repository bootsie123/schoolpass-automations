import { HttpRequest, InvocationContext, Timer, app } from "@azure/functions";
import * as df from "durable-functions";
import * as pug from "pug";

import { Logger, Severity } from "../../lib/Logger";
import { getDateYearMonthDay, getDateMonthDayYear } from "../../utils";
import { SchoolPassBus, SchoolPassBusBoardingManifestReportItem } from "../../lib/SchoolPass";

import { FUNCTION_NAME as schoolpassBus } from "../schoolpass/schoolpassBus";
import { FUNCTION_NAME as schoolpassBusBoardingManifestReport } from "../schoolpass/schoolpassBusBoardingManifestReport";
import { FUNCTION_NAME as smtpSend } from "../smtp";

import environment from "../../environment";

const template = pug.compileFile(__dirname + "/../../templates/message.pug");

export const FUNCTION_NAME = "busManifestReportOrchestrator";

/**
 * Responsible for initiating the sync tasks
 * @param context The OrchestrationContext passed to the handler
 * @returns Undefined
 */
export function* orchestratorHandler(context: df.OrchestrationContext) {
  const logger = new Logger(context, FUNCTION_NAME);

  logger.log(Severity.Info, "Starting task...");

  try {
    const buses: SchoolPassBus[] = yield context.df.callActivity(schoolpassBus);

    const busIDs = buses.map(bus => bus.id);

    if (busIDs.length < 1) {
      return logger.forceLog("No buses found. Canceling task...");
    }

    const date = getDateYearMonthDay(new Date());

    const report: SchoolPassBusBoardingManifestReportItem[] = yield context.df.callActivity(
      schoolpassBusBoardingManifestReport,
      {
        sites: "All",
        busType: "1",
        fromDate: date,
        toDate: date,
        reportGrouping: "0",
        buses: busIDs.join(","),
        grades: "",
        busPasses: "",
        sortOrder: "0",
        reportType: 0
      }
    );

    const data = [];

    let studentTotal = 0;

    for (const bus of buses) {
      const students = report.filter(student => student.busRoute === bus.destination);

      studentTotal += students.length;

      data.push({
        students,
        total: students.length
      });
    }

    yield context.df.callActivity(smtpSend, {
      template: "busManifestReport",
      subject: `[${environment.schoolPass.schoolName}] Bus Manifest Report`,
      to: environment.automations.busManifestReport.toEmail,
      body: {
        buses: data,
        studentTotal,
        date: getDateMonthDayYear(new Date())
      }
    });

    logger.forceLog(Severity.Info, "Task completed successfully!");
  } catch (err) {
    logger.forceLog(Severity.Error, "Orchestration Error:", err);
  }
}

/**
 * Manually runs the busManifest task
 * @param input The input from the Azure Function
 * @param context The invocation context of the function
 * @returns An HTTP response
 */
async function httpHandler(input: HttpRequest, context: InvocationContext) {
  const logger = new Logger(context, "taskStart");

  const client = df.getClient(context);

  await client.startNew(FUNCTION_NAME);

  const message = `Running Bus Manifest Report task...`;

  logger.log(Severity.Info, message);

  return {
    status: 200,
    headers: {
      "content-type": "text/html"
    },
    body: template({
      success: true,
      text: message
    })
  };
}

if (environment.automations.busManifestReport.enabled) {
  df.app.orchestration(FUNCTION_NAME, orchestratorHandler);

  app.http(FUNCTION_NAME + "HTTP", {
    route: "run/bus-manifest-report",
    methods: ["GET"],
    authLevel: "anonymous",
    extraInputs: [df.input.durableClient()],
    handler: httpHandler
  });

  app.timer(FUNCTION_NAME + "Timer", {
    schedule: environment.automations.busManifestReport.schedule,
    runOnStartup: !environment.production,
    extraInputs: [df.input.durableClient()],
    handler: async (timer: Timer, context: InvocationContext) => {
      const client = df.getClient(context);

      await client.startNew(FUNCTION_NAME);
    }
  });
}
